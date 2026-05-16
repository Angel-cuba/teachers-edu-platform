package com.edu.platform.dashboard;

import com.edu.platform.course.Course;
import com.edu.platform.course.CourseRepository;
import com.edu.platform.course.EnrollmentRepository;
import com.edu.platform.exercise.Exercise;
import com.edu.platform.exercise.ExerciseRepository;
import com.edu.platform.submission.SubmissionRepository;
import com.edu.platform.submission.SubmissionStatus;
import com.edu.platform.user.User;
import com.edu.platform.user.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ExerciseRepository exerciseRepository;
    private final SubmissionRepository submissionRepository;

    public Map<String, Object> getStats(User user) {
        if (user.getRole() == UserRole.TEACHER || user.getRole() == UserRole.ADMIN) {
            return getTeacherStats(user);
        }
        return getStudentStats(user);
    }

    private Map<String, Object> getTeacherStats(User teacher) {
        long totalCourses   = courseRepository.countByTeacher(teacher);
        long totalStudents  = enrollmentRepository.countUniqueStudentsByTeacher(teacher);
        long totalExercises = exerciseRepository.countByTeacher(teacher);
        long pendingGrades  = submissionRepository.countPendingByTeacher(teacher);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCourses",   totalCourses);
        stats.put("totalStudents",  totalStudents);
        stats.put("totalExercises", totalExercises);
        stats.put("pendingGrades",  pendingGrades);
        return stats;
    }

    private Map<String, Object> getStudentStats(User student) {
        long enrolledCourses = enrollmentRepository.countByStudent(student);

        List<Course> courses = enrollmentRepository.findByStudent(student)
                .stream().map(e -> e.getCourse()).toList();

        long pendingExercises = 0;
        if (!courses.isEmpty()) {
            List<Exercise> published = exerciseRepository.findByCourseInAndIsPublished(courses, true);
            if (!published.isEmpty()) {
                long submitted = submissionRepository.countByStudentAndExerciseIn(student, published);
                pendingExercises = Math.max(0, published.size() - submitted);
            }
        }

        long completedSubmissions = submissionRepository.countByStudentAndStatus(student, SubmissionStatus.GRADED);

        Map<String, Object> stats = new HashMap<>();
        stats.put("enrolledCourses",      enrolledCourses);
        stats.put("pendingExercises",     pendingExercises);
        stats.put("completedSubmissions", completedSubmissions);
        return stats;
    }
}
