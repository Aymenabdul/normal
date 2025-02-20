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
import org.springframework.web.servlet.view.RedirectView;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletResponse;

@Controller
@RequestMapping("/api")
public class JavaMailSender {

    @Autowired
    private VerificationTokenService verificationTokenService;

    @Autowired
    private UserService userService;

    @GetMapping("/verify-email")
    public RedirectView verifyEmail(@RequestParam("token") String token) {
        User user = verificationTokenService.verifyTemporaryToken(token);
    
        if (user != null) {
            user.setEnabled(true);
            userService.saveUser(user);
    
            // Redirect to wezume.com after successful verification
            return new RedirectView("https://wezume.com/success");
        }
    
        // Redirect to an error page if the token is invalid/expired
        return new RedirectView("https://wezume.com/error"); 
    }

}
