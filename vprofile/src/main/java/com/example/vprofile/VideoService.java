
package com.example.vprofile;

import com.assemblyai.api.AssemblyAI;
import com.assemblyai.api.resources.transcripts.types.Transcript;
import com.assemblyai.api.resources.transcripts.types.TranscriptOptionalParams;
import com.assemblyai.api.resources.transcripts.types.TranscriptStatus;
import com.transloadit.sdk.Assembly;
import com.transloadit.sdk.Transloadit;
import com.transloadit.sdk.exceptions.LocalOperationException;
import com.transloadit.sdk.exceptions.RequestException;
import com.transloadit.sdk.response.AssemblyResponse;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class VideoService {

    private final String uploadDir = "uploads/videos/";

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private FFmpegService ffmpegService;

    @Value("${assemblyai.api.key}")
    private String assemblyAiApiKey;

    @Value("${transloadit.api.key}")
    private String transloaditApiKey;

    @Value("${transloadit.api.secret}")
    private String transloaditApiSecret;

    private final String templateId = "2c918371ac9b48d589ecd6fd9ef5e992"; // Your template ID

    public Video saveVideo(MultipartFile file, Long userId) throws IOException, InterruptedException {
        System.out.println("Saving video for user ID: " + userId);

        // Validate the user ID
        validateUser(userId);

        // Save the uploaded file temporarily
        Path videoFilePath = saveUploadedFile(file);
        System.out.println("Video file saved at: " + videoFilePath);

        // Create a temporary file for the compressed video
        File tempCompressedFile = new File(uploadDir, "compressed_" + file.getOriginalFilename());

        // Compress the video
        System.out.println("Starting video compression...");
        try {
            ffmpegService.compressVideo(videoFilePath.toFile(), tempCompressedFile);
            System.out.println("Video compressed successfully to: " + tempCompressedFile.getAbsolutePath());
        } catch (Exception e) {
            System.err.println("Error during video compression: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }

        // Verify compressed file
        if (!tempCompressedFile.exists() || tempCompressedFile.length() == 0) {
            throw new RuntimeException("Compressed video file was not created or is empty.");
        }

        // Read the compressed video file as bytes
        byte[] compressedVideoBytes = java.nio.file.Files.readAllBytes(tempCompressedFile.toPath());
        System.out.println("Compressed video file size: " + compressedVideoBytes.length + " bytes");

        // Extract audio and perform transcription
        String audioUrl = extractAudioWithTransloadit(videoFilePath);
        System.out.println("Audio file extracted at: " + audioUrl);

        String downloadedAudioPath = downloadAudio(audioUrl, file.getOriginalFilename());
        System.out.println("Downloaded audio file saved at: " + downloadedAudioPath);

        String transcription = convertAudioToText(downloadedAudioPath);
        System.out.println("Transcription completed: " + transcription);

        // Create the Video entity
        Video video = new Video(file.getOriginalFilename(), compressedVideoBytes, userId, transcription,
                downloadedAudioPath);
        video.setFilePath(tempCompressedFile.getAbsolutePath());
        video.setVideoData(compressedVideoBytes);
        System.out.println("Video entity created: " + video);

        // Save and return the video
        return videoRepository.save(video);
    }

    private void validateUser(Long userId) {
        System.out.println("Validating user with ID: " + userId);
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User with ID " + userId + " does not exist.");
        }
        System.out.println("User validation passed.");
    }

    private Path saveUploadedFile(MultipartFile file) throws IOException {
        System.out.println("Saving uploaded file: " + file.getOriginalFilename());

        File directory = new File(uploadDir);
        if (!directory.exists()) {
            System.out.println("Directory does not exist. Creating: " + uploadDir);
            directory.mkdirs();
        }

        Path filePath = Paths.get(uploadDir + file.getOriginalFilename());
        Files.write(filePath, file.getBytes());
        System.out.println("File saved at: " + filePath);

        return filePath;
    }

    private String extractAudioWithTransloadit(Path videoFilePath) throws IOException {
        Transloadit transloadit = new Transloadit(transloaditApiKey, transloaditApiSecret);

        Assembly assembly = transloadit.newAssembly();
        assembly.addFile(videoFilePath.toFile());
        assembly.addOptions(Map.of("template_id", templateId));

        try {
            // Start the assembly
            AssemblyResponse response = assembly.save();

            // Poll for assembly completion
            while (!response.isFinished()) {
                Thread.sleep(5000);
                response = transloadit.getAssemblyByUrl(response.getSslUrl());
            }

            // Log the full response for debugging
            System.out.println("Full Response JSON: " + response.json().toString(2));

            // Check if 'results' and 'extracted-audio' exist in the JSON response
            if (response.json().has("results") && response.json().getJSONObject("results").has("extracted-audio")) {
                // Get the extracted audio array
                JSONArray extractedAudioArray = response.json().getJSONObject("results")
                        .getJSONArray("extracted-audio");

                // Check if the array has at least one audio object
                if (extractedAudioArray.length() > 0) {
                    // Access the first audio object
                    JSONObject audioObject = extractedAudioArray.getJSONObject(0);

                    // Get the audio URL from the audio object
                    String audioUrl = audioObject.getString("url");
                    System.out.println("Extracted Audio URL: " + audioUrl);
                    return audioUrl;
                } else {
                    throw new IOException("Audio extraction failed: 'extracted-audio' array is empty.");
                }
            } else {
                throw new IOException(
                        "Audio extraction failed: 'results' or 'extracted-audio' key not found in the response.");
            }
        } catch (RequestException | LocalOperationException | InterruptedException e) {
            throw new IOException("Error during Transloadit execution: " + e.getMessage());
        }
    }

    private String downloadAudio(String audioUrl, String originalFileName) throws IOException {
        String audioFileName = originalFileName.replace(".mp4", ".mp3"); // Change extension if necessary
        Path audioFilePath = Paths.get(uploadDir + "audio/" + audioFileName);

        // Create audio directory if it does not exist
        File audioDirectory = new File(uploadDir + "audio/");
        if (!audioDirectory.exists()) {
            audioDirectory.mkdirs();
        }

        // Download the audio file
        try (InputStream in = new URL(audioUrl).openStream();
                FileOutputStream out = new FileOutputStream(audioFilePath.toFile())) {
            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = in.read(buffer, 0, buffer.length)) != -1) {
                out.write(buffer, 0, bytesRead);
            }
        }

        System.out.println("Downloaded audio file to: " + audioFilePath);
        return audioFilePath.toString();
    }

    private String convertAudioToText(String audioFilePath) throws IOException {
        System.out.println("Converting audio to text for file: " + audioFilePath);

        AssemblyAI client = AssemblyAI.builder()
                .apiKey(assemblyAiApiKey)
                .build();

        TranscriptOptionalParams params = TranscriptOptionalParams.builder()
                .speakerLabels(true)
                .build();

        Transcript transcript = client.transcripts().transcribe(new File(audioFilePath), params);

        if (transcript.getStatus().equals(TranscriptStatus.ERROR)) {
            System.err.println("Transcription error: " + transcript.getError().orElse("Unknown error"));
            throw new IOException("Transcription error: " + transcript.getError().orElse("Unknown error"));
        }

        System.out.println("Transcription text: " + transcript.getText().orElse("No transcription text available"));
        return transcript.getText().orElse("No transcription text available");
    }

    public ResponseEntity<InputStreamResource> streamVideo(Long userId, String rangeHeader) {
        // Fetch video record from the database
        Optional<Video> videoOptional = videoRepository.findByUserId(userId);

        if (!videoOptional.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Video video = videoOptional.get();
        String filePath = video.getFilePath(); // Assuming you store the file path in the database

        File videoFile = new File(filePath);
        if (!videoFile.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        try {
            long fileLength = videoFile.length();
            InputStream inputStream = new FileInputStream(videoFile);
            InputStreamResource resource = new InputStreamResource(inputStream);

            if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                String[] ranges = rangeHeader.substring(6).split("-");
                long start = Long.parseLong(ranges[0]);
                long end = ranges.length > 1 && !ranges[1].isEmpty() ? Long.parseLong(ranges[1]) : fileLength - 1;

                long contentLength = end - start + 1;

                inputStream.skip(start); // Skip to the requested range

                HttpHeaders headers = new HttpHeaders();
                headers.add("Content-Range", "bytes " + start + "-" + end + "/" + fileLength);
                headers.add("Accept-Ranges", "bytes");

                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                        .contentType(MediaType.valueOf("video/mp4"))
                        .headers(headers)
                        .contentLength(contentLength)
                        .body(resource);
            } else {
                return ResponseEntity.ok()
                        .contentType(MediaType.valueOf("video/mp4"))
                        .contentLength(fileLength)
                        .body(resource);
            }
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Fetch transcription of a video
    public String getTranscriptionByUserId(Long userId) {
        Optional<Video> videoOptional = videoRepository.findByUserId(userId);

        if (videoOptional.isEmpty()) {
            throw new IllegalArgumentException("Video not found for the user");
        }

        Video video = videoOptional.get();
        System.out.println("Fetched video transcription: " + video.getTranscription());
        return video.getTranscription();
    }

    // Fetch transcription of a video by videoId
public String getTranscriptionByVideoId(Long videoId) {
    // Fetch the video by its ID
    Optional<Video> videoOptional = videoRepository.findById(videoId);

    if (videoOptional.isEmpty()) {
        throw new IllegalArgumentException("Video not found for the given ID");
    }

    Video video = videoOptional.get();
    System.out.println("Fetched video transcription: " + video.getTranscription());
    return video.getTranscription();
}


    public Video updateTranscriptionByUserId(Long userId, String transcriptionContent) {
        // Fetch user by ID
        Optional<User> userOptional = userRepository.findById(userId);
        if (userOptional.isEmpty()) {
            throw new IllegalArgumentException("Invalid user ID");
        }

        // Fetch video for the user
        Optional<Video> videoOptional = videoRepository.findByUserId(userId);
        if (videoOptional.isEmpty()) {
            throw new IllegalArgumentException("Video not found for the user");
        }

        Video video = videoOptional.get();
        video.setTranscription(transcriptionContent);

        // Save updated video
        return videoRepository.save(video);
    }

    public boolean deleteVideoByUserId(Long userId) {
        // Fetch the video associated with the userId
        Optional<Video> videoOptional = videoRepository.findByUserId(userId);

        // Check if the video exists
        if (videoOptional.isPresent()) {
            Video video = videoOptional.get();

            // Delete the video from the repository
            videoRepository.delete(video);
            return true; // Return true if deletion is successful
        }

        return false; // Return false if video is not found
    }

    public List<Video> getAllVideos() {
        // Fetch all videos from the database
        return videoRepository.findAll(); // Assuming you're using JPA repository to fetch the data
    }

    String generateSRT(String transcription) {
        System.out.println("Starting SRT generation for transcription: " + transcription);

        // Split transcription into lines
        String[] lines = transcription.split("\\.\\s+");
        System.out.println("Split transcription into " + lines.length + " lines.");

        StringBuilder srtBuilder = new StringBuilder();
        int startTime = 0;
        double wordsPerSecond = 2.0; // Average speaking rate in words per second

        for (int i = 0; i < lines.length; i++) {
            int wordCount = lines[i].split("\\s+").length;
            int duration = (int) Math.ceil(wordCount / wordsPerSecond); // Calculate duration dynamically
            int endTime = startTime + duration;

            // Append SRT entry
            srtBuilder.append(i + 1).append("\n")
                    .append(formatTime(startTime)).append(" --> ").append(formatTime(endTime)).append("\n")
                    .append(lines[i]).append("\n\n");

            System.out.println("Added SRT entry " + (i + 1) + ":");
            System.out.println("Start time: " + formatTime(startTime));
            System.out.println("End time: " + formatTime(endTime));
            System.out.println("Text: " + lines[i]);

            startTime = endTime; // Move to the next start time
        }

        String srtContent = srtBuilder.toString();
        System.out.println("Generated SRT content:\n" + srtContent);

        return srtContent;
    }

    private String formatTime(int seconds) {
        int hours = seconds / 3600;
        int minutes = (seconds % 3600) / 60;
        int secs = seconds % 60;
        String formattedTime = String.format("%02d:%02d:%02d,000", hours, minutes, secs);
        System.out.println("Formatted time for " + seconds + " seconds: " + formattedTime);
        return formattedTime;
    }

    public List<Video> filterVideos(String keySkills, String experience, String industry, String city) {
        // Log the incoming filter details for debugging
        System.out.println("Received filter request with details:");
        System.out.println("Key Skills: " + keySkills);
        System.out.println("Experience: " + experience);
        System.out.println("Industry: " + industry);
        System.out.println("City: " + city);

        // Call the repository method to perform the filtering
        List<Video> videos = videoRepository.findByFilters(keySkills, experience, industry, city);

        // Log the result of the filter operation
        System.out.println("Filtered videos count: " + (videos != null ? videos.size() : 0));
        if (videos != null && !videos.isEmpty()) {
            System.out.println("Filtered Videos:");
            for (Video video : videos) {
                System.out.println("Video ID: " + video.getId() + ", File Name: " + video.getFileName());
            }
        }

        return videos;
    }

    public void addLike(Long userId, Long videoId) {
        // Check if the user already liked the video
        System.out.println("Checking if user " + userId + " has already liked video " + videoId);
        if (likeRepository.existsByUserIdAndVideoId(userId, videoId)) {
            System.out.println("User " + userId + " has already liked video " + videoId);
            throw new IllegalArgumentException("User has already liked this video");
        }

        // Add the like to the likes table
        Like like = new Like();
        like.setUserId(userId);
        like.setVideoId(videoId);
        System.out.println("Adding like for user " + userId + " on video " + videoId);
        likeRepository.save(like);
        System.out.println("Like saved successfully for user " + userId + " on video " + videoId);
    }

    public void addDislike(Long userId, Long videoId) {
        // Check if the user has already liked or disliked the video
        Optional<Like> existingLike = likeRepository.findByUserIdAndVideoId(userId, videoId);

        if (existingLike.isPresent()) {
            Like like = existingLike.get();

            // If the user liked the video, remove the like and add the dislike
            if (like.getIsLike()) {
                // Remove the like
                likeRepository.delete(like);

                // Add a new dislike (mark as isLike=false)
                Like dislike = new Like(userId, videoId, videoId, null, false); // false means dislike
                likeRepository.save(dislike);
            } else {
                // If the user already disliked the video, just remove the dislike (no action
                // needed)
                likeRepository.delete(like);
            }
        } else {
            // If no like/dislike exists, add a new dislike
            Like dislike = new Like(userId, videoId, videoId, null, false); // false indicates dislike
            likeRepository.save(dislike);
        }
    }

    public Long getLikeCount(Long videoId) {
        // Call the repository method to count likes for the video
        return likeRepository.countByVideoIdAndIsLikeTrue(videoId);
    }

    public Video getVideoById(Long videoId) {
        return videoRepository.findById(videoId).orElse(null);
    }

    public List<Long> getVideoIdsByUserId(Long userId) {
        // Retrieve the list of video IDs associated with the user
        return videoRepository.findVideoIdsByUserId(userId); // Custom query to fetch video IDs
    }

    public List<Video> getLikedVideosByUserId(Long userId) {
        // Fetch the liked videos for the given userId
        return likeRepository.findLikedVideosByUserId(userId);
    }

    public List<Object[]> getTrendingVideos() {
        LocalDateTime startOfWeek = LocalDateTime.now().minusDays(7);
        return likeRepository.findTrendingVideos(startOfWeek);
    }

    public String getVideoPathByUserId(Long userId) {
        // Fetch the video record associated with the user ID
        Optional<Video> videoOptional = videoRepository.findByUserId(userId);

        // Return the video path if found
        return videoOptional.map(Video::getFilePath).orElse(null);
    }

    public String getVideoPathById(Long videoId) {
        return videoRepository.findById(videoId)
                .map(Video::getFilePath)
                .orElse(null);
    }

}
