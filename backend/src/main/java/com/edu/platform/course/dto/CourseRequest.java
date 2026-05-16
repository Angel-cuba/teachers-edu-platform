package com.edu.platform.course.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CourseRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private Boolean isActive;
}
