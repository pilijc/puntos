# ✅ Prebuilt React Native Android environment (SDK + JDK + tools ready)
FROM reactnativecommunity/react-native-android:latest AS development

USER root

WORKDIR /app

# ---- Expo CLI ----
RUN npm install -g expo

# ---- Cache dependencies layer ----
COPY package.json package-lock.json ./
RUN npm install

# ---- Copy rest of project ----
COPY . .

# ---- Ports ----
EXPOSE 19000 19001 19002 19006 8081

## old setup
# CMD ["npx","expo","run:android"]

## new setup -> Metro only (fast, no rebuild)
CMD ["npx","expo","start","--dev-client","--host","lan","--port","8081","--clear"]
## SHORTER COMMANDS (modified package.json)
# Run scripts INSIDE container (not directly on host)

# 1) Metro for Emulator / Android USB:
# docker run --rm -it -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 \
#   -v ${PWD}:/app -v puntos_node_modules:/app/node_modules -v gradle-cache:/root/.gradle \
#   puntos npm run docker:metro:localhost
# then in another host terminal:
# adb -s emulator-5554 reverse tcp:8081 tcp:8081
# OR (USB physical phone):
# adb -s <device_serial> reverse tcp:8081 tcp:8081

# 2) Metro for Android/iOS Wi-Fi:
# docker run --rm -it -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 \
#   -v ${PWD}:/app -v puntos_node_modules:/app/node_modules -v gradle-cache:/root/.gradle \
#   puntos npm run docker:metro:lan

# 3) Build APK in Docker:
# docker run --rm -it \
#   -v ${PWD}:/app \
#   -v gradle-cache:/root/.gradle \
#   -v puntos_node_modules:/app/node_modules \
#   puntos npm run docker:apk

## ACTUAL COMMANDS 

## Android Emulator (no phone)
# docker run --rm -it -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 \
#   -v ${PWD}:/app -v puntos_node_modules:/app/node_modules -v gradle-cache:/root/.gradle \
#   puntos npx expo start --dev-client --host localhost --port 8081 --clear
# adb -s emulator-5554 reverse tcp:8081 tcp:8081 (other terminal)

## Android Physical Phone (USB)
# docker run --rm -it -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 \
#   -v ${PWD}:/app -v puntos_node_modules:/app/node_modules -v gradle-cache:/root/.gradle \
#   puntos npx expo start --dev-client --host localhost --port 8081 --clear
# adb -s <device_serial> reverse tcp:8081 tcp:8081 (other terminal)

## Android Physical Phone (WiFi)
# docker run --rm -it -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 \
#   -v ${PWD}:/app -v puntos_node_modules:/app/node_modules -v gradle-cache:/root/.gradle \
#   puntos npx expo start --dev-client --host lan --port 8081 --clear