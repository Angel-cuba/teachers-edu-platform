package com.edu.platform.exercise.dto;

import com.edu.platform.exercise.ExerciseType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;

@Data
public class ExerciseRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Exercise type is required")
    private ExerciseType type;

    private String correctAnswer;

    private Integer maxScore;

    private Instant dueDate;

    private Boolean isPublished;

    private String attachmentUrl;
}
