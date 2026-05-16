package com.edu.platform.submission;

import com.edu.platform.common.exception.ResourceNotFoundException;
import com.edu.platform.course.EnrollmentRepository;
import com.edu.platform.exercise.Exercise;
import com.edu.platform.exercise.ExerciseRepository;
import com.edu.platform.notification.NotificationService;
import com.edu.platform.submission.dto.GradeRequest;
import com.edu.platform.submission.dto.GradeResponse;
import com.edu.platform.submission.dto.SubmissionRequest;
import com.edu.platform.submission.dto.SubmissionResponse;
import com.edu.platform.user.User;
import com.edu.platform.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final GradeRepository gradeRepository;
    private final ExerciseRepository exerciseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;

    @Transactional
    public SubmissionResponse submitAnswer(UUID exerciseId, SubmissionRequest request, User student) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found: " + exerciseId));

        if (!exercise.isPublished()) {
            throw new IllegalArgumentException("Exercise is not published yet");
        }

        if (exercise.getDueDate() != null && exercise.getDueDate().isBefore(Instant.now())) {
            throw new IllegalStateException("La fecha de entrega ha vencido");
        }

        boolean enrolled = enrollmentRepository.existsByCourseAndStudent(exercise.getCourse(), student);
        if (!enrolled) {
            throw new AccessDeniedException("You are not enrolled in this course");
        }

        if (submissionRepository.existsByExerciseAndStudent(exercise, student)) {
            throw new IllegalStateException("You have already submitted an answer for this exercise");
        }

        Submission submission = Submission.builder()
                .exercise(exercise)
                .student(student)
                .answer(request.getAnswer())
                .status(SubmissionStatus.PENDING)
                .build();

        return toResponse(submissionRepository.save(submission));
    }

    public List<SubmissionResponse> getSubmissions(UUID exerciseId, User currentUser) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("Exercise not found: " + exerciseId));

        if (currentUser.getRole() == UserRole.TEACHER || currentUser.getRole() == UserRole.ADMIN) {
            if (currentUser.getRole() == UserRole.TEACHER &&
                    !exercise.getCourse().getTeacher().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("You do not own this course");
            }
            return submissionRepository.findByExercise(exercise)
                    .stream().map(this::toResponse).toList();
        }

        return submissionRepository.findByExerciseAndStudent(exercise, currentUser)
                .stream().map(this::toResponse).toList();
    }

    public List<SubmissionResponse> getMySubmissions(User student) {
        return submissionRepository.findByStudentOrderBySubmittedAtDesc(student)
                .stream().map(this::toResponse).toList();
    }

    public List<SubmissionResponse> getPendingSubmissions(User teacher) {
        if (teacher.getRole() != UserRole.TEACHER && teacher.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only teachers can view pending submissions");
        }
        return submissionRepository.findPendingByTeacher(teacher)
                .stream().map(this::toResponse).toList();
    }

    public SubmissionResponse getSubmission(UUID id, User currentUser) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found: " + id));

        boolean isOwner = submission.getStudent().getId().equals(currentUser.getId());
        boolean isTeacher = currentUser.getRole() == UserRole.TEACHER &&
                submission.getExercise().getCourse().getTeacher().getId().equals(currentUser.getId());

        if (!isOwner && !isTeacher && currentUser.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Access denied");
        }

        return toResponse(submission);
    }

    @Transactional
    public GradeResponse gradeSubmission(UUID submissionId, GradeRequest request, User teacher) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found: " + submissionId));

        if (teacher.getRole() != UserRole.TEACHER && teacher.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only teachers can grade submissions");
        }

        if (teacher.getRole() == UserRole.TEACHER &&
                !submission.getExercise().getCourse().getTeacher().getId().equals(teacher.getId())) {
            throw new AccessDeniedException("You do not own this course");
        }

        if (submission.getStatus() == SubmissionStatus.GRADED) {
            gradeRepository.findBySubmission(submission).ifPresent(gradeRepository::delete);
        }

        Grade grade = Grade.builder()
                .submission(submission)
                .score(request.getScore())
                .feedback(request.getFeedback())
                .gradedBy(teacher)
                .build();

        grade = gradeRepository.save(grade);
        submission.setStatus(SubmissionStatus.GRADED);
        submissionRepository.save(submission);

        notificationService.sendGradeNotification(submission.getStudent(), submission, grade);

        return toGradeResponse(grade);
    }

    private SubmissionResponse toResponse(Submission s) {
        Optional<Grade> grade = gradeRepository.findBySubmission(s);
        return SubmissionResponse.builder()
                .id(s.getId())
                .exerciseId(s.getExercise().getId())
                .exerciseTitle(s.getExercise().getTitle())
                .studentId(s.getStudent().getId())
                .studentName(s.getStudent().getDisplayName())
                .answer(s.getAnswer())
                .status(s.getStatus())
                .submittedAt(s.getSubmittedAt())
                .grade(grade.map(this::toGradeResponse).orElse(null))
                .build();
    }

    private GradeResponse toGradeResponse(Grade g) {
        return GradeResponse.builder()
                .id(g.getId())
                .submissionId(g.getSubmission().getId())
                .score(g.getScore())
                .feedback(g.getFeedback())
                .gradedById(g.getGradedBy().getId())
                .gradedByName(g.getGradedBy().getDisplayName())
                .gradedAt(g.getGradedAt())
                .build();
    }
}
