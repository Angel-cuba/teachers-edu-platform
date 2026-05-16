package com.edu.platform.exercise;

import com.edu.platform.course.Course;
import com.edu.platform.course.CourseService;
import com.edu.platform.course.EnrollmentRepository;
import com.edu.platform.exercise.dto.ExerciseRequest;
import com.edu.platform.exercise.dto.ExerciseResponse;
import com.edu.platform.notification.NotificationService;
import com.edu.platform.submission.SubmissionRepository;
import com.edu.platform.user.User;
import com.edu.platform.user.UserRole;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExerciseService {

    private final ExerciseRepository exerciseRepository;
    private final CourseService courseService;
    private final EnrollmentRepository enrollmentRepository;
    private final SubmissionRepository submissionRepository;
    private final NotificationService notificationService;

    public List<ExerciseResponse> getExercisesForCourse(UUID courseId, User user) {
        Course course = courseService.findById(courseId);

        List<Exercise> exercises;
        if (user.getRole() == UserRole.STUDENT) {
            exercises = exerciseRepository.findByCourseAndIsPublished(course, true);
        } else {
            exercises = exerciseRepository.findByCourse(course);
        }

        // For students, attach their own submission status to each exercise in one batch query
        if (user.getRole() == UserRole.STUDENT && !exercises.isEmpty()) {
            Map<UUID, String> statusMap = submissionRepository
                    .findByStudentAndExerciseIn(user, exercises)
                    .stream()
                    .collect(Collectors.toMap(
                            s -> s.getExercise().getId(),
                            s -> s.getStatus().name()
                    ));
            return exercises.stream()
                    .map(e -> toResponse(e, user, statusMap.get(e.getId())))
                    .collect(Collectors.toList());
        }

        return exercises.stream()
                .map(e -> toResponse(e, user, null))
                .collect(Collectors.toList());
    }

    @Transactional
    public ExerciseResponse createExercise(UUID courseId, ExerciseRequest request, User teacher) {
        Course course = courseService.findById(courseId);
        assertTeacherOwner(course, teacher);

        Exercise exercise = Exercise.builder()
                .course(course)
                .title(request.getTitle())
                .description(request.getDescription())
                .type(request.getType())
                .correctAnswer(request.getCorrectAnswer())
                .maxScore(request.getMaxScore() != null ? request.getMaxScore() : 100)
                .dueDate(request.getDueDate())
                .isPublished(request.getIsPublished() != null ? request.getIsPublished() : false)
                .attachmentUrl(request.getAttachmentUrl())
                .build();

        exercise = exerciseRepository.save(exercise);

        if (Boolean.TRUE.equals(request.getIsPublished())) {
            notifyEnrolledStudents(exercise);
        }

        return toResponse(exercise, teacher, null);
    }

    public ExerciseResponse getExerciseById(UUID id, User user) {
        Exercise exercise = findById(id);
        return toResponse(exercise, user, null);
    }

    @Transactional
    public ExerciseResponse updateExercise(UUID id, ExerciseRequest request, User requester) {
        Exercise exercise = findById(id);
        assertTeacherOwner(exercise.getCourse(), requester);

        boolean wasPublished = exercise.isPublished();

        if (request.getTitle() != null) exercise.setTitle(request.getTitle());
        if (request.getDescription() != null) exercise.setDescription(request.getDescription());
        if (request.getType() != null) exercise.setType(request.getType());
        if (request.getCorrectAnswer() != null) exercise.setCorrectAnswer(request.getCorrectAnswer());
        if (request.getMaxScore() != null) exercise.setMaxScore(request.getMaxScore());
        if (request.getDueDate() != null) exercise.setDueDate(request.getDueDate());
        if (request.getIsPublished() != null) exercise.setPublished(request.getIsPublished());
        if (request.getAttachmentUrl() != null) exercise.setAttachmentUrl(request.getAttachmentUrl());

        exercise = exerciseRepository.save(exercise);

        // Notify students only when transitioning from draft → published
        if (!wasPublished && exercise.isPublished()) {
            notifyEnrolledStudents(exercise);
        }

        return toResponse(exercise, requester, null);
    }

    @Transactional
    public void deleteExercise(UUID id, User requester) {
        Exercise exercise = findById(id);
        assertTeacherOwner(exercise.getCourse(), requester);
        exerciseRepository.delete(exercise);
    }

    public List<ExerciseResponse> getPendingExercisesForStudent(User student) {
        List<Course> enrolledCourses = enrollmentRepository.findByStudent(student)
                .stream().map(e -> e.getCourse()).toList();

        if (enrolledCourses.isEmpty()) return List.of();

        List<Exercise> published = exerciseRepository.findByCourseInAndIsPublished(enrolledCourses, true);

        if (published.isEmpty()) return List.of();

        Set<UUID> submittedIds = submissionRepository.findByStudentAndExerciseIn(student, published)
                .stream().map(s -> s.getExercise().getId()).collect(Collectors.toSet());

        return published.stream()
                .filter(e -> !submittedIds.contains(e.getId()))
                .filter(e -> e.getDueDate() == null || e.getDueDate().isAfter(Instant.now()))
                .map(e -> toResponse(e, student, null))
                .toList();
    }

    public Exercise findById(UUID id) {
        return exerciseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Exercise not found with id: " + id));
    }

    private void notifyEnrolledStudents(Exercise exercise) {
        String message = String.format("Nuevo ejercicio en \"%s\": %s",
                exercise.getCourse().getTitle(), exercise.getTitle());
        enrollmentRepository.findByCourse(exercise.getCourse()).forEach(enrollment ->
                notificationService.sendNotification(
                        enrollment.getStudent(),
                        "NEW_EXERCISE",
                        message,
                        exercise.getId()
                )
        );
    }

    private void assertTeacherOwner(Course course, User requester) {
        if (requester.getRole() != UserRole.ADMIN &&
            !course.getTeacher().getId().equals(requester.getId())) {
            throw new AccessDeniedException("You are not the owner of this course");
        }
    }

    private ExerciseResponse toResponse(Exercise exercise, User viewer, String mySubmissionStatus) {
        // Hide correct answer from students
        String correctAnswer = null;
        if (viewer.getRole() != UserRole.STUDENT) {
            correctAnswer = exercise.getCorrectAnswer();
        }

        return ExerciseResponse.builder()
                .id(exercise.getId())
                .courseId(exercise.getCourse().getId())
                .courseTitle(exercise.getCourse().getTitle())
                .title(exercise.getTitle())
                .description(exercise.getDescription())
                .type(exercise.getType())
                .correctAnswer(correctAnswer)
                .maxScore(exercise.getMaxScore())
                .dueDate(exercise.getDueDate())
                .isPublished(exercise.isPublished())
                .attachmentUrl(exercise.getAttachmentUrl())
                .createdAt(exercise.getCreatedAt())
                .mySubmissionStatus(mySubmissionStatus)
                .build();
    }
}
