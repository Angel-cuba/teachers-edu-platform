# Mobile — React Native + Expo

Mobile application (iOS & Android) for the EduPlatform.

## Stack

- **React Native 0.81** + **Expo 54** (managed workflow — Expo Go)
- **Expo Router v4** — file-based navigation
- **@clerk/clerk-expo** — authentication (sign-in, sign-up, JWT tokens)
- **expo-secure-store** — Clerk token cache (native keychain)
- **NativeWind v4** — TailwindCSS for React Native
- **TanStack Query v5** — server state + caching
- **@stomp/stompjs** — WebSocket real-time notifications
- **lucide-react-native** icons

## Prerequisites

- Node 18+
- **Expo Go** app installed on your device or simulator
  - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
  - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- Backend running on `http://localhost:8080`
- [Clerk account](https://clerk.com) — copy the Publishable Key

## Setup

```bash
# Copy the example (fill in your values)
cp .env.example .env
npm install
npx expo start --clear
```

Then press:
- `i` → iOS Simulator
- `a` → Android Emulator
- Scan QR code with Expo Go on a physical device

## Environment Variables

Create `.env` (or `.env.local`) from `.env.example`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8080/api
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
```

> **Note:** `localhost` works for iOS Simulator and Android Emulator in Expo Go managed workflow. For a physical device, replace with your machine's local IP (e.g. `http://192.168.1.x:8080`).

## Screens

| Route | Role | Description |
|---|---|---|
| `(auth)/login` | Public | Sign in (Clerk) |
| `(auth)/register` | Public | Sign up + email verification |
| `(tabs)/index` | All | Dashboard — stats + courses |
| `(tabs)/courses` | All | Course list |
| `(tabs)/results` | STUDENT | My submissions + scores |
| `(tabs)/notifications` | All | Notifications |
| `(tabs)/profile` | All | Display name, theme, language, avatar |
| `course/[id]` | All | Course detail + exercise list |
| `exercise/[id]` | All | Exercise detail + submission |
| `pending-exercises` | STUDENT | All pending exercises |
| `submissions/[exerciseId]` | TEACHER | Student answers |
| `grade/[submissionId]` | TEACHER | Grade a submission |

## Architecture Notes

- **Auth** — `ClerkProvider` in `_layout.tsx` with `expo-secure-store` token cache. `ClerkTokenBridge` component wires Clerk's `getToken` into `api.ts` and `websocket.ts` at startup. `AuthContext` watches Clerk's `isSignedIn` and fetches app-specific user data (`role`, `avatarUrl`) from `GET /api/users/me`. Generation counter prevents stale fetches from overwriting fresh state.
- **API client** — `lib/api.ts` uses a module-level Clerk token getter. On 401 retries with `{ skipCache: true }` to force a fresh Clerk token.
- **WebSocket** — Singleton client in `lib/websocket.ts`. `beforeConnect` hook fetches a fresh Clerk token before every connect / reconnect. No static token baked at connection time.
- **Theme** — `ThemeContext` uses `useColorScheme()` for system detection. Persisted in `AsyncStorage`.
- **i18n** — `LanguageContext` with typed `en`/`es` dictionary. Persisted in `AsyncStorage`.
- **Due dates** — Exercises past `dueDate` show a locked state (no form). Filtered from pending list server-side.
