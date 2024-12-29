package com.example.vprofile;

public class LinkedInAuthException extends Exception {
    public LinkedInAuthException(String message) {
        super(message);
    }

    public LinkedInAuthException(String message, Throwable cause) {
        super(message, cause);
    }
}
