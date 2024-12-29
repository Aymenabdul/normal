package com.example.vprofile;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "user")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;

    @Column(name = "phone_number", unique = true) // Phone number should be unique
    private String phoneNumber;

    @NotNull
    @Email
    @Column(unique = true) // Email should be unique
    private String email;

    private String password;
    private String jobOption;

    @Lob
    @Column(name = "profile_pic", columnDefinition = "LONGBLOB")
    private byte[] profilePic;

    private String currentRole;
    private String experience; // Assuming experience is in years; adjust type as needed
    private String industry;
    private String currentEmployer;
    private String languagesKnown;
    private String keySkills;

    // New fields added
    private String city;
    private Integer establishedYear; // Assuming this is the year the user's organization was established
    private String languages; // To store multiple languages

    // Constructors
    public User(Long id, String firstName, String lastName, String email, String phoneNumber, String password,
                String jobOption, byte[] profilePic, String currentRole, String keySkills,
                String experience, String industry, String currentEmployer, String languagesKnown,
                String city, Integer establishedYear, String languages) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.password = password;
        this.jobOption = jobOption;
        this.profilePic = profilePic;
        this.currentRole = currentRole;
        this.keySkills = keySkills;
        this.experience = experience;
        this.industry = industry;
        this.currentEmployer = currentEmployer;
        this.languagesKnown = languagesKnown;
        this.city = city;
        this.establishedYear = establishedYear;
        this.languages = languages;
    }

    public User() {}

    // Getters and Setters for new fields
    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public Integer getEstablishedYear() {
        return establishedYear;
    }

    public void setEstablishedYear(Integer establishedYear) {
        this.establishedYear = establishedYear;
    }

    public String getLanguages() {
        return languages;
    }

    public void setLanguages(String languages) {
        this.languages = languages;
    }

    // Existing Getters and Setters remain unchanged

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getJobOption() {
        return jobOption;
    }

    public void setJobOption(String jobOption) {
        this.jobOption = jobOption;
    }

    public byte[] getProfilePic() {
        return profilePic;
    }

    public void setProfilePic(byte[] profilePic) {
        this.profilePic = profilePic;
    }

    public String getCurrentRole() {
        return currentRole;
    }

    public void setCurrentRole(String currentRole) {
        this.currentRole = currentRole;
    }

    public String getKeySkills() {
        return keySkills;
    }

    public void setKeySkills(String keySkills) {
        this.keySkills = keySkills;
    }

    public String getExperience() {
        return experience;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getCurrentEmployer() {
        return currentEmployer;
    }

    public void setCurrentEmployer(String currentEmployer) {
        this.currentEmployer = currentEmployer;
    }

    public String getLanguagesKnown() {
        return languagesKnown;
    }

    public void setLanguagesKnown(String languagesKnown) {
        this.languagesKnown = languagesKnown;
    }
}
