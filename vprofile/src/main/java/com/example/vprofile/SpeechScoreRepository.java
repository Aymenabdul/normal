package com.example.vprofile;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SpeechScoreRepository extends JpaRepository<SpeechScore, Long> {
    Optional<SpeechScore> findByVideoId(Long videoId); // ✅ Correct
}
