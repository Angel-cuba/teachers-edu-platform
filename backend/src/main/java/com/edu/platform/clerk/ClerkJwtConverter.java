package com.edu.platform.clerk;

import com.edu.platform.user.User;
import com.edu.platform.user.UserRepository;
import com.edu.platform.user.UserRole;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Converts a Clerk-issued JWT into a Spring Security authentication token.
 *
 * On each authenticated request:
 * 1. Extracts the Clerk user ID from the JWT subject.
 * 2. Looks up (or lazily provisions) a local User row keyed by clerkId.
 * 3. Returns a UsernamePasswordAuthenticationToken backed by the User entity.
 *
 * Role is sourced from the JWT claim "role" (set via Clerk session claims template).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ClerkJwtConverter implements Converter<Jwt, UsernamePasswordAuthenticationToken> {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public UsernamePasswordAuthenticationToken convert(Jwt jwt) {
        String clerkId = jwt.getSubject();
        User user = userRepository.findByClerkId(clerkId)
                .orElseGet(() -> provisionUser(jwt, clerkId));
        return new UsernamePasswordAuthenticationToken(user, jwt, user.getAuthorities());
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
