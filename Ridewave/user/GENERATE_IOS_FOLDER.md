# How to Generate iOS Folder

## ⚠️ Important
The iOS folder **cannot be generated on Windows**. It requires macOS and Xcode.

## Steps to Generate iOS Folder (on macOS)

1. **Prerequisites:**
   - macOS computer
   - Xcode installed (from App Store)
   - Xcode Command Line Tools: `xcode-select --install`

2. **Navigate to project:**
   ```bash
   cd Ridewave/user
   ```

3. **Generate iOS folder:**
   ```bash
   npx expo prebuild --platform ios
   ```

4. **Or generate both Android and iOS:**
   ```bash
   npx expo prebuild --platform all
   ```

## Alternative: Use EAS Build (No Mac Required)

If you don't have access to macOS, you can use EAS Build to build iOS apps in the cloud:

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS:**
   ```bash
   eas build:configure
   ```

4. **Build for iOS:**
   ```bash
   eas build --platform ios
   ```

## Current Status

- ✅ Android folder: Generated
- ❌ iOS folder: Cannot be generated on Windows

## For Testing on iPhone

If you're just testing with Expo Go app (scanning QR codes), you **don't need the iOS folder**. The iOS folder is only needed if:
- You're using native modules that aren't supported by Expo Go
- You want to build a standalone iOS app
- You need to configure native iOS settings

Since you're using `expo-auth-session`, you can test on iPhone with Expo Go without the iOS folder.


