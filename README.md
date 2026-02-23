# Puntos Mobile — Docker + Android Setup (Summary)

## Architecture

Docker handles:
- Node / Expo / Metro
- JS dependencies
- Android SDK + Gradle cache

Host handles:
- ADB
- Android emulator / USB device
- APK install

Reason: Docker on Windows/macOS cannot access USB devices.

---

## First-Time Setup

Reset Docker (optional):

```
docker rm -f $(docker ps -aq) 2>/dev/null || true
docker volume rm puntos_node_modules gradle-cache 2>/dev/null || true
docker rmi puntos 2>/dev/null || true
```

Build Docker image:

```
docker build -t puntos .
```

Install Android app (run on host):

```
npm run android
```

If asked for another port → type `n`.

---

## Start Dev Server (Docker)

```
docker run --rm -it
  -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002
  -v ${PWD}:/app
  -v puntos_node_modules:/app/node_modules
  -v gradle-cache:/root/.gradle
  puntos
```

---

## Connect App to Docker Metro

```
adb reverse tcp:8081 tcp:8081
```

---

## Daily Development

```
docker run ...
```

Open app on device/emulator.

---

## Important

- Do NOT press `a` in Docker Metro
- Android install runs on host
- Reinstall only if native changes

---

## Workflow Summary

First time:

```
docker build -t puntos .
npm run android
docker run ...
adb reverse tcp:8081 tcp:8081
```

Daily:

```
docker run ...
```


<!-- # Puntos

Expo Router + NativeWind app with a Docker-based local dev workflow.

## Why We Changed the Setup

We support teammates using:
- Android emulator (no physical phone)
- Android physical phone (USB/Wi-Fi)
- iOS physical device (Wi-Fi)

`expo run:android` inside Docker is unreliable in this environment because Expo/ADB tries to control emulator/device connections from inside the container. That caused issues like `emulator-5554` connection failures.

So we split responsibilities:
- Docker: Metro + Android APK build
- Host machine: ADB install/reverse/launch

## Current Standard

- Do not run `expo run:android` inside Docker.
- Use Docker commands below for Metro/APK.
- Keep this override in `package.json` (already added):

```json
"overrides": {
  "lightningcss": "1.30.1"
}
```

## One-Time Setup

### 1) Build Docker image

```powershell
docker build -t puntos .
```

### 2) Install dependencies into Linux volume

Do this so container uses Linux-native modules (not host Windows `node_modules`).

```powershell
docker run --rm -it -v ${PWD}:/app -v puntos_node_modules:/app/node_modules puntos npm install
docker run --rm -it -v ${PWD}:/app -v puntos_node_modules:/app/node_modules puntos npm ls lightningcss
```

Expected: `lightningcss@1.30.1`.

## Team Workflows

`package.json` has helper scripts:
- `docker:metro:localhost`
- `docker:metro:lan`
- `docker:apk`

Important: these scripts run **inside container** using `docker run ... puntos npm run ...`.

### A) Android Emulator or Android USB Phone

### Start Metro (localhost mode)

```powershell
docker run --rm -it `
  -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 `
  -v ${PWD}:/app `
  -v puntos_node_modules:/app/node_modules `
  puntos npm run docker:metro:localhost
```

### Reverse port from device/emulator (host terminal)

Emulator:

```powershell
adb -s emulator-5554 reverse tcp:8081 tcp:8081
```

USB physical device:

```powershell
adb devices
adb -s <device_serial> reverse tcp:8081 tcp:8081
```

### Build APK (when native dependencies/config changed)

```powershell
docker run --rm -it `
  -v ${PWD}:/app `
  -v gradle-cache:/root/.gradle `
  -v puntos_node_modules:/app/node_modules `
  puntos npm run docker:apk
```

Install and launch:

```powershell
adb -s emulator-5554 install -r android/app/build/outputs/apk/debug/app-debug.apk
adb -s emulator-5554 shell monkey -p com.project.puntos -c android.intent.category.LAUNCHER 1
```

For USB phone, replace `emulator-5554` with `<device_serial>`.

### B) Android/iOS Phone on Wi-Fi

### Start Metro (LAN mode)

```powershell
docker run --rm -it `
  -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 `
  -v ${PWD}:/app `
  -v puntos_node_modules:/app/node_modules `
  puntos npm run docker:metro:lan
```

No `adb reverse` needed for Wi-Fi mode.

## Optional Host-Only Flow (Physical Android)

If someone prefers host-native workflow and has Android tooling set up:

```powershell
npx expo run:android
```

This is host-only. Do not run it inside Docker.

## Troubleshooting

### Volume is in use

```powershell
docker ps -a --filter volume=puntos_node_modules
docker rm <container_id>
```

### `gradlew` line ending issue (`/bin/sh^M`)

`android/gradlew` is normalized via `.gitattributes`:

```gitattributes
android/gradlew text eol=lf
```

### Wrong app installed on emulator

If package mismatch happens, reinstall:

```powershell
adb -s emulator-5554 uninstall com.anonymous.puntos
adb -s emulator-5554 install -r android/app/build/outputs/apk/debug/app-debug.apk
``` -->
