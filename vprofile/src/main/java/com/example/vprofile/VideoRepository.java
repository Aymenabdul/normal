
package com.example.vprofile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VideoRepository extends JpaRepository<Video, Long> {
        // You can add custom query methods if needed
        Optional<Video> findByUserId(Long userId);

        Optional<Video> findByFileName(String fileName);

        Optional<Video> findByUrl(String url);

        Optional<Video> findTopByUserIdOrderByCreatedAtDesc(Long userId);

        Optional<Video> findTopByUserIdOrderByIdDesc(Long userId);

        @Query(value = "SELECT v.* FROM video v " +
                        "JOIN likes l ON l.video_id = v.id " +
                        "WHERE l.created_at >= :startOfWeek AND l.is_like = 1 " +
                        "GROUP BY l.video_id " +
                        "ORDER BY COUNT(l.id) DESC", countQuery = "SELECT COUNT(DISTINCT l.video_id) FROM likes l WHERE l.created_at >= :startOfWeek AND l.is_like = 1", nativeQuery = true)
        Page<Video> fetchTrendingVideos(@Param("startOfWeek") LocalDateTime startOfWeek, Pageable pageable);

        @Query("SELECT v FROM Like l JOIN Video v ON l.videoId = v.id WHERE l.userId = :userId")
        Page<Video> fetchLikedVideosByUserId(@Param("userId") Long userId, Pageable pageable);

        Optional<Video> findById(Long videoId);

        Page<Video> findAll(Pageable pageable);

        List<Video> findAll();

        @Query("SELECT v.id FROM Video v WHERE v.userId = :userId")
        List<Long> findVideoIdsByUserId(@Param("userId") Long userId);

        @Query(value = "SELECT v.* FROM video v " +
                        "JOIN likes l ON l.video_id = v.id " +
                        "WHERE l.created_at >= :startOfWeek AND l.is_like = 1 " +
                        "GROUP BY l.video_id " +
                        "ORDER BY COUNT(l.id) DESC", nativeQuery = true)
        List<Video> findTrendingVideos(@Param("startOfWeek") LocalDateTime startOfWeek);

        @Query(value = "SELECT v1_0.id, v1_0.audio_file_path,v1_0.thumbnailurl, v1_0.file_name, v1_0.file_path, v1_0.transcription, v1_0.user_id, v1_0.video_data,v1_0.url "
                        +
                        "FROM video v1_0 JOIN user u1_0 ON v1_0.user_id = u1_0.id " +
                        "WHERE " +
                        "(COALESCE(:keySkills, '') = '' OR u1_0.key_skills = :keySkills) AND " +
                        "(COALESCE(:experience, '') = '' OR u1_0.experience = :experience) AND " +
                        "(COALESCE(:industry, '') = '' OR u1_0.industry = :industry) AND " +
                        "(COALESCE(:cities, '') = '' OR u1_0.city = :cities)", nativeQuery = true)
        List<Video> findByFilters(@Param("keySkills") String keySkills,
                        @Param("experience") String experience,
                        @Param("industry") String industry,
                        @Param("cities") String cities);

        @Query("SELECT COUNT(v) FROM Video v")
        long countAllUpload();

}
