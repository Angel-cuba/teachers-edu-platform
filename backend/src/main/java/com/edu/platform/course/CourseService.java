package com.edu.platform.course;

import com.edu.platform.course.dto.CourseRequest;
import com.edu.platform.course.dto.CourseResponse;
import com.edu.platform.user.User;
import com.edu.platform.user.UserRole;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    private static final String CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    public List<CourseResponse> getCoursesForUser(User user) {
        if (user.getRole() == UserRole.TEACHER || user.getRole() == UserRole.ADMIN) {
            return courseRepository.findByTeacher(user).stream()
                    .map(c -> toCourseResponse(c, enrollmentRepository.countByCourse(c)))
                    .collect(Collectors.toList());
        } else {
            return enrollmentRepository.findByStudent(user).stream()
                    .map(e -> toCourseResponse(e.getCourse(), enrollmentRepository.countByCourse(e.getCourse())))
                    .collect(Collectors.toList());
        }
    }

    @Transactional
    public CourseResponse createCourse(CourseRequest request, User teacher) {
        String enrollCode = generateUniqueEnrollCode();
        Course course = Course.builder()
                .teacher(teacher)
                .title(request.getTitle())
                .description(request.getDescription())
                .enrollCode(enrollCode)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
        course = courseRepository.save(course);
        return toCourseResponse(course, 0L);
    }

    public CourseResponse getCourseById(UUID id) {
        Course course = findById(id);
        long count = enrollmentRepository.countByCourse(course);
        return toCourseResponse(course, count);
    }

    @Transactional
    public CourseResponse updateCourse(UUID id, CourseRequest request, User requester) {
        Course course = findById(id);
        assertTeacherOwner(course, requester);

        if (request.getTitle() != null) course.setTitle(request.getTitle());
        if (request.getDescription() != null) course.setDescription(request.getDescription());
        if (request.getIsActive() != null) course.setActive(request.getIsActive());

        course = courseRepository.save(course);
        long count = enrollmentRepository.countByCourse(course);
        return toCourseResponse(course, count);
    }

    @Transactional
    public void deleteCourse(UUID id, User requester) {
        Course course = findById(id);
        assertTeacherOwner(course, requester);
        courseRepository.delete(course);
    }

    @Transactional
    public CourseResponse enrollStudent(String enrollCode, User student) {
        Course course = courseRepository.findByEnrollCode(enrollCode)
                .orElseThrow(() -> new EntityNotFoundException("Course not found with enroll code: " + enrollCode));

        if (!course.isActive()) {
            throw new IllegalStateException("Course is not active");
        }

        if (enrollmentRepository.existsByCourseAndStudent(course, student)) {
            throw new IllegalStateException("Already enrolled in this course");
        }

        Enrollment enrollment = Enrollment.builder()
                .course(course)
                .student(student)
                .build();
        enrollmentRepository.save(enrollment);

        long count = enrollmentRepository.countByCourse(course);
        return toCourseResponse(course, count);
    }

    public List<Map<String, Object>> getCourseStudents(UUID courseId, User requester) {
        Course course = findById(courseId);
        assertTeacherOwner(course, requester);

        return enrollmentRepository.findByCourse(course).stream()
                .map(e -> {
                    User s = e.getStudent();
                    return Map.<String, Object>of(
                            "id", s.getId(),
                            "email", s.getEmail(),
                            "displayName", s.getDisplayName(),
                            "avatarUrl", s.getAvatarUrl() != null ? s.getAvatarUrl() : "",
                            "enrolledAt", e.getEnrolledAt()
                    );
                })
                .collect(Collectors.toList());
    }

    public Course findById(UUID id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Course not found with id: " + id));
    }

    private void assertTeacherOwner(Course course, User requester) {
        if (requester.getRole() != UserRole.ADMIN &&
            !course.getTeacher().getId().equals(requester.getId())) {
            throw new AccessDeniedException("You are not the owner of this course");
        }
    }

    private String generateUniqueEnrollCode() {
        String code;
        do {
            code = generateCode();
        } while (courseRepository.existsByEnrollCode(code));
        return code;
    }

    private String generateCode() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }

    private CourseResponse toCourseResponse(Course course, long studentCount) {
        return CourseResponse.builder()
                .id(course.getId())
                .teacherId(course.getTeacher().getId())
                .teacherName(course.getTeacher().getDisplayName())
                .title(course.getTitle())
                .description(course.getDescription())
                .enrollCode(course.getEnrollCode())
                .isActive(course.isActive())
                .studentCount(studentCount)
                .createdAt(course.getCreatedAt())
                .build();
    }
}
