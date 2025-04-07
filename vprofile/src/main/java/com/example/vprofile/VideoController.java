package com.example.vprofile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.StandardCopyOption;
import java.nio.file.Files;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    private final VideoService videoService;
    private final FFmpegService ffmpegService;

    @Autowired
    private VideoProcessingService videoProcessingService;

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    public VideoController(FFmpegService ffmpegService, VideoService videoService) {
        this.ffmpegService = ffmpegService;
        this.videoService = videoService;
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadVideo(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") Long userId) {
        if (userId == null || userId <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid user ID.");
        }

        if (file.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("No file uploaded.");
        }

        try {
            // Save the video and process the file
            Video video = videoService.saveVideo(file, userId); // Ensure this method handles the file and user
                                                                // association properly
            return ResponseEntity.status(HttpStatus.CREATED).body(video);
        } catch (IOException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("File upload failed: " + e.getMessage());
        }
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserVideoUrl(@PathVariable Long userId) {
        Optional<Video> videoOptional = videoService.getLatestVideoByUserId(userId);

        if (videoOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "No video found for this user"));
        }

        Video video = videoOptional.get();
        Map<String, Object> response = new HashMap<>();
        response.put("id", video.getId());
        response.put("videoUrl", video.getUrl());
        response.put("userId", video.getUserId());
        response.put("tumbnail",video.getThumbnailUrl());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userId}/transcription")
    public ResponseEntity<Map<String, String>> getTranscriptionByUserId(@PathVariable Long userId) {
        try {
            // Fetch transcription for the user
            String transcription = videoService.getTranscriptionByUserId(userId);

            if (transcription != null && !transcription.isEmpty()) {
                return ResponseEntity.ok(Map.of("transcription", transcription));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Transcription not found for the user"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching transcription", "error", e.getMessage()));
        }
    }

    @PutMapping("/{userId}/transcription")
    public ResponseEntity<Map<String, String>> updateTranscriptionByUserId(
            @PathVariable Long userId, @RequestBody Map<String, String> requestBody) {
        String transcriptionContent = requestBody.get("transcription");

        if (transcriptionContent == null || transcriptionContent.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Transcription content is required"));
        }

        try {
            // Update transcription for the user
            Video updatedVideo = videoService.updateTranscriptionByUserId(userId, transcriptionContent);

            return ResponseEntity.ok(Map.of(
                    "message", "Transcription updated successfully",
                    "video", updatedVideo.toString()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error updating transcription", "error", e.getMessage()));
        }
    }

    @DeleteMapping("/delete/{userId}")
    public ResponseEntity<String> deleteVideo(@PathVariable Long userId) {
        Optional<Video> videoOptional = videoRepository.findByUserId(userId);

        if (!videoOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Video not found for userId: " + userId);
        }
        Video video = videoOptional.get();
        videoRepository.delete(video);
        return ResponseEntity.ok("Video deleted successfully for userId: " + userId);
    }

    @GetMapping("/videos")
    public ResponseEntity<List<Map<String, Object>>> getAllVideos() {
        List<Video> videoEntities = videoService.getAllVideos();

        if (videoEntities.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }

        List<Map<String, Object>> videoResponses = new ArrayList<>();
        String defaultProfilePic = "https://wezume.in/uploads/videos/defaultpic.png";
        for (Video videoEntity : videoEntities) {
            Map<String, Object> videoData = new HashMap<>();
            videoData.put("id", videoEntity.getId());
            videoData.put("videoUrl", videoEntity.getUrl());
            videoData.put("userId", videoEntity.getUserId());
            videoData.put("thumbnail", videoEntity.getThumbnailUrl());
            User user = userRepository.findById(videoEntity.getUserId()).orElse(null);
            if (user != null) {
                videoData.put("firstname", user.getFirstName());
                videoData.put("profilepic", user.getProfilePic() != null ? user.getProfilePic() : defaultProfilePic);
            } else {
                videoData.put("firstname", "User");
                videoData.put("profilepic", defaultProfilePic);
            }
            videoResponses.add(videoData);
        }
        return ResponseEntity.ok(videoResponses);
    }

    @GetMapping("/{userId}/subtitles.srt")
    public ResponseEntity<Resource> generateSRTForUser(@PathVariable Long userId) {
        try {
            String transcription = videoService.getTranscriptionByUserId(userId);

            if (transcription == null || transcription.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(null);
            }
            String srtContent = videoService.generateSRT(transcription);
            ByteArrayResource resource = new ByteArrayResource(srtContent.getBytes());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=subtitles.srt")
                    .contentType(MediaType.parseMediaType("application/x-subrip"))
                    .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @GetMapping("user/{videoId}/subtitles.srt")
    public ResponseEntity<Resource> generateSRTForVideo(@PathVariable Long videoId) {
        if (videoId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
        try {
            String transcription = videoService.getTranscriptionByVideoId(videoId);

            if (transcription == null || transcription.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(null);
            }
            String srtContent = videoService.generateSRT(transcription);
            ByteArrayResource resource = new ByteArrayResource(srtContent.getBytes());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=subtitles.srt")
                    .contentType(MediaType.parseMediaType("application/x-subrip"))
                    .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @PostMapping("/filter")
    public ResponseEntity<List<Map<String, Object>>> filterVideos(@RequestBody User user) {
        List<Video> videos = videoService.filterVideos(
                user.getKeySkills(),
                user.getExperience(),
                user.getIndustry(),
                user.getCity());
        if (videos.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }
        List<Map<String, Object>> videoResponses = new ArrayList<>();
        for (Video video : videos) {
            Map<String, Object> videoData = new HashMap<>();
            videoData.put("id", video.getId());
            videoData.put("userId", video.getUserId());
            videoData.put("videoUrl", video.getUrl());
            videoData.put("thumbnail", video.getThumbnailUrl());
            User videoUser = userRepository.findById(video.getUserId()).orElse(null);
            if (videoUser != null) {
                videoData.put("firstName", videoUser.getFirstName());
                videoData.put("email", videoUser.getEmail());
                videoData.put("phoneNumber", videoUser.getPhoneNumber());
                videoData.put("profilePic", videoUser.getProfilePic());
            } else {
                videoData.put("firstName", "User");
                videoData.put("email", "");
                videoData.put("phoneNumber", "");
                videoData.put("profilePic", "https://wezume.in/uploads/videos/defaultpic.png");
            }
            videoResponses.add(videoData);
        }
        return ResponseEntity.ok(videoResponses);
    }

    @GetMapping("/user/{videoId}/details")
    public ResponseEntity<Map<String, String>> getUserDetailsByVideoId(@PathVariable Long videoId) {
        if (videoId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
        Optional<Video> video = videoRepository.findById(videoId);
        if (video.isPresent()) {
            Long userId = video.get().getUserId();
            Optional<User> user = userRepository.findById(userId);
            if (user.isPresent()) {
                Map<String, String> userDetails = new HashMap<>();
                User userEntity = user.get();
                userDetails.put("firstName", Optional.ofNullable(userEntity.getFirstName()).orElse(""));
                userDetails.put("userId", Optional.ofNullable(userEntity.getId()).map(String::valueOf).orElse(""));
                byte[] profilePic = userEntity.getProfilePic();
                String profileImageBase64 = (profilePic != null)
                        ? Base64.getEncoder().encodeToString(profilePic)
                        : "";
                userDetails.put("profileImage", profileImageBase64);

                return ResponseEntity.ok(userDetails);
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @PostMapping("/{videoId}/like")
    public ResponseEntity<String> likeVideo(
            @PathVariable Long videoId,
            @RequestParam Long userId,
            @RequestParam String firstName) {
        if (videoId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid video ID.");
        }
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Optional<Like> existingLike = likeRepository.findByUserIdAndVideoId(userId, videoId);

        if (existingLike.isPresent()) {
            Like like = existingLike.get();
            like.setIsLike(!like.getIsLike());
            like.setCreatedAt(LocalDateTime.now());
            likeRepository.save(like);
        } else {
            Like newLike = new Like();
            newLike.setUserId(userId);
            newLike.setVideoId(videoId);
            newLike.setIsLike(true);
            newLike.setCreatedAt(LocalDateTime.now());
            likeRepository.save(newLike);
        }
        notificationService.saveNotification(video, firstName);

        return ResponseEntity.ok("Video liked and notification sent.");
    }

    @PostMapping("/{videoId}/dislike")
    public ResponseEntity<String> dislikeVideo(
            @PathVariable Long videoId,
            @RequestParam Long userId,
            @RequestParam String firstName) {
        if (videoId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid video ID.");
        }
        Video video = videoRepository.findById(videoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Optional<Like> existingLike = likeRepository.findByUserIdAndVideoId(userId, videoId);

        if (existingLike.isPresent()) {
            Like like = existingLike.get();
            if (!like.getIsLike()) {
                likeRepository.delete(like); // Remove the dislike entry
            } else {
                likeRepository.delete(like); // Remove the like entry when disliked
            }
        } else {
            Like newDislike = new Like();
            newDislike.setUserId(userId);
            newDislike.setVideoId(videoId);
            newDislike.setIsLike(false);
            newDislike.setCreatedAt(LocalDateTime.now());
            likeRepository.save(newDislike);
        }
        return ResponseEntity.ok("Video disliked successfully.");
    }

    @GetMapping("/{videoId}/like-count")
    public ResponseEntity<Long> getLikeCount(@PathVariable Long videoId) {
        if (videoId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
        Long likeCount = videoService.getLikeCount(videoId);
        return ResponseEntity.ok(likeCount);
    }

    @GetMapping("/likes/status")
    public Map<Long, Boolean> getLikeStatus(@RequestParam Long userId) {
        List<Video> allVideos = videoService.getAllVideos();
        Map<Long, Boolean> likeStatus = new HashMap<>();

        for (Video video : allVideos) {
            boolean isLiked = likeRepository.existsByUserIdAndVideoId(userId, video.getId());
            likeStatus.put(video.getId(), isLiked);
        }
        return likeStatus;
    }

    @GetMapping("/getOwnerByVideoId/{videoId}")
    public ResponseEntity<User> getOwnerByVideoId(@PathVariable("videoId") Long videoId) {
        if (videoId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
        try {
            Video video = videoService.getVideoById(videoId);
            if (video == null) {
                return ResponseEntity.notFound().build();
            }
            Long userId = video.getUserId();
            User user = userService.getUserById(userId);

            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/getOwnerByUserId/{userId}")
    public ResponseEntity<User> getOwnerByUserId(@PathVariable("userId") Long userId) {
        try {
            User user = userService.getUserById(userId);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/getVideoIdsByUserId/{userId}")
    public ResponseEntity<?> getVideoIdsByUserId(@PathVariable("userId") Long userId) {
        try {
            List<Long> videoIds = videoService.getVideoIdsByUserId(userId);
            if (videoIds.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(videoIds);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching video IDs: " + e.getMessage());
        }
    }

    @GetMapping("/liked")
    public ResponseEntity<List<Map<String, Object>>> getLikedVideosByUserId(@RequestParam("userId") Long userId) {
        List<Video> likedVideos = videoService.getLikedVideosByUserId(userId);

        if (likedVideos.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }
        List<Map<String, Object>> videoResponses = new ArrayList<>();
        for (Video video : likedVideos) {
            Map<String, Object> videoDataMap = new HashMap<>();
            videoDataMap.put("id", video.getId());
            videoDataMap.put("userId", video.getUserId());
            videoDataMap.put("videoUrl", video.getUrl());
            videoDataMap.put("thumbnail", video.getThumbnailUrl());
            
            // Add user details
            User user = userRepository.findById(video.getUserId()).orElse(null);
            if (user != null) {
                videoDataMap.put("firstName", user.getFirstName());
                videoDataMap.put("email", user.getEmail());
                videoDataMap.put("phoneNumber", user.getPhoneNumber());
                videoDataMap.put("profilePic", user.getProfilePic() != null ? user.getProfilePic() : "https://wezume.in/uploads/videos/defaultpic.png");
            } else {
                videoDataMap.put("firstName", "User");
                videoDataMap.put("email", "");
                videoDataMap.put("phoneNumber", "");
                videoDataMap.put("profilePic", "https://wezume.in/uploads/videos/defaultpic.png");
            }

            videoResponses.add(videoDataMap);
        }
        return ResponseEntity.ok(videoResponses);
    }

    @GetMapping("/trending")
    public ResponseEntity<List<Map<String, Object>>> getTrendingVideos() {
        List<Video> trendingVideos = videoService.getTrendingVideos();

        if (trendingVideos.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }

        List<Map<String, Object>> videoResponses = new ArrayList<>();
        for (Video video : trendingVideos) {
            Map<String, Object> videoDataMap = new HashMap<>();
            videoDataMap.put("id", video.getId());
            videoDataMap.put("userId", video.getUserId());
            videoDataMap.put("videoUrl", video.getUrl());
            videoDataMap.put("thumbnail", video.getThumbnailUrl());
            videoResponses.add(videoDataMap);
        }

        return ResponseEntity.ok(videoResponses);
    }

    @PostMapping("/check-profane")
public ResponseEntity<?> checkForProfanity(@RequestBody Map<String, String> request) {
    String videoUri = request.get("file");
    if (videoUri == null || videoUri.isEmpty()) {
        return ResponseEntity.badRequest().body("Video URI is empty");
    }

    try {
        // 🔹 Step 1: Extract video file name from URI
        String videoFileName = new File(videoUri).getName();

        // 🔹 Step 2: Check if the video exists in the database
        Optional<Video> videoOptional = videoRepository.findByFileName(videoFileName);
        if (videoOptional.isPresent()) {
            Video video = videoOptional.get();

            // 🔹 Step 3: Skip processing if thumbnail already exists
            if (video.getThumbnailUrl() != null && !video.getThumbnailUrl().isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "message", "Thumbnail already exists. Skipping profanity check.",
                        "thumbnailUrl", video.getThumbnailUrl()));
            }

            // 🔹 Step 4: Download video to a temp file
            File tempVideo = downloadVideo(videoUri);
            if (tempVideo == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Failed to download video.");
            }

            // 🔹 Step 5: Check for profanity
            boolean hasProfanity = videoProcessingService.checkForVisualProfanity(tempVideo.getAbsolutePath());
            if (hasProfanity) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Profanity detected in the video.");
            }

            // 🔹 Step 6: Extract frames & save thumbnail
            String thumbnailUrl = extractAndSaveThumbnail(tempVideo, videoFileName);
            if (thumbnailUrl == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to generate thumbnail.");
            }

            // 🔹 Step 7: Update thumbnail URL in database
            video.setThumbnailUrl(thumbnailUrl);
            videoRepository.save(video);
            return ResponseEntity.ok(Map.of(
                    "message", "No profanity found.",
                    "thumbnailUrl", thumbnailUrl));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Video not found in the database.");
        }
    } catch (Exception e) {
        return ResponseEntity.status(500).body("Error processing video: " + e.getMessage());
    }
}

private File downloadVideo(String videoUri) {
    try {
        URL url = new URL(videoUri);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");
        if (connection.getResponseCode() != 200) {
            return null;
        }

        File tempVideo = File.createTempFile("downloaded-video", ".mp4");
        try (InputStream inputStream = connection.getInputStream();
             FileOutputStream fileOutputStream = new FileOutputStream(tempVideo)) {

            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                fileOutputStream.write(buffer, 0, bytesRead);
            }
        }
        return tempVideo;
    } catch (IOException e) {
        return null;
    }
}

private String extractAndSaveThumbnail(File tempVideo, String videoFileName) {
    try {
        File thumbnailDir = new File("uploads/videos/thumbnails/");
        if (!thumbnailDir.exists()) {
            thumbnailDir.mkdirs();
        }

        // Extract frames
        FrameExtractor frameExtractor = new FrameExtractor();
        String tempDirPath;
        try {
            tempDirPath = frameExtractor.extractFrames(tempVideo.getAbsolutePath());
        } catch (Exception e) {
            e.printStackTrace();
            return null; // Handle the exception and return null if extraction fails
        }
        File tempDir = new File(tempDirPath);

        File[] frames = tempDir.listFiles((dir, name) -> name.matches("frame_0001\\.jpg"));
        if (frames == null || frames.length == 0) {
            return null;
        }

        // Save the extracted frame with the desired name and ensure it's saved as an image
        File firstFrame = frames[0];
        String thumbnailFileName = "thumbnail_" + videoFileName.replace(".mp4", ".jpg");
        File thumbnailFile = new File(thumbnailDir, thumbnailFileName);
        Files.copy(firstFrame.toPath(), thumbnailFile.toPath(), StandardCopyOption.REPLACE_EXISTING);

        return "https://wezume.in/uploads/videos/thumbnails/" + thumbnailFileName;
    } catch (IOException e) {
        e.printStackTrace();
        return null;
    }
}

    @GetMapping("/paging")
    public ResponseEntity<List<Map<String, Object>>> getVideos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "2") int size) {

        Page<Video> videoPage = videoService.getVideos(page, size);

        if (videoPage.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }

        List<Map<String, Object>> videoResponses = new ArrayList<>();
        for (Video video : videoPage) {
            Map<String, Object> videoData = new HashMap<>();
            videoData.put("id", video.getId());
            videoData.put("videoUrl", video.getUrl());
            videoData.put("userId", video.getUserId());
            videoData.put("thumbnail", video.getThumbnailUrl());
            User user = userRepository.findById(video.getUserId()).orElse(null);
            if (user != null) {
                videoData.put("firstname", user.getFirstName());
                videoData.put("profilepic", user.getProfilePic() != null ? user.getProfilePic()
                        : "https://wezume.in/uploads/videos/defaultpic.png");
                videoData.put("email", user.getEmail());
                videoData.put("phonenumber", user.getPhoneNumber());
                // Add total like count for the user
                Long totalLikes = likeRepository.countByUserId(user.getId());
                videoData.put("totalLikes", totalLikes);
            } else {
                videoData.put("firstname", "User");
                videoData.put("profilepic", "https://wezume.in/uploads/videos/defaultpic.png");
                videoData.put("email", "");
                videoData.put("phonenumber", "");
                videoData.put("totalLikes", 0);
            }
            videoResponses.add(videoData);
        }

        return ResponseEntity.ok(videoResponses);
    }

    @GetMapping("/trending/pageing")
    public ResponseEntity<List<Map<String, Object>>> getpageTrendingVideos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "2") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Video> trendingVideos = videoService.getPaginatedTrendingVideos(pageable);

        if (trendingVideos.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }

        List<Map<String, Object>> response = new ArrayList<>();
        trendingVideos.getContent().forEach(video -> {
            Map<String, Object> videoData = new HashMap<>();
            videoData.put("id", video.getId());
            videoData.put("userId", video.getUserId());
            videoData.put("videoUrl", video.getUrl());
            videoData.put("thumbnail", video.getThumbnailUrl());
            User user = userRepository.findById(video.getUserId()).orElse(null);
            if (user != null) {
                videoData.put("firstname", user.getFirstName());
                videoData.put("profilepic", user.getProfilePic() != null ? user.getProfilePic()
                        : "https://wezume.in/uploads/videos/defaultpic.png");
                videoData.put("email", user.getEmail());
                videoData.put("phonenumber", user.getPhoneNumber());
                Long totalLikes = likeRepository.countByUserId(user.getId());
                videoData.put("totalLikes", totalLikes);
            } else {
                videoData.put("firstname", "User");
                videoData.put("profilepic", "https://wezume.in/uploads/videos/defaultpic.png");
                videoData.put("email", "");
                videoData.put("phonenumber", "");
                videoData.put("totalLikes", 0);
            }
            response.add(videoData);
        });

        return ResponseEntity.ok(response);
    }

    @GetMapping("/liked/pageing")
    public ResponseEntity<List<Map<String, Object>>> getPaginatedLikedVideos(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "2") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Video> likedVideos = videoService.getPageLikedVideosByUserId(userId, pageable);

        if (likedVideos.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
        }

        List<Map<String, Object>> response = new ArrayList<>();
        likedVideos.getContent().forEach(video -> {
            Map<String, Object> videoData = new HashMap<>();
            videoData.put("id", video.getId());
            videoData.put("userId", video.getUserId());
            videoData.put("videoUrl", video.getUrl());
            videoData.put("thumbnail", video.getThumbnailUrl());
            User user = userRepository.findById(video.getUserId()).orElse(null);
            if (user != null) {
                videoData.put("firstname", user.getFirstName());
                videoData.put("profilepic", user.getProfilePic() != null ? user.getProfilePic()
                        : "https://wezume.in/uploads/videos/defaultpic.png");
                videoData.put("email", user.getEmail());
                videoData.put("phonenumber", user.getPhoneNumber());
                Long totalLikes = likeRepository.countByUserId(user.getId());
                videoData.put("totalLikes", totalLikes);
            } else {
                videoData.put("firstname", "User");
                videoData.put("profilepic", "https://wezume.in/uploads/videos/defaultpic.png");
                videoData.put("email", "");
                videoData.put("phonenumber", "");
                videoData.put("totalLikes", 0);
            }
            response.add(videoData);
        });

        return ResponseEntity.ok(response);
    }

};
