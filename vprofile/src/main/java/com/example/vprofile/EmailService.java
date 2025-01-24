package com.example.vprofile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

@Service
public class EmailService {
    @Autowired
private JavaMailSender mailSender;

public void sendVerificationEmail(String to, String token) {
    String subject = "Email Verification";
    String verificationLink = "http://89.116.134.110:8081/api/verify-email?token=" + token;

    // HTML content with button styles
    String emailContent = "<html>"
        + "<body>"
        + "<h3>Welcome to Our App!</h3>"
        + "<p>Click the button below to verify your email and activate your account:</p>"
        + "<a href='" + verificationLink + "' style='"
        + "display: inline-block; "
        + "padding: 10px 20px; "
        + "font-size: 16px; "
        + "font-weight: bold; "
        + "color: white; "
        + "background-color: #f44336; " // Red color
        + "text-decoration: none; "
        + "border-radius: 5px; "
        + "text-align: center;'>"
        + "Verify"
        + "</a>"
        + "</body>"
        + "</html>";

    try {
        // Use MimeMessage to send HTML email
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true); // true indicates HTML

        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(emailContent, true); // Set to true to indicate that this is HTML content

        mailSender.send(message);
        System.out.println("Verification email sent successfully with token: " + token);
    } catch (Exception e) {
        e.printStackTrace();
        System.out.println("Error sending email.");
    }
}
}

