package com.example.vprofile;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import jakarta.servlet.http.HttpServletResponse;

@Controller
@RequestMapping("/api")
public class JavaMailSender {

    @Autowired
    private VerificationTokenService verificationTokenService;

    @Autowired
    private UserService userService;

    @GetMapping("/verify-email")
public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
    // Attempt to verify the token and retrieve the associated user
    User user = verificationTokenService.verifyTemporaryToken(token); // Directly assign the returned User

    if (user != null) {
        // Enable the user and save to the database
        user.setEnabled(true);
        userService.saveUser(user);

        // Prepare response
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Your account has been verified and activated.");
        return ResponseEntity.ok(response);
    }

    // Return bad request if token verification fails
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired token.");
}

}
