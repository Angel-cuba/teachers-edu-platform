package com.edu.platform.course;

import com.edu.platform.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {

    List<Enrollment> findByStudent(User student);

    List<Enrollment> findByCourse(Course course);

    Optional<Enrollment> findByCourseAndStudent(Course course, User student);

    boolean existsByCourseAndStudent(Course course, User student);

    long countByCourse(Course course);

    long countByStudent(User student);

    @Query("SELECT COUNT(DISTINCT e.student) FROM Enrollment e WHERE e.course.teacher = :teacher")
    long countUniqueStudentsByTeacher(@Param("teacher") User teacher);
}
