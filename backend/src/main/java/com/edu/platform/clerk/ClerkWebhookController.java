package com.edu.platform.clerk;

import com.edu.platform.user.User;
import com.edu.platform.user.UserRepository;
import com.edu.platform.user.UserRole;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * Receives Clerk webhook events (user.created, user.updated) and keeps the
 * local users table in sync.
 *
 * Signature verification uses the Svix HMAC-SHA256 scheme:
 *   signed_content = svix-id + "." + svix-timestamp + "." + raw-body
 *   expected_sig   = HMAC-SHA256(base64decode(secret_without_whsec_prefix), signed_content)
 */
@RestController
@RequestMapping("/api/clerk/webhooks")
@RequiredArgsConstructor
@Slf4j
public class ClerkWebhookController {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Value("${clerk.webhook-secret:}")
    private String webhookSecret;

    @PostMapping
    public ResponseEntity<Void> handleWebhook(
            HttpServletRequest request,
            @RequestBody String body) {

        String svixId        = request.getHeader("svix-id");
        String svixTimestamp = request.getHeader("svix-timestamp");
        String svixSignature = request.getHeader("svix-signature");

        if (!webhookSecret.isBlank() && !verifySignature(svixId, svixTimestamp, svixSignature, body)) {
            log.warn("Clerk webhook signature verification failed");
            return ResponseEntity.status(400).build();
        }

        try {
            JsonNode payload   = objectMapper.readTree(body);
            String   eventType = payload.path("type").asText();
            JsonNode data      = payload.path("data");

            switch (eventType) {
                case "user.created" -> handleUserCreated(data);
                case "user.updated" -> handleUserUpdated(data);
                default             -> log.debug("Unhandled Clerk event: {}", eventType);
            }
        } catch (Exception ex) {
            log.error("Error processing Clerk webhook: {}", ex.getMessage(), ex);
            return ResponseEntity.status(500).build();
        }

        return ResponseEntity.ok().build();
    }

    // ─────────────────────────────────────────────────────────────────────────

    private void handleUserCreated(JsonNode data) {
        String clerkId     = data.path("id").asText();
        String email       = primaryEmail(data);
        String displayName = buildDisplayName(data);
        String roleStr     = data.path("public_metadata").path("role").asText(null);
        UserRole role = parseRole(roleStr);

        if (userRepository.findByClerkId(clerkId).isPresent()) {
            log.debug("user.created — clerkId={} already provisioned, skipping", clerkId);
            return;
        }

        User user = User.builder()
                .clerkId(clerkId)
                .email(email != null ? email : clerkId + "@provisional.clerk")
                .displayName(displayName)
                .role(role)
                .build();

        userRepository.save(user);
        log.info("Created user from webhook: clerkId={} email={}", clerkId, email);
    }

    private void handleUserUpdated(JsonNode data) {
        String clerkId = data.path("id").asText();

        userRepository.findByClerkId(clerkId).ifPresentOrElse(user -> {
            String email = primaryEmail(data);
            if (email != null) user.setEmail(email);

            String displayName = buildDisplayName(data);
            if (!displayName.isBlank()) user.setDisplayName(displayName);

            String roleStr = data.path("public_metadata").path("role").asText(null);
            if (roleStr != null) user.setRole(parseRole(roleStr));

            userRepository.save(user);
            log.info("Updated user from webhook: clerkId={}", clerkId);
        }, () -> log.debug("user.updated — clerkId={} not found locally, will be provisioned on next request", clerkId));
    }

    // ─────────────────────────────────────────────────────────────────────────

    private String primaryEmail(JsonNode data) {
        JsonNode emails = data.path("email_addresses");
        if (emails.isArray()) {
            for (JsonNode e : emails) {
                if ("primary".equals(e.path("linked_to").path("type").asText()) ||
                        e.path("id").asText().equals(data.path("primary_email_address_id").asText())) {
                    return e.path("email_address").asText(null);
                }
            }
            if (!emails.isEmpty()) {
                return emails.get(0).path("email_address").asText(null);
            }
        }
        return null;
    }

    private String buildDisplayName(JsonNode data) {
        String first = data.path("first_name").asText("");
        String last  = data.path("last_name").asText("");
        String full  = (first + " " + last).trim();
        return full.isBlank() ? "User" : full;
    }

    private UserRole parseRole(String roleStr) {
        if (roleStr == null) return UserRole.STUDENT;
        try {
            return UserRole.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown role '{}' in webhook. Defaulting to STUDENT.", roleStr);
            return UserRole.STUDENT;
        }
    }

    /**
     * Verifies Svix HMAC-SHA256 webhook signature.
     * Secret format: "whsec_BASE64SECRET"
     */
    private boolean verifySignature(String svixId, String svixTimestamp, String svixSignature, String body) {
        try {
            // Remove "whsec_" prefix and decode
            String secretBase64 = webhookSecret.startsWith("whsec_")
                    ? webhookSecret.substring(6) : webhookSecret;
            byte[] secretBytes = Base64.getDecoder().decode(secretBase64);

            String signedContent = svixId + "." + svixTimestamp + "." + body;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
            byte[] computedHash = mac.doFinal(signedContent.getBytes(StandardCharsets.UTF_8));
            String computedBase64 = Base64.getEncoder().encodeToString(computedHash);

            // svix-signature may have multiple "v1,HASH" segments separated by spaces
            for (String segment : svixSignature.split(" ")) {
                if (segment.startsWith("v1,")) {
                    String receivedHash = segment.substring(3);
                    if (computedBase64.equals(receivedHash)) {
                        return true;
                    }
                }
            }
            return false;
        } catch (Exception ex) {
            log.error("Signature verification error: {}", ex.getMessage());
            return false;
        }
    }
}
