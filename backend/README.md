# Backend — Spring Boot API

REST API + WebSocket server for the Teachers Edu Platform.

## Stack

- **Java 17** + **Spring Boot 3.3.5**
- **Spring Security** + JWT (access 15 min / refresh 7 days)
- **Spring Data JPA** + **PostgreSQL 14**
- **WebSocket / STOMP** with SockJS fallback
- **Maven Wrapper** (no local Maven install required)

## Prerequisites

- JDK 17 (`java -version` should show 17.x)
- PostgreSQL 14+ running on port **5433**

## Setup

### 1. Create the database
```sql
CREATE DATABASE eduplatform;
```
The app auto-creates tables on first run via `DatabaseAutoCreator` + Hibernate `ddl-auto: update`.

### 2. Environment variables

Create a `.env` file (or set them in your shell):

```env
SPRING_DATASOURCE_PASSWORD=your_postgres_password
JWT_SECRET=your-256-bit-secret-key-here-at-least-32-characters
```

### 3. Run
```bash
./mvnw spring-boot:run
```
Server starts on `http://localhost:8080`.

## API Overview

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login → returns JWT pair |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/courses/my` | Teacher's courses |
| GET | `/api/courses/enrolled` | Student's enrolled courses |
| POST | `/api/courses` | Create course (TEACHER) |
| POST | `/api/courses/enroll` | Enroll via code (STUDENT) |
| GET | `/api/exercises/pending` | Unsubmitted, non-expired exercises (STUDENT) |
| POST | `/api/exercises/{id}/submit` | Submit answer (blocks if past due date) |
| GET | `/api/submissions/pending` | Pending grading queue (TEACHER) |
| POST | `/api/submissions/{id}/grade` | Grade a submission |
| GET | `/api/notifications` | User notifications |

## WebSocket

- **Endpoint:** `ws://localhost:8080/ws` (SockJS fallback)
- **Subscription:** `/topic/user/{userId}/notifications`
- **Events:** `GRADE_PUBLISHED` · `NEW_EXERCISE` · `SUBMISSION_RECEIVED`

## Key Design Decisions

- **No Redis** — refresh tokens stored in `ConcurrentHashMap` (in-memory). Swap for Redis in production.
- **Due date enforcement** — `SubmissionService` rejects submissions after `dueDate` at the server level. Frontend mirrors the state but server is the source of truth.
- **Lombok + Jackson** — Use `Boolean` (wrapper) instead of `boolean` for `isXxx` fields to avoid `isActive` → `active` serialization issue.
