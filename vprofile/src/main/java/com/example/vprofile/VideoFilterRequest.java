package com.example.vprofile;

import java.util.List;

public class VideoFilterRequest {
    private String keySkills;
    private List<String> experience;
    private List<String> industry;
    private List<String> city;

    public VideoFilterRequest() {
    }

    public VideoFilterRequest(String keySkills, List<String> experience, List<String> industry, List<String> city) {
        this.keySkills = keySkills;
        this.experience = experience;
        this.industry = industry;
        this.city = city;
    }

    public String getKeySkills() {
        return keySkills;
    }
    public void setKeySkills(String keySkills) {
        this.keySkills = keySkills;
    }
    public List<String> getExperience() {
        return experience;
    }
    public void setExperience(List<String> experience) {
        this.experience = experience;
    }
    public List<String> getIndustry() {
        return industry;
    }
    public void setIndustry(List<String> industry) {
        this.industry = industry;
    }
    public List<String> getCity() {
        return city;
    }
    public void setCity(List<String> city) {
        this.city = city;
    }

    // Getters and Setters
}
