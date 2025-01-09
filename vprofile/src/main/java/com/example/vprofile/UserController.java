package com.example.vprofile;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType; // Import MediaType here
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users") // Base URL for this controller
public class UserController {
    private final UserRepository userRepository;

    @Autowired
    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    @Autowired
    private UserService userService;

    @Autowired
    private VerificationTokenService verificationTokenService;

    @PostMapping
public ResponseEntity<Map<String, Object>> registerUser(@RequestBody User user) {
    // Generate a unique verification token
    String token = verificationTokenService.createTemporaryToken(user);

    // Prepare response
    Map<String, Object> response = new HashMap<>();
    response.put("message", "Verification email sent successfully. Please verify your email to complete registration.");
    response.put("verificationToken", token); // Include for testing; remove in production.

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
}

    @PostMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmail(@RequestBody Map<String, String> emailPayload) {
        String email = emailPayload.get("email");
        boolean exists = userRepository.existsByEmail(email);
        return ResponseEntity.ok(Collections.singletonMap("exists", exists));
    }

    @PostMapping("/check-Recruteremail")
public ResponseEntity<Map<String, Object>> checkRecEmail(@RequestBody Map<String, String> emailPayload) {
    String email = emailPayload.get("email");

    // List of restricted domains
    List<String> restrictedDomains = List.of("gmail.com", "yahoo.com", "outlook.com", "hotmail.com","example.com");

    // Extract the domain from the email
    String[] emailParts = email.split("@");
    if (emailParts.length != 2) {
        return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Invalid email format"));
    }
    String emailDomain = emailParts[1];

    // Check if the domain is restricted
    if (restrictedDomains.contains(emailDomain.toLowerCase())) {
        return ResponseEntity.ok(Collections.singletonMap("error", "Public email domains are not allowed"));
    }

    // Check if the email already exists in the database
    boolean exists = userRepository.existsByEmail(email);
    Map<String, Object> response = new HashMap<>();
    response.put("exists", exists);

    if (!exists) {
        response.put("message", "Email is valid and can be used.");
    }

    return ResponseEntity.ok(response);
}


    @PostMapping("/check-phone")
    public ResponseEntity<Boolean> checkPhone(@RequestBody String phoneNumber) {
        boolean phoneExists = userService.isPhoneExists(phoneNumber);
        return ResponseEntity.ok(phoneExists);
    }
    @GetMapping("/user/{userId}/profilepic")
public ResponseEntity<byte[]> getUserProfilePic(@PathVariable Long userId) {
    Optional<User> userOptional = userRepository.findById(userId);
    if (!userOptional.isPresent()) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    }

    User user = userOptional.get();
    if (user.getProfilePic() != null) {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)  // Set the appropriate content type
                .body(user.getProfilePic());        // Send the byte array (image) in the response body
    } else {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
    }
}

@PutMapping("/update/{userId}")
    public ResponseEntity<User> updateUser(@PathVariable Long userId, @RequestBody User updatedUser) {
        User updated = userService.updateUser(userId, updatedUser);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/get/{userId}")
    public ResponseEntity<User> getUserById(@PathVariable Long userId) {
        Optional<User> user = userRepository.findById(userId);

        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkUserExists(@RequestParam String email) {
        Optional<User> user = userService.findByEmail(email);

        if (user.isPresent()) {
            Map<String, Object> response = new HashMap<>();
            response.put("exists", true);
            response.put("jobOption", user.get().getJobOption());
            response.put("email",user.get().getEmail());
            response.put("userId",user.get().getId());
            response.put("firstName",user.get().getFirstName());
            return ResponseEntity.ok(response);
        } else {
            Map<String, Object> response = new HashMap<>();
            response.put("exists", false);
            return ResponseEntity.ok(response);
        }
    }
    
}
