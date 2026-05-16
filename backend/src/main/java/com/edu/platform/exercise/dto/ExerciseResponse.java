package com.edu.platform.exercise.dto;

import com.edu.platform.exercise.ExerciseType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ExerciseResponse {

    private UUID id;
    private UUID courseId;
    private String courseTitle;
    private String title;
    private String description;
    private ExerciseType type;
    private String correctAnswer;
    private int maxScore;
    private Instant dueDate;

    private Boolean isPublished;

    private String attachmentUrl;
    private Instant createdAt;

    /** Populated only when the caller is a STUDENT — "PENDING", "GRADED", or null (not submitted). */
    private String mySubmissionStatus;
}
