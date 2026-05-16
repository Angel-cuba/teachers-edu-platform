package com.edu.platform.submission;

import com.edu.platform.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "grades")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id")
public class Grade {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false, unique = true)
    private Submission submission;

    private int score;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "graded_by_id", nullable = false)
    private User gradedBy;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant gradedAt = Instant.now();
}
