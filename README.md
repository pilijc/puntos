# Puntos Mobile

Expo/React Native app for the Puntos rewards platform. This guide covers running the app with **Docker** (Metro + Node) and building/installing on **Android** from your host.

---

## Architecture

| Environment | Responsibilities |
|------------|------------------|
| **Docker** | Node, Expo, Metro bundler, JS dependencies, Android SDK + Gradle cache |
| **Host** | ADB, Android emulator or USB device, APK install / `npm run android` |

Docker cannot access USB devices on Windows, so the Android app is built and installed from the host while Metro runs inside the container.

---

## Prerequisites

- **Docker** — [Install Docker](https://docs.docker.com/get-docker/)
- **Java 17** — [Oracle JDK 17](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html) (required for Android build)
- **ADB** — Android Debug Bridge (for devices/emulators)
  - Ubuntu: `sudo apt install adb`
- **Ubuntu** — clone and run the project on Ubuntu (native or WSL2 on Windows).

---

## First-Time Setup

### 1. Clone the repository (on Ubuntu)

Clone the project on your Ubuntu machine or WSL2:

```bash
git clone https://github.com/pilijc/puntos.git
cd puntos
```

### 2. Build the Docker image

```bash
docker build -t puntos .
```

### 3. Start Metro inside Docker (Terminal 1 — keep running)

```bash
docker run --rm -it \
  -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 \
  -v ${PWD}:/app \
  -v puntos_node_modules:/app/node_modules \
  -v gradle-cache:/root/.gradle \
  puntos
```

### 4. Install dependencies

**Inside the container** (Docker Desktop → container → Exec, or from a new terminal):

```bash
docker ps
docker exec -it <container-id> npm i
```

**On your host** (Terminal 2, in the project root):

```bash
npm i
```

Once both finish, continue to the next step.

### 5. Connect your Android device or emulator

**Option A — USB:** Enable Developer options and USB debugging, then connect the device with a cable.

**Option B — Wireless (Wi‑Fi debugging):** Ensure your laptop and Android device are on the **same Wi‑Fi network**, then:

1. Connect the device once via USB and enable USB debugging.
2. Run:
   ```bash
   adb tcpip 5555
   adb connect <device-ip>:5555
   ```
   Replace `<device-ip>` with the device’s IP (Settings → About phone → Status, or Developer options → Wireless debugging).
3. Unplug the USB cable. The device stays connected over Wi‑Fi.
4. For later sessions on the same network, you can run only:
   ```bash
   adb connect <device-ip>:5555
   ```

**Emulator:** Start an AVD from Android Studio.

Verify connection:

```bash
adb devices
```

You should see your device or emulator listed (e.g. `10AF9Y0MJE002RT device`).

### 6. Install and run the app (Terminal 2 — from host)

From the **project root on your host** (not inside Docker):

```bash
npm run android
```

If Metro asks to use a different port, choose **No** (`n`) so it keeps using the port exposed by Docker.

---

## Daily Development

1. **Start Metro (Docker):**

   ```bash
   docker run --rm -it \
     -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 \
     -v ${PWD}:/app \
     -v puntos_node_modules:/app/node_modules \
     -v gradle-cache:/root/.gradle \
     puntos
   ```

2. **Launch the App**: In another terminal, run `npm run android`. Before proceeding, ensure your device or emulator is connected by running `adb devices` and confirming it appears in the device list.

---

## Important

- **Do not press `a`** in the Docker Metro terminal to run Android — that would try to run the build inside the container, which cannot see your device.
- **Android build/install** is done on the **host** via `npm run android` and ADB.
- **Reinstall the app** (e.g. `npm run android` or reinstall APK) only when you change native code or add new native dependencies; JS-only changes are served by Metro.
- **Wireless debugging:** Device and laptop must be on the **same Wi‑Fi network** for Wi‑Fi ADB to work.

---
