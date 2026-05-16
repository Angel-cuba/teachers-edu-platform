# Mobile — React Native + Expo

Mobile application (iOS & Android) for the Teachers Edu Platform.

## Stack

- **React Native 0.81** + **Expo 54** (managed workflow — Expo Go)
- **Expo Router v4** — file-based navigation
- **NativeWind v4** — TailwindCSS for React Native
- **TanStack Query v5** — server state + caching
- **expo-secure-store** — JWT tokens in native keychain
- **@stomp/stompjs** — WebSocket real-time notifications
- **lucide-react-native** icons

## Prerequisites

- Node 18+
- **Expo Go** app installed on your device or simulator
  - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
  - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- Backend running on `http://localhost:8080`

## Setup

```bash
cp .env.example .env
npm install
npx expo start --clear
```

Then press:
- `i` → iOS Simulator
- `a` → Android Emulator
- Scan QR code with Expo Go on a physical device

## Environment Variables

```env
EXPO_PUBLIC_API_URL=http://localhost:8080/api
EXPO_PUBLIC_WS_URL=http://localhost:8080/ws
```

> **Note:** `localhost` works for both iOS Simulator and Android Emulator when using Expo Go managed workflow. For a physical device, replace with your machine's local IP (e.g. `http://192.168.1.x:8080`).

## Screens

| Route | Role | Description |
|---|---|---|
| `(auth)/login` · `(auth)/register` | Public | Auth |
| `(tabs)/index` | All | Dashboard — stats + courses |
| `(tabs)/courses` | All | Course list |
| `(tabs)/results` | STUDENT | My submissions + scores |
| `(tabs)/notifications` | All | Notifications |
| `(tabs)/profile` | All | Name, password, theme, language |
| `course/[id]` | All | Course detail + exercise list |
| `exercise/[id]` | All | Exercise detail + submission |
| `pending-exercises` | STUDENT | All pending exercises |
| `submissions/[exerciseId]` | TEACHER | Student answers |
| `grade/[submissionId]` | TEACHER | Grade a submission |

## Architecture Notes

- **Theme** — `ThemeContext` uses `useColorScheme()` for system detection. Tokens: `bg`, `card`, `text`, `textSecondary`, `textMuted`, `inputBg`, `inputBorder`, `tabBar`.
- **i18n** — `LanguageContext` with typed `en`/`es` dictionary. Persisted in `AsyncStorage`.
- **Animations** — `useFadeInUp(delay, duration)` shared hook (`lib/useFadeInUp.ts`). `ExerciseCard` in `components/ExerciseCard.tsx`.
- **WebSocket** — Singleton client in `lib/websocket.ts`. Connected in `AppShell` (`_layout.tsx`). Type-aware cache invalidation per notification type.
- **Due dates** — Exercises past `dueDate` show a locked state (no form). Filtered from pending list server-side.
