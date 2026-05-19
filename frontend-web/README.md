# Frontend Web — React + Vite

Web application for the EduPlatform.

## Stack

- **React 18** + **TypeScript**
- **Vite** (dev server + build)
- **TailwindCSS** with `darkMode: 'class'`
- **@clerk/clerk-react** — authentication (sign-in, sign-up, session tokens)
- **TanStack Query v5** — server state, caching, real-time sync
- **React Router v6**
- **Framer Motion v12** — page and component animations
- **Axios** — API client with Clerk JWT interceptor
- **WebSocket / STOMP** (`@stomp/stompjs`) with fresh-token reconnect
- **lucide-react** icons · **react-hot-toast** notifications

## Prerequisites

- Node 18+
- Backend running on `http://localhost:8080`
- [Clerk account](https://clerk.com) — copy the Publishable Key

## Setup

```bash
cp .env.example .env.local   # fill in your values
npm install
npm run dev
```

Open `http://localhost:5173`.

## Environment Variables

```env
VITE_API_URL=http://localhost:8080/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (HMR) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |

## Pages

| Route | Role | Description |
|---|---|---|
| `/login` | Public | Sign in (Clerk — custom glass-card UI) |
| `/register` | Public | Sign up with email verification step |
| `/dashboard` | All | Stats overview |
| `/courses` | All | Course list |
| `/courses/:id` | All | Course detail + exercise list |
| `/courses/:id/exercises/new` | TEACHER | Create exercise |
| `/exercises/:id` | All | Exercise detail + submission form |
| `/exercises/:id/submissions` | TEACHER | Student answers |
| `/submissions/:id/grade` | TEACHER | Grade a submission |
| `/submissions/pending` | TEACHER | Grading queue |
| `/results` | STUDENT | My submissions + scores |
| `/notifications` | All | Notification center |
| `/profile` | All | Display name, theme, language; password via Clerk modal |

## Architecture Notes

- **Auth** — `ClerkProvider` in `main.tsx`. `AuthContext` wraps Clerk hooks and fetches app-specific user data (`role`, `avatarUrl`) from `GET /api/users/me`. Axios interceptor gets a fresh JWT via `getToken()` on every request — no localStorage tokens.
- **Theme** — `ThemeContext` supports `light` / `dark` / `system`. Persisted in `localStorage`.
- **i18n** — `LanguageContext` with typed `en`/`es` dictionary. No external library.
- **Error handling** — `extractErrorMessage(e)` utility (`src/api/errorMessage.ts`) wraps `axios.isAxiosError()` for all mutation `onError` handlers.
- **Real-time** — `useNotifications` hook connects STOMP on mount; fresh Clerk JWT fetched before every connect/reconnect via `beforeConnect` hook. Invalidates React Query cache by notification type.
