package com.example.vprofile;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsById(Long id);
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);
     @Query("SELECT COUNT(u) FROM User u")
    long countAllUsers();

    @Query("SELECT COUNT(u) FROM User u WHERE u.jobOption = 'Employer'")
long countRecruiters();
List<User> findByJobOption(String jobOption);

}
