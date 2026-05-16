package com.edu.platform.exercise;

import com.edu.platform.course.Course;
import com.edu.platform.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExerciseRepository extends JpaRepository<Exercise, UUID> {

    List<Exercise> findByCourse(Course course);

    List<Exercise> findByCourseAndIsPublished(Course course, boolean isPublished);

    List<Exercise> findByCourseInAndIsPublished(List<Course> courses, boolean isPublished);

    @Query("SELECT COUNT(e) FROM Exercise e WHERE e.course.teacher = :teacher")
    long countByTeacher(@Param("teacher") User teacher);
}
