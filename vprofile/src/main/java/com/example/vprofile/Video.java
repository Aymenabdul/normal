package com.example.vprofile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;

@Entity
public class Video {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String fileName;
    
    @Lob
    @Column(name = "video_data", columnDefinition = "LONGBLOB")
    private byte[] videoData; // Field to store video as byte array

    private String filePath;
    private String audioFilePath; 
    private Long userId;
    
    @Column(name = "transcription", columnDefinition = "LONGTEXT")
    private String transcription; // Add transcription field

    public Video() {}

    // Add this constructor to match the parameters being passed in the service
    public Video(String fileName, byte[] videoData,Long userId, String transcription, String audioFilePath) {
        this.fileName = fileName;
        this.videoData = videoData;
        this.userId = userId;
        this.transcription = transcription;
        this.audioFilePath = audioFilePath;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public byte[] getVideoData() {
        return videoData;
    }

    public void setVideoData(byte[] videoData) {
        this.videoData = videoData;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getTranscription() {
        return transcription; // Getter for transcription
    }

    public void setTranscription(String transcription) {
        this.transcription = transcription; // Setter for transcription
    }

    public String getAudioFilePath() {
        return audioFilePath;
    }

    public void setAudioFilePath(String audioFilePath) {
        this.audioFilePath = audioFilePath;
    }
}

