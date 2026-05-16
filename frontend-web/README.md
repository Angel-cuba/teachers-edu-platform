# Frontend Web — React + Vite

Web application for the Teachers Edu Platform.

## Stack

- **React 18** + **TypeScript**
- **Vite** (dev server + build)
- **TailwindCSS** with `darkMode: 'class'`
- **TanStack Query v5** — server state, caching, real-time sync
- **React Router v6**
- **Framer Motion v12** — page and component animations
- **Axios** with auto-refresh interceptor
- **WebSocket / STOMP** (`@stomp/stompjs`)
- **lucide-react** icons · **react-hot-toast** notifications

## Prerequisites

- Node 18+
- Backend running on `http://localhost:8080`

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:5173`.

## Environment Variables

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (HMR) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Pages

| Route | Role | Description |
|---|---|---|
| `/login` · `/register` | Public | Auth |
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
| `/profile` | All | Display name, password, theme, language |

## Architecture Notes

- **Theme** — `ThemeContext` supports `light` / `dark` / `system`. Persisted in `localStorage`.
- **i18n** — `LanguageContext` with typed `en`/`es` dictionary. No external library.
- **Error handling** — `extractErrorMessage(e)` utility (`src/api/errorMessage.ts`) wraps `axios.isAxiosError()` for all mutation `onError` handlers.
- **Real-time** — `useNotifications` hook connects STOMP on mount, invalidates React Query cache by notification type.
