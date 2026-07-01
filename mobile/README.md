# A-1 Renovations Mobile

Expo SDK 56 app for Android and iOS. It supports homeowner and provider accounts against the authenticated marketplace API in `../server`.

## Functional modules

- Authentication with secure token storage and refresh
- Homeowner AI estimate flow with camera/gallery photos, voice transcription, device location, project posting, estimate Q&A, budgets, bids, messaging, and appointments
- Provider dashboard, nearby jobs, bid/site-visit submission, quote status, messaging, appointments, awarded-value summary, and profile
- Admin accounts remain web-only

The legacy “after renovation” renderer is intentionally not exposed here because it is not connected to authenticated marketplace projects.

## Local development

1. Start the backend from `../server` with `npm run dev`.
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_AI_API` to an address reachable by the device. Use a LAN address for Expo Go or HTTPS for remote/EAS builds; `localhost` only works from a simulator that shares the host network.
3. Run `npm install` and `npx expo start -c`.

Use `npm test`, `npm run check`, and `npx expo-doctor` before creating builds.

## EAS previews

The native identifier is `com.a1renovations.app` on both platforms. Configure `EXPO_PUBLIC_AI_API` in the EAS environment, then run:

```bash
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

Android preview builds are APKs. Physical iOS internal distribution requires an Apple Developer account and registered test devices.
