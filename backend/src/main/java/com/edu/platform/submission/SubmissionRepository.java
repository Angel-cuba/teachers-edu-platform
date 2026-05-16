package com.edu.platform.submission;

import com.edu.platform.exercise.Exercise;
import com.edu.platform.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    List<Submission> findByExercise(Exercise exercise);

    List<Submission> findByExerciseAndStudent(Exercise exercise, User student);

    Optional<Submission> findByExerciseAndStudentAndStatusNot(
            Exercise exercise, User student, SubmissionStatus status);

    boolean existsByExerciseAndStudent(Exercise exercise, User student);

    List<Submission> findByStudentOrderBySubmittedAtDesc(User student);

    List<Submission> findByStudentAndExerciseIn(User student, List<Exercise> exercises);

    long countByStudentAndExerciseIn(User student, List<Exercise> exercises);

    long countByStudentAndStatus(User student, SubmissionStatus status);

    @Query("SELECT COUNT(s) FROM Submission s WHERE s.exercise.course.teacher = :teacher AND s.status = 'PENDING'")
    long countPendingByTeacher(@Param("teacher") User teacher);

    @Query("SELECT s FROM Submission s WHERE s.exercise.course.teacher = :teacher AND s.status = 'PENDING' ORDER BY s.submittedAt DESC")
    List<Submission> findPendingByTeacher(@Param("teacher") User teacher);
}
