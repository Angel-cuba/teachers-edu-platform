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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

/**
 * Receives Clerk webhook events (user.created, user.updated) and keeps the
 * local users table in sync.
 *
 * Signature verification follows the Svix HMAC-SHA256 scheme:
 *   signed_content = svix-id + "." + svix-timestamp + "." + raw-body
 *   expected_sig   = HMAC-SHA256(base64decode(secret_without_whsec_prefix), signed_content)
 *
 * Replay protection: timestamps older than 5 minutes are rejected.
 */
@RestController
@RequestMapping("/api/clerk/webhooks")
@RequiredArgsConstructor
@Slf4j
public class ClerkWebhookController {

    private static final long MAX_TIMESTAMP_AGE_SECONDS = 300;

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Value("${clerk.webhook-secret:}")
    private String webhookSecret;

    @PostMapping
    @Transactional
    public ResponseEntity<Void> handleWebhook(
            HttpServletRequest request,
            @RequestBody String body) {

        // Fail closed: if the secret is not configured, reject all calls.
        if (webhookSecret.isBlank()) {
            log.error("CLERK_WEBHOOK_SECRET is not configured — rejecting webhook call");
            return ResponseEntity.status(503).build();
        }

        String svixId        = request.getHeader("svix-id");
        String svixTimestamp = request.getHeader("svix-timestamp");
        String svixSignature = request.getHeader("svix-signature");

        if (!verifySignature(svixId, svixTimestamp, svixSignature, body)) {
            log.warn("Clerk webhook signature verification failed");
            return ResponseEntity.status(401).build();
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
        UserRole role      = parseRole(data.path("public_metadata").path("role").asText(null));

        User user = User.builder()
                .clerkId(clerkId)
                .email(email != null ? email : clerkId + "@provisional.clerk")
                .displayName(displayName)
                .role(role)
                .build();

        try {
            userRepository.save(user);
            log.info("Created user from webhook: clerkId={} email={}", clerkId, email);
        } catch (DataIntegrityViolationException e) {
            // Svix retry or race with ClerkJwtConverter — idempotent, return 200
            log.info("user.created — clerkId={} already exists (duplicate delivery or race)", clerkId);
        }
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

    /**
     * Extracts the primary email from a Clerk webhook payload.
     * Clerk marks the primary address via the top-level "primary_email_address_id" field.
     */
    private String primaryEmail(JsonNode data) {
        String primaryId = data.path("primary_email_address_id").asText(null);
        JsonNode emails  = data.path("email_addresses");

        if (emails.isArray() && primaryId != null) {
            for (JsonNode e : emails) {
                if (primaryId.equals(e.path("id").asText(null))) {
                    return e.path("email_address").asText(null);
                }
            }
        }
        // Fallback: use first available address if primary lookup fails
        if (emails.isArray() && !emails.isEmpty()) {
            return emails.get(0).path("email_address").asText(null);
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
     * Verifies Svix HMAC-SHA256 webhook signature with replay-attack protection.
     * Rejects messages whose timestamp is more than 5 minutes old.
     * Secret format: "whsec_BASE64SECRET"
     */
    private boolean verifySignature(String svixId, String svixTimestamp, String svixSignature, String body) {
        if (svixId == null || svixTimestamp == null || svixSignature == null) {
            log.warn("Missing Svix headers");
            return false;
        }
        try {
            // Replay protection: reject stale messages
            long ts = Long.parseLong(svixTimestamp);
            long nowSeconds = Instant.now().getEpochSecond();
            if (Math.abs(nowSeconds - ts) > MAX_TIMESTAMP_AGE_SECONDS) {
                log.warn("Svix timestamp rejected (age={}s, max={}s)", Math.abs(nowSeconds - ts), MAX_TIMESTAMP_AGE_SECONDS);
                return false;
            }

            // Decode secret (strip "whsec_" prefix)
            String secretBase64 = webhookSecret.startsWith("whsec_")
                    ? webhookSecret.substring(6) : webhookSecret;
            byte[] secretBytes = Base64.getDecoder().decode(secretBase64);

            String signedContent = svixId + "." + svixTimestamp + "." + body;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
            byte[] computedHash = mac.doFinal(signedContent.getBytes(StandardCharsets.UTF_8));
            String computedBase64 = Base64.getEncoder().encodeToString(computedHash);

            // svix-signature may contain multiple "v1,HASH" segments separated by spaces
            for (String segment : svixSignature.split(" ")) {
                if (segment.startsWith("v1,") && computedBase64.equals(segment.substring(3))) {
                    return true;
                }
            }
            return false;
        } catch (NumberFormatException e) {
            log.warn("Invalid svix-timestamp format: {}", svixTimestamp);
            return false;
        } catch (Exception ex) {
            log.error("Signature verification error: {}", ex.getMessage());
            return false;
        }
    }
}
