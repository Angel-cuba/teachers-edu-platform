# Backend — Spring Boot API

REST API + WebSocket server for the EduPlatform.

## Stack

- **Java 17** + **Spring Boot 3.3.5**
- **Spring Security OAuth2 Resource Server** — validates Clerk RS256 JWTs via JWKS
- **Clerk** — identity provider (sign-in, sign-up, session management, webhooks)
- **Spring Data JPA** + **PostgreSQL 14**
- **WebSocket / STOMP** with SockJS fallback
- **Maven Wrapper** (no local Maven install required)

## Prerequisites

- JDK 17 (`java -version` → 17.x)
- PostgreSQL 14+ running on port **5433**
- [Clerk account](https://clerk.com) (free tier)

## Setup

### 1. Create the database
```sql
CREATE DATABASE eduplatform;
```
Tables are created automatically on first run (`ddl-auto: update`).

### 2. Environment variables

```bash
cp .env.example .env   # then fill in your values
```

| Variable | Description |
|---|---|
| `SPRING_DATASOURCE_PASSWORD` | PostgreSQL password |
| `CLERK_JWKS_URI` | Clerk Dashboard → API Keys → JWKS URI |
| `CLERK_ISSUER_URI` | Exact `iss` value from a decoded Clerk session token |
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks → Signing Secret (`whsec_...`) |
| `APP_PUBLIC_BASE_URL` | Public base URL for avatar links (e.g. `http://localhost:8080`) |

### 3. Clerk setup (required)
1. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Copy **JWKS URI** → `CLERK_JWKS_URI` (format: `https://xxx.clerk.accounts.dev/.well-known/jwks.json`)
3. Decode a session token at [jwt.io](https://jwt.io) → copy the `iss` field → `CLERK_ISSUER_URI`
4. Create a **Webhook** endpoint pointing to `POST /api/clerk/webhooks` → copy the signing secret

### 4. Run
```bash
./mvnw spring-boot:run
```
Server starts on `http://localhost:8080`.

## API Overview

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/clerk/webhooks` | Public (Svix sig) | Clerk webhook receiver |
| GET | `/api/users/me` | Bearer JWT | Current user profile |
| PATCH | `/api/users/me` | Bearer JWT | Update display name / avatar |
| GET | `/api/courses/my` | TEACHER | Teacher's courses |
| GET | `/api/courses/enrolled` | STUDENT | Enrolled courses |
| POST | `/api/courses` | TEACHER | Create course |
| POST | `/api/courses/enroll` | STUDENT | Enroll via code |
| GET | `/api/exercises/pending` | STUDENT | Unsubmitted non-expired exercises |
| POST | `/api/exercises/{id}/submit` | STUDENT | Submit answer (blocked after due date) |
| GET | `/api/submissions/pending` | TEACHER | Grading queue |
| POST | `/api/submissions/{id}/grade` | TEACHER | Grade a submission |
| GET | `/api/notifications` | Bearer JWT | User notifications |

## WebSocket

- **Endpoint:** `ws://localhost:8080/ws` (SockJS fallback)
- **Auth:** Clerk JWT in `Authorization: Bearer <token>` STOMP connect header
- **Subscription:** `/topic/user/{userId}/notifications`
- **Events:** `GRADE_PUBLISHED` · `NEW_EXERCISE` · `SUBMISSION_RECEIVED`

## Auth Flow

```
Client → sends Clerk JWT in Authorization header
       → Spring OAuth2 Resource Server validates via JWKS
       → ClerkJwtConverter looks up (or lazily provisions) User in DB
       → UsernamePasswordAuthenticationToken injected into SecurityContext
```

Clerk webhooks (`user.created`, `user.updated`) keep the local `users` table in sync.
Svix HMAC-SHA256 signature + timestamp replay protection on every webhook call.

## Key Design Notes

- **No password storage** — `passwordHash` column is nullable; Clerk owns credentials
- **Due date enforcement** — `SubmissionService` rejects submissions server-side after `dueDate`
- **Lombok + Jackson** — use `Boolean` (wrapper) not `boolean` for `isXxx` fields to prevent `isActive` → `active` serialization issue
