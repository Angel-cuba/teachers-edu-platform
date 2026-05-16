package com.edu.platform.submission.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SubmissionRequest {

    @NotBlank(message = "Answer is required")
    private String answer;
}
