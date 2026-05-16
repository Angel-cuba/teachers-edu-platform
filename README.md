# 🏫 Teachers Edu Platform

A real-time full-stack educational platform where teachers create courses and exercises, and students solve them and receive instant feedback via WebSockets.

## Architecture

```
teachers-edu-platform/
├── backend/          ← Spring Boot REST API + WebSocket (port 8080)
├── frontend-web/     ← React + Vite web app (port 5173)
└── mobile/           ← React Native + Expo mobile app (iOS & Android)
```

## Tech Stack

| Layer | Stack |
|---|---|
| **Backend** | Java 17, Spring Boot 3.3.5, PostgreSQL 14, Spring Security + JWT, WebSocket/STOMP |
| **Web** | React 18, TypeScript, Vite, TailwindCSS, TanStack Query v5, Framer Motion |
| **Mobile** | React Native 0.81, Expo 54, Expo Router v4, NativeWind v4, TanStack Query v5 |

## Features

- 🔐 **Auth** — JWT (15 min access / 7 day refresh), role-based (TEACHER / STUDENT / ADMIN)
- 📚 **Courses** — Create, edit, delete; student enrollment via code
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

| Variable | Where | Description |
|---|---|---|
| `SPRING_DATASOURCE_PASSWORD` | backend `.env` | PostgreSQL password |
| `JWT_SECRET` | backend `.env` | 32+ char secret key for JWT signing |
| `VITE_API_URL` | frontend-web `.env.local` | Backend API base URL |
| `EXPO_PUBLIC_API_URL` | mobile `.env` | Backend API base URL for Expo |

## Sub-project READMEs

- [Backend →](./backend/README.md)
- [Frontend Web →](./frontend-web/README.md)
- [Mobile →](./mobile/README.md)

## License

MIT
