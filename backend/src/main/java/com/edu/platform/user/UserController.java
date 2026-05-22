package com.edu.platform.user;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Value("${app.uploads.dir}")
    private String uploadsDir;

    @Value("${server.port:8080}")
    private String serverPort;

    // ── GET /api/users/me ──────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(toMap(user));
    }

    // ── PATCH /api/users/me ────────────────────────────────────────────────
    @PatchMapping("/me")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, String> body) {

        User user = userService.findById(currentUser.getId());

        String displayName = body.get("displayName");
        if (displayName != null && !displayName.isBlank()) {
            user.setDisplayName(displayName.trim());
        }

        String avatarUrl = body.get("avatarUrl");
        if (avatarUrl != null) {
            user.setAvatarUrl(avatarUrl.isBlank() ? null : avatarUrl);
        }

        String roleStr = body.get("role");
        if (roleStr != null && !roleStr.isBlank()) {
            try {
                user.setRole(UserRole.valueOf(roleStr.toUpperCase().trim()));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid role: " + roleStr));
            }
        }

        user = userService.save(user);
        return ResponseEntity.ok(toMap(user));
    }

    // ── POST /api/users/me/avatar ──────────────────────────────────────────
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAvatar(
            @AuthenticationPrincipal User currentUser,
            @RequestParam("file") MultipartFile file) throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El archivo está vacío"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("message", "Solo se permiten imágenes"));
        }

        // Determine file extension
        String original = file.getOriginalFilename();
        String ext = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.'))
                : ".jpg";

        // Save to uploads dir
        Path dir = Paths.get(uploadsDir);
        Files.createDirectories(dir);

        String filename = currentUser.getId().toString() + ext;
        Path dest = dir.resolve(filename);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        // Build public URL
        String avatarUrl = "http://localhost:" + serverPort + "/api/users/avatars/" + filename;

        // Persist on user
        User user = userService.findById(currentUser.getId());
        user.setAvatarUrl(avatarUrl);
        userService.save(user);

        return ResponseEntity.ok(Map.of("avatarUrl", avatarUrl));
    }

    // ── GET /api/users/avatars/{filename} ──────────────────────────────────
    @GetMapping("/avatars/{filename}")
    public ResponseEntity<Resource> serveAvatar(@PathVariable String filename) throws IOException {
        Path file = Paths.get(uploadsDir).resolve(filename).normalize();
        Resource resource = new UrlResource(file.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = Files.probeContentType(file);
        if (contentType == null) contentType = "application/octet-stream";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    // ── GET /api/users/{id} ───────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable UUID id) {
        User user = userService.findById(id);
        return ResponseEntity.ok(toMap(user));
    }

    // ─────────────────────────────────────────────────────────────────────
    private Map<String, Object> toMap(User user) {
        return Map.of(
                "id",          user.getId().toString(),
                "email",       user.getEmail(),
                "displayName", user.getDisplayName(),
                "role",        user.getRole(),
                "avatarUrl",   user.getAvatarUrl() != null ? user.getAvatarUrl() : "",
                "createdAt",   user.getCreatedAt().toString()
        );
    }
}
