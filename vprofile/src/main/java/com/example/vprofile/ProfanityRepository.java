package com.example.vprofile;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfanityRepository extends JpaRepository<Profanity, Long> {
    Profanity findByUserIdAndVideoId(Long userId, Long videoId);
}