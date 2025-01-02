package com.example.vprofile;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VerificationTokenService {

    @Autowired
    private VerificationTokenRepository tokenRepository;

    @Autowired
    private EmailService emailService;

   private final Map<String, User> temporaryUserStore = new ConcurrentHashMap<>();

    // Create a temporary token and store the user details
    public String createTemporaryToken(User user) {
        String token = UUID.randomUUID().toString();
        temporaryUserStore.put(token, user);
        emailService.sendVerificationEmail(user.getEmail(), token);
        return token;
    }

    // Verify the token and return the associated user
    public User verifyTemporaryToken(String token) {
        if (temporaryUserStore.containsKey(token)) {
            return temporaryUserStore.remove(token); // Remove and return user
        }
        throw new IllegalArgumentException("Invalid or expired token.");
    }

    // public boolean verifyToken(String token) {
    //     // Find the token in the database
    //     VerificationToken verificationToken = tokenRepository.findByToken(token);

    //     // Check if the token exists and is valid
    //     return verificationToken != null;
    // }

    public User getUserByToken(String token) {
        // Find the token in the database
        VerificationToken verificationToken = tokenRepository.findByToken(token);

        // Return the associated user if the token exists
        if (verificationToken != null) {
            return verificationToken.getUser();
        }

        return null;
    }
}

