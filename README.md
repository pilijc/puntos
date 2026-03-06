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
- **Ubuntu** — clone and run the project on Ubuntu (native or WSL2 on Windows). [Download Ubuntu](https://ubuntu.com/download)

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

### 3. Start Metro inside Docker (Terminal 1 — keep this running)

```bash
docker run --rm -it \
  -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 \
  -v ${PWD}:/app \
  -v puntos_node_modules:/app/node_modules \
  -v gradle-cache:/root/.gradle \
  puntos
```

### 4. Install dependencies ( Terminal + Docker Container Exec )

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

**Option C – Emulator:** You can use the Android Emulator instead of a physical device.

1. **Install Android Studio:**  
   [Download Android Studio](https://developer.android.com/studio) and install it on your host machine (not inside Docker).

2. **Set up an AVD (Android Virtual Device):**  
   - Open Android Studio.
   - Go to **Tools > Device Manager** (or **Configure > AVD Manager** on some versions).
   - Click **Create Device...**.
   - Choose a device definition (e.g., Pixel 5), and click **Next**.
   - Select a system image (e.g., "R" or "Tiramisu" for Android 13), then **Download** if necessary, and click **Next**.
   - Adjust AVD settings if needed, then click **Finish**.

3. **Launch your emulator:**  
   - In the Device Manager/AVD Manager, click the **Play** ▶️ button next to your AVD to start it.
   - Wait for the emulator to fully boot (home screen appears).

4. **Verify connection:**  
   In a terminal on your host, run:
   ```bash
   adb devices
   ```
   You should see your emulator listed (e.g., `emulator-5554 device`).  
   If not, make sure adb is installed and in your PATH, and that the emulator is running.

### 6. Install and run the app (Terminal 2 — from host)

From the **project root on your host** (not inside Docker):

```bash
npm run android
```

If Metro asks to use a different port, choose **No** (`n`) so it keeps using the port exposed by Docker.

---

## Environment Variables

1. **Create your env file from the example:**

   ```bash
   cp .env.example .env
   ```

2. **Restart Metro / the app** after changing `.env` so Expo picks up the new values.

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

## Sample Accounts

Use these test accounts to explore different roles in the app:

- **Super Admin**
  - Email: `superadmin@tsg.com`
  - Password: `Password123$`

- **Store Manager / Owner**
  - Email: `storemanager@tsg.com`
  - Password: `Password123$`

- **Front-desk**
  - Email: `frontdesk@tsg.com`
  - Password: `Password123$`

- **User**
  - Email: `user@mail.com`
  - Password: `password`
