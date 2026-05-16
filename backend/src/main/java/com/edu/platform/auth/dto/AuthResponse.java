package com.edu.platform.auth.dto;

import com.edu.platform.user.UserRole;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private UserInfo user;

    @Data
    @Builder
    public static class UserInfo {
        private String id;
        private String email;
        private String displayName;
        private UserRole role;
        private String avatarUrl;
    }
}
