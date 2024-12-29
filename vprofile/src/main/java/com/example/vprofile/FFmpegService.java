package com.example.vprofile;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class FFmpegService {

    private String ffmpegPath;

    @Autowired
    public FFmpegService(@Value("${ffmpeg.path}") String ffmpegPath) {
        this.ffmpegPath = ffmpegPath;

        // Log the FFmpeg path for debugging
        System.out.println("Using FFmpeg path: " + ffmpegPath);
    }

    public void compressVideo(File inputFile, File outputFile) throws IOException, InterruptedException {
        // Ensure ffmpegPath is hardcoded
        ffmpegPath = "/usr/bin/ffmpeg";

        // Command arguments for FFmpeg
        String[] command = {
            ffmpegPath,
            "-i", inputFile.getAbsolutePath(),
            "-vcodec", "libx264",
            "-preset", "ultrafast",
            "-crf", "30",
            "-vf", "scale=1280:-1",
            "-f", "mp4",
            outputFile.getAbsolutePath()
        };

        // Log the command for debugging
        System.out.println("Running FFmpeg command: " + String.join(" ", command));

        // Execute the FFmpeg command
        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(true); // Combine stdout and stderr

        // Capture process output
        Process process = processBuilder.start();
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
        }

        // Log the FFmpeg output for debugging
        System.out.println("FFmpeg output: " + output.toString());

        // Wait for process to complete
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new IOException("FFmpeg process failed with exit code " + exitCode);
        }
    }
}


