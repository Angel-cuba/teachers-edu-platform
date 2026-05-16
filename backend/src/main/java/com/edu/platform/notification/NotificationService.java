package com.edu.platform.notification;

import com.edu.platform.notification.dto.NotificationResponse;
import com.edu.platform.submission.Grade;
import com.edu.platform.submission.Submission;
import com.edu.platform.user.User;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public NotificationResponse sendNotification(User user, String type, String message, UUID relatedEntityId) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .message(message)
                .relatedEntityId(relatedEntityId)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        NotificationResponse response = toResponse(notification);

        // Push via WebSocket
        try {
            messagingTemplate.convertAndSend(
                    "/topic/user/" + user.getId() + "/notifications",
                    response
            );
        } catch (Exception e) {
            log.warn("Failed to send WebSocket notification to user {}: {}", user.getId(), e.getMessage());
        }

        return response;
    }

    public List<NotificationResponse> getNotificationsForUser(User user) {
        return notificationRepository
                .findTop50ByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, User user) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Not your notification");
        }

        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadByUser(user);
    }

    @Transactional
    public void sendGradeNotification(User student, Submission submission, Grade grade) {
        String message = String.format("Tu ejercicio \"%s\" fue calificado: %d puntos",
                submission.getExercise().getTitle(), grade.getScore());
        sendNotification(student, "GRADE_PUBLISHED", message, submission.getId());
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUser().getId())
                .type(notification.getType())
                .message(notification.getMessage())
                .relatedEntityId(notification.getRelatedEntityId())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
