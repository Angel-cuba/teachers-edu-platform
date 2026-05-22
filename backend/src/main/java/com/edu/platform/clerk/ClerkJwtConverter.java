package com.edu.platform.clerk;

import com.edu.platform.user.User;
import com.edu.platform.user.UserRepository;
import com.edu.platform.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Converts a Clerk-issued JWT into a Spring Security authentication token.
 *
 * On each authenticated request:
 * 1. Extracts the Clerk user ID from the JWT subject.
 * 2. Looks up (or lazily provisions) a local User row keyed by clerkId.
 * 3. Returns an AbstractAuthenticationToken backed by the User entity.
 *
 * Role is sourced from the JWT claim "role" (set via Clerk session claims template).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ClerkJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UserRepository userRepository;

    @Override
    // No @Transactional here — each repository call manages its own transaction.
    // With an outer transaction, DataIntegrityViolationException is thrown at commit time
    // (after tryProvisionUser returns), so the catch block never fires. Without it,
    // save() commits immediately and the exception is thrown synchronously inside the catch.
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String clerkId = jwt.getSubject();
        User user = userRepository.findByClerkId(clerkId)
                .orElseGet(() -> tryProvisionUser(jwt, clerkId));
        return new UsernamePasswordAuthenticationToken(user, jwt, user.getAuthorities());
    }

    /**
     * Attempts to insert a new User row for a first-time Clerk login.
     * Handles the race condition where two concurrent requests both try to
     * provision the same user: the loser of the DB unique constraint re-fetches.
     */
    private User tryProvisionUser(Jwt jwt, String clerkId) {
        try {
            return provisionUser(jwt, clerkId);
        } catch (DataIntegrityViolationException e) {
            log.debug("Race condition on user provision for clerkId={} — re-fetching", clerkId);
            return userRepository.findByClerkId(clerkId)
                    .orElseThrow(() -> new IllegalStateException(
                            "Could not provision or find user for clerkId=" + clerkId, e));
        }
    }

    private User provisionUser(Jwt jwt, String clerkId) {
        log.info("Provisioning new user for clerkId={}", clerkId);

        String email       = jwt.getClaimAsString("email");
        String displayName = jwt.getClaimAsString("displayName");
        String roleStr     = jwt.getClaimAsString("role");

        UserRole role = UserRole.STUDENT;
        if (roleStr != null) {
            try {
                role = UserRole.valueOf(roleStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Unknown role '{}' in JWT for clerkId={}. Defaulting to STUDENT.", roleStr, clerkId);
            }
        }

        User user = User.builder()
                .clerkId(clerkId)
                .email(email != null ? email : clerkId + "@provisional.clerk")
                .displayName(displayName != null ? displayName : "User")
                .role(role)
                .build();

        return userRepository.save(user);
    }
}
