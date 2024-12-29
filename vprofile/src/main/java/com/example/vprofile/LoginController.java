package com.example.vprofile;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class LoginController {

    @Autowired
    private UserRepository userRepository; // Injecting UserRepository

    @Autowired
    private VideoRepository videoRepository;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        System.out.println(email);
        String password = payload.get("password");
        System.out.println(password);
    
        // Fetch user from the database
        Optional<User> userOptional = userRepository.findByEmail(email);
    
        if (userOptional.isPresent()) {
            User user = userOptional.get();
    
            // Directly compare passwords
            if (user.getPassword().equals(password)) {
                // Fetch videos associated with the user
                Optional<Video> userVideos = videoRepository.findByUserId(user.getId());
    
                // Map videos to include their IDs and details
                List<Map<String, Object>> videoDetails = userVideos.stream().map(video -> {
                    Map<String, Object> videoMap = new HashMap<>();
                    videoMap.put("videoId", video.getId());
                    return videoMap;
                }).toList();
    
                // Prepare the response
                Map<String, Object> response = new HashMap<>();
                response.put("firstName", user.getFirstName());
                response.put("jobOption", user.getJobOption());
                response.put("userId", user.getId());
                response.put("profilePic", user.getProfilePic());
                response.put("industry", user.getIndustry());
                response.put("currentEmployer",user.getCurrentEmployer());
                response.put("establishedYear",user.getEstablishedYear());
                response.put("KeySkills",user.getKeySkills());
                response.put("currentRoll",user.getCurrentRole());
                response.put("videos", videoDetails); // Include videos with IDs in the response
    
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("message", "Invalid email or password!");
                return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
            }
        } else {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "Invalid email or password!");
            return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
        }
    }
    
}