# Phase 6.5 Expo SDK 57 Device Readiness

## Purpose

Phase 6.5 aligns the Expo mobile app with the current Expo Go generation so the Phase 6 questionnaire engine can be tested on a physical iPhone.

## Previous SDK

- Expo SDK: `54.0.0`
- `expo`: `^54.0.0`
- React Native resolved before upgrade: `0.81.6`
- Expo config reported `sdkVersion: 54.0.0`

The project was already partially mismatched before the upgrade: `expo-crypto` and `expo-sqlite` were at `57.0.2` while `expo` was SDK 54.

## New SDK

- Expo SDK: `57.0.0`
- `expo`: `57.0.21`
- `react`: `19.2.3`
- `react-native`: `0.86.3`
- `expo-sqlite`: `57.0.2`
- `expo-crypto`: `57.0.2`
- `expo-status-bar`: `57.0.1`
- `@types/react`: `19.2.18`, accepted by Expo's SDK 57 dependency check for `~19.2.4`

## Dependency Alignment

Commands used:

- `pnpm --filter @ses-dms/mobile add expo@^57.0.0`
- `pnpm --filter @ses-dms/mobile exec expo install --fix`
- tightened mobile dependency ranges for Expo-managed packages
- `pnpm install`

Post-upgrade check:

- `pnpm --filter @ses-dms/mobile exec expo install --check` passed with `Dependencies are up to date`.
- `pnpm dlx expo-doctor` passed `21/21 checks`.

## Compatibility Fixes

No application code changes were required for SDK 57 compatibility.

The existing SQLite repository and migration code still typechecks against the SDK 57 `expo-sqlite` package. Phase 6 pure mobile tests continue to cover response mapping, repeat scoping, outbox payloads, sync state transitions, definition integrity, branching, completion, and cross-module triggers.

## Verification Results

Passed:

- `pnpm install`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm --filter @ses-dms/mobile test`
- `pnpm --filter @ses-dms/mobile exec expo config --type public`
- `pnpm --filter @ses-dms/mobile exec expo install --check`
- `pnpm dlx expo-doctor`

Metro startup smoke check:

- `pnpm --filter @ses-dms/mobile exec expo start --lan --go`
- Result: Metro started and printed `Waiting on http://localhost:8081`; command was then stopped by timeout.

## iPhone Startup Instructions

From the repository root:

```powershell
pnpm --filter @ses-dms/mobile exec expo start --lan --go
```

Scan the QR code with Expo Go on the iPhone.

If LAN discovery is blocked by network policy, try tunnel mode:

```powershell
pnpm --filter @ses-dms/mobile exec expo start --tunnel --go
```

## LAN API Setup

On a physical iPhone, `localhost` points to the phone, not the Windows PC.

When testing against the local NestJS API, set the mobile app API base URL to the Windows PC LAN address, for example:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://192.168.x.x:3001"
pnpm --filter @ses-dms/mobile exec expo start --lan --go
```

Do not hard-code a machine-specific LAN IP into tracked source files.

The iPhone and Windows PC must be on the same network for LAN mode. Windows Firewall must allow inbound traffic for the API port and Metro port.

## Manual iPhone Checklist

Not yet executed on a physical iPhone in this session.

When the user scans the QR, verify:

- Expo Go opens the project.
- SQLite initializes.
- debug/interview launcher appears.
- Household opens.
- Business opens.
- Landowner opens.
- field edits persist.
- repeat rows work.
- section navigation works.
- branching works.
- close/reopen retains data.
- offline editing works.

## Remaining Warnings

No Expo Doctor warnings remain.

Native physical-device behavior is not claimed as passed until tested on the iPhone.
