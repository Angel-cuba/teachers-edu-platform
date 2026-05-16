package com.edu.platform.notification.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {

    private UUID id;
    private UUID userId;
    private String type;
    private String message;
    private UUID relatedEntityId;

    private Boolean isRead;

    private Instant createdAt;
}
