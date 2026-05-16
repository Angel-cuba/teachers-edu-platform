package com.edu.platform.course.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class CourseResponse {

    private UUID id;
    private UUID teacherId;
    private String teacherName;
    private String title;
    private String description;
    private String enrollCode;

    private Boolean isActive;

    private long studentCount;   // was enrollmentCount — renamed to match frontend type

    private Instant createdAt;
}
