# Nexa CRM — Android Build Guide

## 1. Prerequisites
- **Node.js:** v20+ (current system: v26.8.1)
- **Java Development Kit:** OpenJDK 21 LTS (verified installed at `/usr/bin/java`)
- **Android SDK:**
  - Build Tools: 34.0.0 or 35.0.0
  - Compile SDK: API 34 / 35
  - Minimum SDK: API 28 (Android 9.0 Pie)
  - Target SDK: API 34+
- **Capacitor CLI:** v8.x

## 2. Local Build Steps
1. Build web assets:
   ```bash
   npm run build
   ```
2. Sync web assets with native Android project:
   ```bash
   npx cap sync android
   ```
3. Assemble Debug APK:
   ```bash
   cd android && ./gradlew assembleDebug
   ```
4. Assemble Release APK:
   ```bash
   cd android && ./gradlew assembleRelease
   ```
   Output: `android/app/build/outputs/apk/release/app-release-unsigned.apk`
