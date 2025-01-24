
package com.example.vprofile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

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
    public ResponseEntity<InputStreamResource> streamUserVideo(
            @PathVariable Long userId,
            @RequestHeader(value = "Range", required = false) String rangeHeader) {

        return videoService.streamVideo(userId, rangeHeader);
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
        System.out.println("Received request to delete video for userId: " + userId);

        // Fetch the video associated with the user
        Optional<Video> videoOptional = videoRepository.findByUserId(userId);

        if (!videoOptional.isPresent()) {
            // If no video found for the user, return a 404 response
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Video not found for userId: " + userId);
        }

        Video video = videoOptional.get();

        // Delete the video
        videoRepository.delete(video);

        // Return a success message
        return ResponseEntity.ok("Video deleted successfully for userId: " + userId);
    }
    @GetMapping("/videos")
public ResponseEntity<List<Map<String, Object>>> getAllVideos() {
    System.out.println("Received request for fetching all videos");

    // Fetch all video entities from the database
    List<Video> videoEntities = videoService.getAllVideos();

    if (videoEntities.isEmpty()) {
        System.out.println("No videos found in the database");
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    // Log the number of videos fetched from the database
    System.out.println("Number of video entities fetched: " + videoEntities.size());

    // Prepare the response list
    List<Map<String, Object>> videoResponses = new ArrayList<>();
    System.out.println("Preparing response for each video entity...");

    for (Video videoEntity : videoEntities) {
        // Log each video entity being processed
        System.out.println("Processing video entity with ID: " + videoEntity.getId());

        Map<String, Object> videoData = new HashMap<>();
        videoData.put("id", videoEntity.getId());
        videoData.put("filePath", videoEntity.getFilePath());
        videoData.put("fileName", videoEntity.getFileName());
        videoData.put("transcription", videoEntity.getTranscription());
        videoData.put("userId", videoEntity.getUserId());

        // Add the video data map to the response list
        videoResponses.add(videoData);
    }

    // Log the number of videos prepared for the response
    System.out.println("Number of videos to return in response: " + videoResponses.size());

    // Log completion of processing
    System.out.println("Successfully prepared video responses. Returning the response...");

    // Return the response with the list of video data
    return ResponseEntity.ok(videoResponses);
}

    

@GetMapping("/{userId}/subtitles.srt")
public ResponseEntity<Resource> generateSRTForUser(@PathVariable Long userId) {
    try {
        System.out.println("Starting SRT generation for user ID: " + userId);

        // Fetch transcription for the user
        String transcription = videoService.getTranscriptionByUserId(userId);
        System.out.println("Transcription fetched for user ID " + userId + ": " + transcription);

        if (transcription == null || transcription.isEmpty()) {
            System.out.println("No transcription found for user ID: " + userId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(null);
        }

        // Split transcription and generate SRT
        String srtContent = videoService.generateSRT(transcription);
        System.out.println("Generated SRT content for user ID " + userId + ": " + srtContent);

        // Serve SRT as downloadable file
        ByteArrayResource resource = new ByteArrayResource(srtContent.getBytes());
        System.out.println("Returning SRT file for user ID: " + userId);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=subtitles.srt")
                .contentType(MediaType.parseMediaType("application/x-subrip"))
                .body(resource);
    } catch (Exception e) {
        System.out.println("Error occurred while generating SRT for user ID: " + userId);
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(null);
    }
}

@GetMapping("user/{videoId}/subtitles.srt")
public ResponseEntity<Resource> generateSRTForVideo(@PathVariable Long videoId) {
    try {
        System.out.println("Starting SRT generation for video ID: " + videoId);

        // Fetch transcription for the video
        String transcription = videoService.getTranscriptionByVideoId(videoId);
        System.out.println("Transcription fetched for video ID " + videoId + ": " + transcription);

        if (transcription == null || transcription.isEmpty()) {
            System.out.println("No transcription found for video ID: " + videoId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(null);
        }

        // Split transcription and generate SRT
        String srtContent = videoService.generateSRT(transcription);
        System.out.println("Generated SRT content for video ID " + videoId + ": " + srtContent);

        // Serve SRT as downloadable file
        ByteArrayResource resource = new ByteArrayResource(srtContent.getBytes());
        System.out.println("Returning SRT file for video ID: " + videoId);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=subtitles.srt")
                .contentType(MediaType.parseMediaType("application/x-subrip"))
                .body(resource);
    } catch (Exception e) {
        System.out.println("Error occurred while generating SRT for video ID: " + videoId);
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(null);
    }
}


@PostMapping("/filter")
public ResponseEntity<List<Map<String, Object>>> filterVideos(@RequestBody User user) {
    // Log the incoming request data
    System.out.println("Received filter request with the following data:");
    System.out.println("Key Skills: " + user.getKeySkills());
    System.out.println("Experience: " + user.getExperience());
    System.out.println("Industry: " + user.getIndustry());
    System.out.println("City: " + user.getCity());

    // Call the service to filter videos
    List<Video> videos = videoService.filterVideos(
        user.getKeySkills(),
        user.getExperience(),
        user.getIndustry(),
        user.getCity()
    );

    // Check if any videos are returned
    if (videos.isEmpty()) {
        System.out.println("No videos found for the given filter criteria");
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    // Log the number of videos fetched based on the filter
    System.out.println("Number of videos fetched: " + videos.size());

    // Prepare the response list
    List<Map<String, Object>> videoResponses = new ArrayList<>();
    System.out.println("Preparing response for each video entity...");

    // Iterate over the filtered video list
    for (Video video : videos) {
        // Log each video entity being processed
        System.out.println("Processing video with ID: " + video.getId());

        // Create a map to hold video data
        Map<String, Object> videoData = new HashMap<>();
        videoData.put("id", video.getId());  // Use getVideoId to access the ID
        videoData.put("filePath", video.getFilePath());
        videoData.put("userId", video.getUserId());

        // Add the video data map to the response list
        videoResponses.add(videoData);
    }

    // Log the number of videos prepared for the response
    System.out.println("Number of videos to return in response: " + videoResponses.size());

    // Log completion of processing
    System.out.println("Successfully prepared video responses. Returning the response...");

    // Return the response with the list of video data
    return ResponseEntity.ok(videoResponses);
}


@GetMapping("/user/{videoId}/details")
public ResponseEntity<Map<String, String>> getUserDetailsByVideoId(@PathVariable Long videoId) {
    Optional<Video> video = videoRepository.findById(videoId);
    if (video.isPresent()) {
        Long userId = video.get().getUserId();
        Optional<User> user = userRepository.findById(userId);
        if (user.isPresent()) {
            Map<String, String> userDetails = new HashMap<>();
            User userEntity = user.get();

            // Handle null fields safely
            userDetails.put("firstName", Optional.ofNullable(userEntity.getFirstName()).orElse(""));
            userDetails.put("userId", Optional.ofNullable(userEntity.getId()).map(String::valueOf).orElse(""));

            // Safely handle the profilePic field
            byte[] profilePic = userEntity.getProfilePic();
            String profileImageBase64 = (profilePic != null) 
                ? Base64.getEncoder().encodeToString(profilePic) 
                : ""; // Return empty string if profilePic is null
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
        @RequestParam String firstName
    ) {
        // Fetch the video and user
        Video video = videoRepository.findById(videoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found"));
    
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    
        // Check if the user has already liked the video
        Optional<Like> existingLike = likeRepository.findByUserIdAndVideoId(userId, videoId);
    
        if (existingLike.isPresent()) {
            // If the user already liked the video, toggle the like status
            Like like = existingLike.get(); // Unwrap the Optional to get the Like object
            like.setIsLike(!like.getIsLike()); // Toggle the like status
            like.setCreatedAt(LocalDateTime.now()); // Update the timestamp if necessary
            likeRepository.save(like);  // Save the updated like
        } else {
            // If the user hasn't liked the video yet, create a new like record
            Like newLike = new Like();
            newLike.setUserId(userId);
            newLike.setVideoId(videoId);
            newLike.setIsLike(true);  // Set to true since user is liking the video
            newLike.setCreatedAt(LocalDateTime.now());  // Set current timestamp
            likeRepository.save(newLike);  // Save the new like record
        }
    
        // Save the notification for the video owner
        notificationService.saveNotification(video, firstName);
    
        return ResponseEntity.ok("Video liked and notification sent.");
    }
    


    @PostMapping("/{videoId}/dislike")
    public ResponseEntity<String> dislikeVideo(
        @PathVariable Long videoId,
        @RequestParam Long userId,
        @RequestParam String firstName
    ) {
        // Fetch the video and user
        Video video = videoRepository.findById(videoId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Video not found"));
    
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    
        // Check if the user has already disliked the video
        Optional<Like> existingLike = likeRepository.findByUserIdAndVideoId(userId, videoId);
    
        if (existingLike.isPresent()) {
            Like like = existingLike.get(); // Unwrap the Optional
    
            if (!like.getIsLike()) {
                // If the user already disliked the video, remove the dislike
                likeRepository.delete(like);
            } else {
                // If the user liked the video, replace the like with a dislike
                like.setIsLike(false); // Set to false to indicate a dislike
                like.setCreatedAt(LocalDateTime.now()); // Update the timestamp
                likeRepository.save(like); // Save the updated record
            }
        } else {
            // If the user hasn't interacted with the video yet, create a new dislike record
            Like newDislike = new Like();
            newDislike.setUserId(userId);
            newDislike.setVideoId(videoId);
            newDislike.setIsLike(false); // Set to false to indicate a dislike
            newDislike.setCreatedAt(LocalDateTime.now()); // Set current timestamp
            likeRepository.save(newDislike); // Save the new dislike record
        }
    
        // Optionally, you can add logic to send a notification for the video owner
        // notificationService.saveNotification(video, firstName);
    
        return ResponseEntity.ok("Video disliked successfully.");
    }


    @GetMapping("/{videoId}/like-count")
    public ResponseEntity<Long> getLikeCount(@PathVariable Long videoId) {
        // Debugging: Log the videoId
        System.out.println("Received videoId: " + videoId);
    
        // Fetch the like count
        Long likeCount = videoService.getLikeCount(videoId);
    
        // Debugging: Log the like count
        System.out.println("Fetched like count for videoId " + videoId + ": " + likeCount);
    
        return ResponseEntity.ok(likeCount);
    }

    @GetMapping("/likes/status")
public Map<Long, Boolean> getLikeStatus(@RequestParam Long userId) {
    List<Video> allVideos = videoService.getAllVideos();
    Map<Long, Boolean> likeStatus = new HashMap<>();

    for (Video video : allVideos) {
        boolean isLiked = likeRepository.existsByUserIdAndVideoId(userId, video.getId());
        System.out.println("Video ID: " + video.getId() + ", Is Liked: " + isLiked);
        likeStatus.put(video.getId(), isLiked);
    }
    return likeStatus;
}

@GetMapping("/getOwnerByVideoId/{videoId}")
    public ResponseEntity<User> getOwnerByVideoId(@PathVariable("videoId") Long videoId) {
        try {
            // Retrieve the video by videoId
            Video video = videoService.getVideoById(videoId);
            if (video == null) {
                return ResponseEntity.notFound().build(); // Return 404 if video not found
            }

            // Get the user (owner) based on the userId associated with the video
            Long userId = video.getUserId();
            User user = userService.getUserById(userId);

            if (user == null) {
                return ResponseEntity.notFound().build(); // Return 404 if user not found
            }

            // Return the user data (owner) including phone number associated with the video
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            // Handle any errors
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/getOwnerByUserId/{userId}")
public ResponseEntity<User> getOwnerByUserId(@PathVariable("userId") Long userId) {
    try {
        // Retrieve the user by userId
        User user = userService.getUserById(userId);

        if (user == null) {
            return ResponseEntity.notFound().build(); // Return 404 if user not found
        }

        // Return the user data (owner) including phone number
        return ResponseEntity.ok(user);
    } catch (Exception e) {
        // Handle any errors
        return ResponseEntity.status(500).body(null);
    }
}
@GetMapping("/getVideoIdsByUserId/{userId}")
    public ResponseEntity<?> getVideoIdsByUserId(@PathVariable("userId") Long userId) {
        try {
            // Retrieve the list of video IDs associated with the user
            List<Long> videoIds = videoService.getVideoIdsByUserId(userId);
            if (videoIds.isEmpty()) {
                return ResponseEntity.noContent().build(); // Return 204 if no videos found
            }

            // Return the list of video IDs
            return ResponseEntity.ok(videoIds);
        } catch (Exception e) {
            // Handle any errors
            return ResponseEntity.status(500).body("Error fetching video IDs: " + e.getMessage());
        }
    }

    @GetMapping("/liked")
public ResponseEntity<List<Map<String, Object>>> getLikedVideosByUserId(@RequestParam("userId") Long userId) {
    System.out.println("Received request for fetching liked videos for user ID: " + userId);

    // Fetch liked videos from the service for the given userId
    List<Video> likedVideos = videoService.getLikedVideosByUserId(userId);

    if (likedVideos.isEmpty()) {
        System.out.println("No liked videos found for user ID: " + userId);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    // Log the number of liked videos fetched from the database
    System.out.println("Number of liked videos fetched: " + likedVideos.size());

    // Prepare the response list of maps
    List<Map<String, Object>> videoResponses = new ArrayList<>();
    for (Video video : likedVideos) {
        Map<String, Object> videoDataMap = new HashMap<>();
        videoDataMap.put("id", video.getId());
        videoDataMap.put("filePath", video.getFilePath());
        videoDataMap.put("fileName", video.getFileName());
        videoDataMap.put("transcription", video.getTranscription());
        videoDataMap.put("userId", video.getUserId());
        videoResponses.add(videoDataMap);
    }

    // Return the response with the list of liked video data
    return ResponseEntity.ok(videoResponses);
}

@GetMapping("/trending")
public ResponseEntity<?> getTrendingVideos() {
    List<Object[]> trendingVideos = videoService.getTrendingVideos();
    
    // Create a response to return video data along with like information
    List<Map<String, Object>> videoResponses = new ArrayList<>();
    for (Object[] videoData : trendingVideos) {
        Map<String, Object> videoDataMap = new HashMap<>();
        
        // Assuming videoData[0] is videoId, videoData[1] is userId, and videoData[2] is likeCount
        videoDataMap.put("userId", videoData[0]);
        videoDataMap.put("videoId", videoData[1]);
        videoDataMap.put("likeCount", videoData[2]); // Adjust if the like count is in a different position
        
        videoResponses.add(videoDataMap);
    }
    
    return ResponseEntity.ok(videoResponses);
}

@PostMapping("/check-profane")
public ResponseEntity<?> checkForProfanity(@RequestBody Map<String, String> request) {
    String videoUri = request.get("file");  // The 'file' key should be part of the request body
    if (videoUri == null || videoUri.isEmpty()) {
        return ResponseEntity.badRequest().body("Video URI is empty");
    }

    try {
        // Log the incoming URI
        System.out.println("Received video URI: " + videoUri);

        // Download the video from the URI
        URL url = new URL(videoUri);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("GET");

        // Log the response code
        int responseCode = connection.getResponseCode();
        System.out.println("Response Code: " + responseCode);

        // Check if the connection was successful
        if (responseCode != 200) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Unable to fetch the video from the provided URI.");
        }

        // Save the video to a temporary file
        File tempVideo = File.createTempFile("downloaded-video", ".mp4");
        try (InputStream inputStream = connection.getInputStream();
             FileOutputStream fileOutputStream = new FileOutputStream(tempVideo)) {

            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                fileOutputStream.write(buffer, 0, bytesRead);
            }

            // Log the temporary file path
            System.out.println("Saved video to temporary file: " + tempVideo.getAbsolutePath());
        }

        // Check for visual profanity
        boolean hasProfanity = videoProcessingService.checkForVisualProfanity(tempVideo.getAbsolutePath());

        // Log profanity detection result
        if (hasProfanity) {
            System.out.println("Profanity detected in the video.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Profanity detected in the video.");
        } else {
            System.out.println("No profanity found in the video.");
            return ResponseEntity.ok("No profanity found in the video.");
        }
    } catch (Exception e) {
        System.out.println("Error during video processing: " + e.getMessage());
        return ResponseEntity.status(500).body("Error processing video: " + e.getMessage());
    }
}

};
