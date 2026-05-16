package com.edu.platform.submission.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GradeRequest {

    @NotNull(message = "Score is required")
    @Min(value = 0, message = "Score must be >= 0")
    @Max(value = 1000, message = "Score must be <= 1000")
    private Integer score;

    private String feedback;
}
