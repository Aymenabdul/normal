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
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.util.Arrays;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
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
        validateUser(userId);
    
        // Save the uploaded file temporarily
        Path videoFilePath = saveUploadedFile(file);
        File tempCompressedFile = new File(uploadDir, "compressed_" + file.getOriginalFilename());
    
        // Compress the video file
        try {
            ffmpegService.compressVideo(videoFilePath.toFile(), tempCompressedFile);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    
        // Ensure the compressed file exists
        if (!tempCompressedFile.exists() || tempCompressedFile.length() == 0) {
            throw new RuntimeException("Compressed video file was not created or is empty.");
        }
    
        // Extract audio and generate transcription
        String audioExtractedUrl = extractAudioWithTransloadit(videoFilePath);
        String downloadedAudioPath = downloadAudio(audioExtractedUrl, file.getOriginalFilename());
        String transcription = convertAudioToText(downloadedAudioPath);
    
        // Generate URLs for accessing the video and audio files
        String videoUrl = "https://wezume.in/uploads/videos/" + tempCompressedFile.getName();
    
        // Extract audio file name to build public URL
        String audioFileName = Paths.get(downloadedAudioPath).getFileName().toString();
        String audioUrl = "https://wezume.in/uploads/videos/audio/" + audioFileName;
    
        // Create and save the Video entity
        Video video = new Video();
        video.setFileName(tempCompressedFile.getName());
        video.setUserId(userId);
        video.setFilePath(tempCompressedFile.getAbsolutePath());
        video.setUrl(videoUrl);
        video.setAudioFilePath(audioUrl); // ✅ audio URL set here
        video.setTranscription(transcription);
    
        return videoRepository.save(video);
    }
    

    private void validateUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User with ID " + userId + " does not exist.");
        }
    }
    private Path saveUploadedFile(MultipartFile file) throws IOException {
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }
        Path filePath = Paths.get(uploadDir + file.getOriginalFilename());
        Files.write(filePath, file.getBytes());

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
            if (response.json().has("results") && response.json().getJSONObject("results").has("extracted-audio")) {
                JSONArray extractedAudioArray = response.json().getJSONObject("results")
                        .getJSONArray("extracted-audio");
                if (extractedAudioArray.length() > 0) {
                    JSONObject audioObject = extractedAudioArray.getJSONObject(0);
                    String audioUrl = audioObject.getString("url");
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
        return audioFilePath.toString();
    }

    private String convertAudioToText(String audioFilePath) throws IOException {
        AssemblyAI client = AssemblyAI.builder()
                .apiKey(assemblyAiApiKey)
                .build();

        TranscriptOptionalParams params = TranscriptOptionalParams.builder()
                .speakerLabels(true)
                .build();

        Transcript transcript = client.transcripts().transcribe(new File(audioFilePath), params);

        if (transcript.getStatus().equals(TranscriptStatus.ERROR)) {
            throw new IOException("Transcription error: " + transcript.getError().orElse("Unknown error"));
        }
        return transcript.getText().orElse("No transcription text available");
    }

    public Optional<Video> getLatestVideoByUserId(Long userId) {
        return videoRepository.findTopByUserIdOrderByIdDesc(userId);
    }

    // Fetch transcription of a video
    public String getTranscriptionByUserId(Long userId) {
        Optional<Video> videoOptional = videoRepository.findByUserId(userId);

        if (videoOptional.isEmpty()) {
            throw new IllegalArgumentException("Video not found for the user");
        }

        Video video = videoOptional.get();
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
        return videoRepository.findAll();
    }

    String generateSRT(String transcription) {
        System.out.println("Starting SRT generation for transcription: " + transcription);

        // Split transcription into lines
        String[] lines = transcription.split("\\.\\s+");
        System.out.println("Split transcription into " + lines.length + " lines.");

        StringBuilder srtBuilder = new StringBuilder();
        int startTime = 0;
        double wordsPerSecond = 3; // Average speaking rate in words per second

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
        List<Video> videos = videoRepository.findByFilters(keySkills, experience, industry, city);
        if (videos != null && !videos.isEmpty()) {
            for (Video video : videos) {
            }
        }

        return videos;
    }

    public void addLike(Long userId, Long videoId) {
        if (likeRepository.existsByUserIdAndVideoId(userId, videoId)) {
            throw new IllegalArgumentException("User has already liked this video");
        }

        // Add the like to the likes table
        Like like = new Like();
        like.setUserId(userId);
        like.setVideoId(videoId);
        likeRepository.save(like);
    }

    public void addDislike(Long userId, Long videoId) {
        Optional<Like> existingLike = likeRepository.findByUserIdAndVideoId(userId, videoId);

        if (existingLike.isPresent()) {
            Like like = existingLike.get();
            if (like.getIsLike()) {
                likeRepository.delete(like);
                Like dislike = new Like(userId, videoId, videoId, null, false);
                likeRepository.save(dislike);
            } else {
                likeRepository.delete(like);
            }
        } else {
            Like dislike = new Like(userId, videoId, videoId, null, false);
            likeRepository.save(dislike);
        }
    }

    public Long getLikeCount(Long videoId) {
        return likeRepository.countByVideoIdAndIsLikeTrue(videoId);
    }

    public Video getVideoById(Long videoId) {
        return videoRepository.findById(videoId).orElse(null);
    }

    public List<Long> getVideoIdsByUserId(Long userId) {
        return videoRepository.findVideoIdsByUserId(userId);
    }

    public List<Video> getLikedVideosByUserId(Long userId) {
        return likeRepository.findLikedVideosByUserId(userId);
    }

    public List<Video> getTrendingVideos() {
        LocalDateTime startOfWeek = LocalDateTime.now().minusDays(7);
        return videoRepository.findTrendingVideos(startOfWeek);
    }

    public String getVideoPathByUserId(Long userId) {
        Optional<Video> videoOptional = videoRepository.findByUserId(userId);
        return videoOptional.map(Video::getFilePath).orElse(null);
    }

    public String getVideoPathById(Long videoId) {
        return videoRepository.findById(videoId)
                .map(Video::getFilePath)
                .orElse(null);
    }

    public Page<Video> getVideos(int page, int size) {
        return videoRepository.findAll(PageRequest.of(page, size));
    }

    public Page<Video> getPageLikedVideosByUserId(Long userId, Pageable pageable) {
        return videoRepository.fetchLikedVideosByUserId(userId, pageable);
    }

    // ✅ Get paginated trending videos
    public Page<Video> getPaginatedTrendingVideos(Pageable pageable) {
        LocalDateTime startOfWeek = LocalDateTime.now().minusDays(7);
        return videoRepository.fetchTrendingVideos(startOfWeek, pageable);
    }

}
