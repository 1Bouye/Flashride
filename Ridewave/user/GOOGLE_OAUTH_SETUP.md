# Google OAuth Setup Guide for Expo

## Error: "Error 400: invalid_request"

This error occurs when Google OAuth is not properly configured. Follow these steps to fix it.

## Step 1: Create OAuth Credentials in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**

## Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace)
3. Fill in required information:
   - App name: "Flashride" (or your app name)
   - User support email: Your email
   - Developer contact: Your email
4. Click **Save and Continue**
5. Add scopes (if needed): `email`, `profile`, `openid`
6. Add test users (your email) if app is in testing mode
7. Click **Save and Continue**

## Step 3: Create OAuth Client IDs

### For Expo Go (Web Client - REQUIRED)

1. Create a **Web application** OAuth client:
   - Name: "Flashride Web Client"
   - Authorized redirect URIs: Add these:
     ```
     https://auth.expo.io/@anonymous/flashride
     https://auth.expo.io/@your-expo-username/flashride
     ```
   - Note: Replace `flashride` with your Expo slug from `app.config.js`
2. Copy the **Client ID** - this is your `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID`

### For Android (Optional - for production)

1. Create an **Android** OAuth client:
   - Name: "Flashride Android"
   - Package name: `com.flashride.user` (from app.config.js)
   - SHA-1 certificate fingerprint: Get from your keystore
2. Copy the **Client ID** - this is your `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

### For iOS (Optional - for production)

1. Create an **iOS** OAuth client:
   - Name: "Flashride iOS"
   - Bundle ID: `com.flashride.user` (from app.config.js)
2. Copy the **Client ID** - this is your `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

## Step 4: Update Your .env File

Add these to your `.env` file in the `user` folder:

```env
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your-web-client-id-here.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id-here.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id-here.apps.googleusercontent.com
```

## Step 5: Important Notes

1. **For Expo Go**: You MUST use the **Web Client ID** (`EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID`)
2. **Redirect URI**: Must match exactly in Google Cloud Console
3. **Testing Mode**: If your app is in testing mode, add your email to test users
4. **Publishing**: For production, you'll need to publish your OAuth consent screen

## Step 6: Get Your Expo Redirect URI

Your Expo redirect URI format is:
```
https://auth.expo.io/@anonymous/your-expo-slug
```

To find your exact redirect URI:
1. Check your `app.config.js` for the `slug` field
2. Or run: `npx expo config --type public | grep slug`

## Common Issues

### Issue: "Error 400: invalid_request"
- **Solution**: Make sure you're using the **Web Client ID** for `expoClientId`
- **Solution**: Verify redirect URI is added in Google Cloud Console

### Issue: "Access blocked"
- **Solution**: Add your email to test users in OAuth consent screen
- **Solution**: Make sure OAuth consent screen is configured

### Issue: "redirect_uri_mismatch"
- **Solution**: Add the exact redirect URI from the error to Google Cloud Console

## Quick Fix for Testing

If you just want to test quickly:

1. Create a **Web application** OAuth client in Google Cloud Console
2. Add redirect URI: `https://auth.expo.io/@anonymous/flashride`
3. Use ONLY the Web Client ID in your `.env`:
   ```env
   EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
   ```
4. The code will automatically use this for Expo Go

