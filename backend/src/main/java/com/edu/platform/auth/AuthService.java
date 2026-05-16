package com.edu.platform.auth;

import com.edu.platform.auth.dto.*;
import com.edu.platform.user.User;
import com.edu.platform.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName())
                .role(request.getRole())
                .avatarUrl(request.getAvatarUrl())
                .build();

        user = userRepository.save(user);
        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        return buildAuthResponse(user);
    }

    public AuthResponse refresh(RefreshRequest request) {
        String refreshToken = request.getRefreshToken();

        if (refreshTokenService.isRevoked(refreshToken)) {
            throw new BadCredentialsException("Refresh token has been revoked");
        }

        if (!jwtService.isTokenValid(refreshToken)) {
            throw new BadCredentialsException("Invalid or expired refresh token");
        }

        String tokenType = jwtService.extractTokenType(refreshToken);
        if (!"refresh".equals(tokenType)) {
            throw new BadCredentialsException("Not a refresh token");
        }

        String email = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        // Revoke old refresh token
        refreshTokenService.revokeToken(refreshToken);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .user(buildUserInfo(user))
                .build();
    }

    public void logout(RefreshRequest request) {
        refreshTokenService.revokeToken(request.getRefreshToken());
    }

    private AuthResponse buildAuthResponse(User user) {
        return AuthResponse.builder()
                .accessToken(jwtService.generateAccessToken(user))
                .refreshToken(jwtService.generateRefreshToken(user))
                .tokenType("Bearer")
                .user(buildUserInfo(user))
                .build();
    }

    private AuthResponse.UserInfo buildUserInfo(User user) {
        return AuthResponse.UserInfo.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .role(user.getRole())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }
}
