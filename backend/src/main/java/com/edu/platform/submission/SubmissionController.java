package com.edu.platform.submission;

import com.edu.platform.submission.dto.GradeRequest;
import com.edu.platform.submission.dto.GradeResponse;
import com.edu.platform.submission.dto.SubmissionRequest;
import com.edu.platform.submission.dto.SubmissionResponse;
import com.edu.platform.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @GetMapping("/submissions/my")
    public ResponseEntity<List<SubmissionResponse>> getMySubmissions(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(submissionService.getMySubmissions(user));
    }

    @PostMapping("/exercises/{exerciseId}/submit")
    public ResponseEntity<SubmissionResponse> submit(
            @PathVariable UUID exerciseId,
            @Valid @RequestBody SubmissionRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(submissionService.submitAnswer(exerciseId, request, user));
    }

    @GetMapping("/exercises/{exerciseId}/submissions")
    public ResponseEntity<List<SubmissionResponse>> getSubmissions(
            @PathVariable UUID exerciseId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(submissionService.getSubmissions(exerciseId, user));
    }

    @GetMapping("/submissions/pending")
    public ResponseEntity<List<SubmissionResponse>> getPendingSubmissions(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(submissionService.getPendingSubmissions(user));
    }

    @GetMapping("/submissions/{id}")
    public ResponseEntity<SubmissionResponse> getSubmission(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(submissionService.getSubmission(id, user));
    }

    @PostMapping("/submissions/{id}/grade")
    public ResponseEntity<GradeResponse> grade(
            @PathVariable UUID id,
            @Valid @RequestBody GradeRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(submissionService.gradeSubmission(id, request, user));
    }
}
