package com.edu.platform.submission.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class GradeResponse {

    private UUID id;
    private UUID submissionId;
    private int score;
    private String feedback;
    private UUID gradedById;
    private String gradedByName;
    private Instant gradedAt;
}
