package com.edu.platform.notification;

import com.edu.platform.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    List<Notification> findTop50ByUserOrderByCreatedAtDesc(User user);

    List<Notification> findByUserAndIsRead(User user, boolean isRead);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user = :user AND n.isRead = false")
    int markAllAsReadByUser(User user);
}
