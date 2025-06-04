package com.example.vprofile;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TotalScoreRepository extends JpaRepository<TotalScore, Long> {
    Optional<TotalScore> findByVideoId(Long videoId);
}
