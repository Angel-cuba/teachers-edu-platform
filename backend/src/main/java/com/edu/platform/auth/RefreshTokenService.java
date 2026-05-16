package com.edu.platform.auth;

import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RefreshTokenService {

    private final Set<String> revokedTokens = ConcurrentHashMap.newKeySet();

    public void revokeToken(String token) {
        revokedTokens.add(token);
    }

    public boolean isRevoked(String token) {
        return revokedTokens.contains(token);
    }
}
