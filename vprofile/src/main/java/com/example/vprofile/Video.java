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
    private String filePath;
    private String audioFilePath; 
    private Long userId;

    private String url ;
    @Column(name = "transcription", columnDefinition = "LONGTEXT")
    private String transcription; // Add transcription field
    private String thumbnailurl;// Field to store video as byte array
    public Video() {}

    // Add this constructor to match the parameters being passed in the service
    public Video(String fileName, String thumbnailurl, Long userId, String transcription, String audioFilePath, String url) {
        this.fileName = fileName;
        this.thumbnailurl = thumbnailurl;
        this.userId = userId;
        this.transcription = transcription;
        this.audioFilePath = audioFilePath;
        this.url = url;
    }

    public String getThumbnailUrl() {
        return thumbnailurl;
    }

    public void setThumbnailUrl(String thumbnailurl) {
        this.thumbnailurl = thumbnailurl;
    }

    public String getUrl(){
        return url;
    }

    public void setUrl(String url){
        this.url=url;
    }

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

