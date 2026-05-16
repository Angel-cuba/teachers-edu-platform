package com.edu.platform.submission.dto;

import com.edu.platform.submission.SubmissionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class SubmissionResponse {

    private UUID id;
    private UUID exerciseId;
    private String exerciseTitle;
    private UUID studentId;
    private String studentName;
    private String answer;
    private SubmissionStatus status;
    private Instant submittedAt;
    private GradeResponse grade;
}
