package com.edu.platform.notification;

import com.edu.platform.notification.dto.NotificationResponse;
import com.edu.platform.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.getNotificationsForUser(user));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markRead(
            @PathVariable UUID id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.markAsRead(id, user));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user);
        return ResponseEntity.noContent().build();
    }
}
