FROM node:20-bullseye AS development

USER root

# ---- Android + Java ----
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    wget \
    unzip \
    git \
    curl \
    usbutils \
    && rm -rf /var/lib/apt/lists/*

# ---- Android SDK ----
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/emulator

RUN mkdir -p $ANDROID_HOME/cmdline-tools

RUN wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O sdk.zip \
    && unzip sdk.zip -d $ANDROID_HOME/cmdline-tools \
    && mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest \
    && rm sdk.zip

RUN yes | sdkmanager --licenses

RUN sdkmanager \
    "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0"

# ---- Expo ----
RUN npm install -g expo

WORKDIR /app

# copy only package files
COPY package.json package-lock.json ./

# install deps inside container (Linux)
RUN npm install

# copy rest of app (without node_modules due to dockerignore)
COPY . .

EXPOSE 19000 19001 19002 19006 8081

## old setup
# CMD ["npx","expo","run:android"]

## new setup -> set to neutral
CMD ["npx","expo","start","--dev-client","--port","8081","--clear"]

## SHORTER COMMANDS (modified package.json)
# Run scripts INSIDE container (not directly on host)

# 1) Metro for Emulator / Android USB:
# docker run --rm -it -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 -v ${PWD}:/app -v puntos_node_modules:/app/node_modules puntos npm run docker:metro:localhost
# then in another host terminal:
# adb -s emulator-5554 reverse tcp:8081 tcp:8081
# OR (USB physical phone):
# adb -s <device_serial> reverse tcp:8081 tcp:8081

# 2) Metro for Android/iOS Wi-Fi:
# docker run --rm -it -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 -v ${PWD}:/app -v puntos_node_modules:/app/node_modules puntos npm run docker:metro:lan

# 3) Build APK in Docker:
# docker run --rm -it -v ${PWD}:/app -v gradle-cache:/root/.gradle -v puntos_node_modules:/app/node_modules puntos npm run docker:apk

## ACTUAL COMMANDS 

## Android Emulator (no phone)
# docker run --rm -it -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 -v ${PWD}:/app -v puntos_node_modules:/app/node_modules puntos npx expo start --dev-client --host localhost --port 8081 --clear
# adb -s emulator-5554 reverse tcp:8081 tcp:8081 (other terminal)
# ---------------------------------------------
## Android Physical Phone (USB)
# docker run --rm -it -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 -v ${PWD}:/app -v puntos_node_modules:/app/node_modules puntos npx expo start --dev-client --host localhost --port 8081 --clear
# adb -s <device_serial> reverse tcp:8081 tcp:8081 (other terminal)
# ---------------------------------------------
## Android Physical Phone (WiFi)
# docker run --rm -it -p 8081:8081 -p 19000:19000 -p 19001:19001 -p 19002:19002 -v ${PWD}:/app -v puntos_node_modules:/app/node_modules puntos npx expo start --dev-client --host lan --port 8081 --clear
