
package com.example.vprofile;

import java.io.IOException;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    private final VideoService videoService;
    private final FFmpegService ffmpegService;

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private UserService userService;

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
@PostMapping("/filter")
public ResponseEntity<List<Video>> filterVideos(@RequestBody User user) {
    // Log the incoming request data
    System.out.println("Received filter request with the following data:");
    System.out.println("Key Skills: " + user.getKeySkills());
    System.out.println("Experience: " + user.getExperience());
    System.out.println("Industry: " + user.getIndustry());
    System.out.println("City: " + user.getCity());

    // Call the service to filter videos
    List<Video> videos = videoService.filterVideos(
        user.getKeySkills(), // This should now work as a list
        user.getExperience(),
        user.getIndustry(),
        user.getCity()
    );

    // Return the filtered videos in the response
    return ResponseEntity.ok(videos);
}

@GetMapping("/user/{videoId}/details")
    public ResponseEntity<Map<String, String>> getUserDetailsByVideoId(@PathVariable Long videoId) {
        Optional<Video> video = videoRepository.findById(videoId);
        if (video.isPresent()) {
            Long userId = video.get().getUserId();
            Optional<User> user = userRepository.findById(userId);
            if (user.isPresent()) {
                Map<String, String> userDetails = new HashMap<>();
                userDetails.put("firstName", user.get().getFirstName());
                userDetails.put("profileImage", Base64.getEncoder().encodeToString(user.get().getProfilePic()));
                return ResponseEntity.ok(userDetails);
            }
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
    @PostMapping("/{videoId}/like")
    public ResponseEntity<?> likeVideo(@PathVariable Long videoId, @RequestParam Long userId) {
        videoService.addLike(userId, videoId);
        return ResponseEntity.ok().body("Liked the video");
    }

    @PostMapping("/{videoId}/dislike")
public ResponseEntity<String> dislikeVideo(@PathVariable Long videoId, @RequestParam Long userId) {
    videoService.addDislike(userId, videoId);  // Calls the addDislike method in VideoService
    return ResponseEntity.ok("Disliked the video");
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

}
