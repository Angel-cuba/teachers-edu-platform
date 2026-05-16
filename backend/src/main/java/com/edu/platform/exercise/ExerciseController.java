package com.edu.platform.exercise;

import com.edu.platform.exercise.dto.ExerciseRequest;
import com.edu.platform.exercise.dto.ExerciseResponse;
import com.edu.platform.user.User;
import com.edu.platform.user.UserRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ExerciseController {

    private final ExerciseService exerciseService;

    @GetMapping("/api/courses/{courseId}/exercises")
    public ResponseEntity<List<ExerciseResponse>> getExercises(
            @PathVariable UUID courseId,
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(exerciseService.getExercisesForCourse(courseId, user));
    }

    @PostMapping("/api/courses/{courseId}/exercises")
    public ResponseEntity<ExerciseResponse> createExercise(
            @PathVariable UUID courseId,
            @Valid @RequestBody ExerciseRequest request,
            @AuthenticationPrincipal User user) {

        if (user.getRole() != UserRole.TEACHER && user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only teachers can create exercises");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(exerciseService.createExercise(courseId, request, user));
    }

    @GetMapping("/api/exercises/{id}")
    public ResponseEntity<ExerciseResponse> getExercise(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(exerciseService.getExerciseById(id, user));
    }

    @PutMapping("/api/exercises/{id}")
    public ResponseEntity<ExerciseResponse> updateExercise(
            @PathVariable UUID id,
            @Valid @RequestBody ExerciseRequest request,
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(exerciseService.updateExercise(id, request, user));
    }

    @DeleteMapping("/api/exercises/{id}")
    public ResponseEntity<Void> deleteExercise(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {

        exerciseService.deleteExercise(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/exercises/pending")
    public ResponseEntity<List<ExerciseResponse>> getPendingExercises(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(exerciseService.getPendingExercisesForStudent(user));
    }
}
