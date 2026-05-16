package com.edu.platform.course;

import com.edu.platform.course.dto.CourseRequest;
import com.edu.platform.course.dto.CourseResponse;
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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<List<CourseResponse>> getCourses(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courseService.getCoursesForUser(user));
    }

    @GetMapping("/enrolled")
    public ResponseEntity<List<CourseResponse>> getEnrolledCourses(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courseService.getCoursesForUser(user));
    }

    @GetMapping("/my")
    public ResponseEntity<List<CourseResponse>> getMyCourses(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(courseService.getCoursesForUser(user));
    }

    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(
            @Valid @RequestBody CourseRequest request,
            @AuthenticationPrincipal User user) {

        if (user.getRole() != UserRole.TEACHER && user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Only teachers can create courses");
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(courseService.createCourse(request, user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getCourse(@PathVariable UUID id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseResponse> updateCourse(
            @PathVariable UUID id,
            @Valid @RequestBody CourseRequest request,
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(courseService.updateCourse(id, request, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {

        courseService.deleteCourse(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/enroll")
    public ResponseEntity<CourseResponse> enroll(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {

        if (user.getRole() != UserRole.STUDENT) {
            throw new AccessDeniedException("Only students can enroll in courses");
        }
        String enrollCode = body.get("enrollCode");
        if (enrollCode == null || enrollCode.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(courseService.enrollStudent(enrollCode, user));
    }

    @GetMapping("/{id}/students")
    public ResponseEntity<List<Map<String, Object>>> getCourseStudents(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(courseService.getCourseStudents(id, user));
    }
}
