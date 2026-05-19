# 🏫 EduPlatform

A real-time full-stack educational platform where teachers create courses and exercises, and students solve them and receive instant feedback via WebSockets.

## Architecture

```
edu-platform/
├── backend/          ← Spring Boot REST API + WebSocket (port 8080)
├── frontend-web/     ← React + Vite web app (port 5173)
└── mobile/           ← React Native + Expo mobile app (iOS & Android)
```

## Tech Stack

| Layer | Stack |
|---|---|
| **Backend** | Java 17, Spring Boot 3.3.5, PostgreSQL 14, Spring Security OAuth2 Resource Server, WebSocket/STOMP |
| **Auth** | Clerk (identity provider) — JWT RS256 validated via JWKS, webhook sync |
| **Web** | React 18, TypeScript, Vite, TailwindCSS, TanStack Query v5, Framer Motion, @clerk/clerk-react |
| **Mobile** | React Native 0.81, Expo 54, Expo Router v4, NativeWind v4, TanStack Query v5 |

## Features

- 🔐 **Auth** — Clerk-powered sign-in / sign-up; role-based access (TEACHER / STUDENT / ADMIN)
- 📚 **Courses** — Create, edit, delete; student enrollment via invite code
- 📝 **Exercises** — Multiple choice, open answer, code; due dates with automatic enforcement
- ✅ **Grading** — Score + feedback; real-time notification to student on grade publish
- 🔔 **Notifications** — Real-time via WebSocket/STOMP; persisted in DB
- 🌙 **Dark mode** — System, light, dark (web + mobile)
- 🌐 **i18n** — Spanish / English (no external dependencies)

## Quick Start

### Prerequisites
- Java 17+
- Node 18+
- PostgreSQL 14+ (running on port 5433)
- Expo Go app (iOS or Android) — for mobile
- [Clerk account](https://clerk.com) — free tier is enough

### 1. Backend
```bash
cd backend
cp .env.example .env          # fill in your values
./mvnw spring-boot:run
```

### 2. Web
```bash
cd frontend-web
cp .env.example .env.local    # fill in your values
npm install
npm run dev
```

### 3. Mobile
```bash
cd mobile
cp .env.example .env          # fill in your values
npm install
npx expo start --clear
# Press i → iOS simulator / a → Android emulator
```

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `SPRING_DATASOURCE_PASSWORD` | PostgreSQL password |
| `CLERK_JWKS_URI` | From Clerk Dashboard → API Keys → JWKS URI |
| `CLERK_ISSUER_URI` | Exact `iss` value in a decoded Clerk session token |
| `CLERK_WEBHOOK_SECRET` | From Clerk Dashboard → Webhooks → Signing Secret (`whsec_...`) |
| `APP_PUBLIC_BASE_URL` | Public base URL for avatar links (e.g. `http://localhost:8080`) |

### Web (`frontend-web/.env.local`)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:8080/api`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | From Clerk Dashboard → API Keys (`pk_test_...`) |

### Mobile (`mobile/.env`)
| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend API base URL for Expo |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Clerk Dashboard → API Keys (`pk_test_...`) |

## Clerk Setup (required)

1. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Copy the **Publishable Key** (`pk_test_...`) → use in web + mobile
3. Copy the **JWKS URI** and **Issuer URI** → use in backend
4. Create a **Webhook** pointing to `POST /api/clerk/webhooks` → copy the signing secret
5. (Optional) Create a **Session JWT template** to embed `email`, `displayName`, `role` claims

## License

MIT
