package com.edu.platform.course;

import com.edu.platform.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CourseRepository extends JpaRepository<Course, UUID> {

    List<Course> findByTeacher(User teacher);

    Optional<Course> findByEnrollCode(String enrollCode);

    boolean existsByEnrollCode(String enrollCode);

    long countByTeacher(User teacher);
}
