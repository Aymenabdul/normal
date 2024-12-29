package com.example.vprofile;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LikeRepository extends JpaRepository<Like, Long> {
    boolean existsByUserIdAndVideoId(Long userId, Long videoId);  // Check if a user has liked the video

    Long countByVideoId(Long videoId);  // Count likes for a specific video
    Optional<Like> findByUserIdAndVideoId(Long userId, Long videoId);

    @Query("SELECT v FROM Like l JOIN Video v ON l.videoId = v.id WHERE l.userId = :userId")
    List<Video> findLikedVideosByUserId(@Param("userId") Long userId);    

}

