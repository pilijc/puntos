  # Expo Router and Tailwind CSS

  Use [Expo Router](https://docs.expo.dev/router/introduction/) with [Nativewind](https://www.nativewind.dev/v4/overview/) styling.

  ## Launch your own

  [![Launch with Expo](https://github.com/expo/examples/blob/master/.gh-assets/launch.svg?raw=true)](https://launch.expo.dev/?github=https://github.com/expo/examples/tree/master/with-tailwindcss)

  ## 🚀 How to use

  ```sh
  npx create-expo-app -e with-tailwindcss
  ```

  ## Deploy

  Deploy on all platforms with Expo Application Services (EAS).

  - Deploy the website: `npx eas-cli deploy` — [Learn more](https://docs.expo.dev/eas/hosting/get-started/)
  - Deploy on iOS and Android using: `npx eas-cli build` — [Learn more](https://expo.dev/eas)

  ## Docker + Android Emulator (No Physical Device)

  ### Why this setup

  We use this flow when we do not have a physical Android phone and still need to test Docker in this project.

  `expo run:android` inside Docker fails for host emulators because Expo/ADB tries emulator console commands (`emulator-5554`), which are not reachable from the container in this setup.

  So we split the workflow:
  - Build APK in Docker
  - Install/run APK on host emulator via host `adb`
  - Run Metro in Docker

  ### One-time dependency fix (NativeWind v5 preview + LightningCSS)

  Keep this in `package.json`:

  ```json
  "overrides": {
    "lightningcss": "1.30.1"
  }
  ```

  Install Linux deps in a Docker volume (do not use host `node_modules` inside container):

  ```powershell
  docker run --rm -it -v ${PWD}:/app -v puntos_node_modules:/app/node_modules puntos npm install
  docker run --rm -it -v ${PWD}:/app -v puntos_node_modules:/app/node_modules puntos npm ls lightningcss
  ```

  ### Build APK in Docker

  If you hit `/bin/sh^M: bad interpreter`, normalize `gradlew` once:

  ```powershell
  docker run --rm -v ${PWD}:/app puntos bash -lc "cd /app/android && sed -i 's/\r$//' gradlew && chmod +x gradlew"
  ```

  Build debug APK:

  ```powershell
  docker run --rm -it `
    -v ${PWD}:/app `
    -v gradle-cache:/root/.gradle `
    -v puntos_node_modules:/app/node_modules `
    puntos bash -lc "cd /app/android && ./gradlew --no-daemon --project-cache-dir /tmp/gradle-project-cache assembleDebug"
  ```

  ### Install and run on emulator (host terminal)

  ```powershell
  adb -s emulator-5554 uninstall com.anonymous.puntos
  adb -s emulator-5554 install -r android/app/build/outputs/apk/debug/app-debug.apk
  adb -s emulator-5554 reverse tcp:8081 tcp:8081
  adb -s emulator-5554 shell monkey -p com.project.puntos -c android.intent.category.LAUNCHER 1
  ```

  ### Start Metro in Docker

  ```powershell
  docker run --rm -it `
    -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 `
    -v ${PWD}:/app `
    -v puntos_node_modules:/app/node_modules `
    puntos npx expo start --dev-client --host localhost --port 8081 --clear
  ```

  ### Notes

  - Open the installed dev build app (`com.project.puntos`), not Expo Go.
  - Do not use tunnel mode for this flow (`ngrok` failures were observed).
  - If a Docker volume cannot be removed because it is in use, remove the leftover container first:

  ```powershell
  docker ps -a --filter volume=puntos_node_modules
  docker rm <container_id>
  ```