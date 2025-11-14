# Supabase OAuth Setup Guide - Step by Step

This guide will help you set up Supabase for Google and Apple sign-in, replacing the current OAuth implementation.

---

## 📋 Prerequisites

- Supabase account (free tier works)
- Google Cloud Console access (for Google OAuth)
- Apple Developer account (for Apple Sign-In - optional, can add later)

---

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign Up"**
3. Sign up with GitHub, Google, or email
4. Click **"New Project"**
5. Fill in:
   - **Name**: `flashride-user` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
6. Click **"Create new project"**
7. Wait 2-3 minutes for project to initialize

---

## Step 2: Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** (gear icon) → **API**
2. Copy these values (you'll need them):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (keep this secret!)

3. Add to your `.env` file in `Ridewave/user/.env`:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

---

## Step 3: Configure Google OAuth in Supabase

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click to enable it
3. You'll need to configure Google OAuth:

### 3a. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create new)
3. Go to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Choose **Web application**
6. Name: `Supabase Google OAuth`
7. **Authorized redirect URIs**: Add:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```
   (Replace `xxxxx` with your Supabase project reference ID - found in your Supabase URL)
8. Click **Create**
9. Copy the **Client ID** and **Client Secret**

### 3b. Add to Supabase

1. Back in Supabase → **Authentication** → **Providers** → **Google**
2. Paste:
   - **Client ID (for OAuth)**: Your Google Client ID
   - **Client Secret (for OAuth)**: Your Google Client Secret
3. Click **Save**

---

## Step 4: Configure Apple Sign-In (Optional - Can Add Later)

1. In Supabase → **Authentication** → **Providers** → **Apple**
2. Enable it
3. You'll need:
   - Apple Developer account
   - Service ID
   - Key ID
   - Team ID
   - Private Key

**Note**: Apple Sign-In requires Apple Developer account ($99/year). You can skip this for now and add it later.

---

## Step 5: Install Supabase in Your Mobile App

1. Open terminal in `Ridewave/user` folder
2. Install Supabase:
   ```bash
   npm install @supabase/supabase-js
   ```

---

## Step 6: Create Supabase Client

Create a new file: `Ridewave/user/utils/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

---

## Step 7: Update Login Screen

Replace the Google sign-in implementation in `screens/login/login.screen.tsx`:

### Remove:
- `expo-auth-session` imports
- `expo-web-browser` imports
- Google OAuth configuration

### Add:
- Supabase client import
- Supabase OAuth functions

---

## Step 8: Update Backend (Optional - Two Approaches)

### Approach A: Send Supabase User Info to Backend (Simpler)

Backend receives user info (email, name, etc.) and creates/updates user in your database.

### Approach B: Verify Supabase Token in Backend (More Secure)

Backend verifies the Supabase token and extracts user info.

**Recommendation**: Start with Approach A (simpler), upgrade to B later if needed.

---

## Step 9: Test the Implementation

1. Restart Expo: `npx expo start --clear`
2. Test Google Sign-In
3. Verify user is created in your backend database
4. Check that your JWT token is returned correctly

---

## 🔄 Migration Checklist

- [ ] Create Supabase account and project
- [ ] Get Supabase credentials (URL, anon key)
- [ ] Configure Google OAuth in Supabase
- [ ] Add credentials to `.env` file
- [ ] Install `@supabase/supabase-js`
- [ ] Create Supabase client utility
- [ ] Update login screen with Supabase
- [ ] Update backend endpoint (if needed)
- [ ] Test Google Sign-In
- [ ] Test user creation in database
- [ ] Verify JWT token generation

---

## 📝 Next Steps After Setup

1. Remove old OAuth code (`expo-auth-session` if not needed elsewhere)
2. Add Apple Sign-In (when ready)
3. Consider adding other providers (Facebook, Twitter, etc.)
4. Set up email verification (if needed)

---

## 🆘 Troubleshooting

### Issue: "Invalid API key"
- Check `.env` file has correct Supabase URL and anon key
- Restart Expo after changing `.env`

### Issue: "Redirect URI mismatch"
- Verify redirect URI in Google Cloud Console matches Supabase callback URL
- Format: `https://xxxxx.supabase.co/auth/v1/callback`

### Issue: "User not created in database"
- Check backend endpoint is receiving Supabase user info
- Verify backend is creating/updating user correctly

---

## 💡 Benefits Summary

✅ Works with Expo Go (no native modules)
✅ No redirect URI configuration needed
✅ Automatic OAuth handling
✅ Built-in session management
✅ Easy to add more providers later
✅ Your backend stays the same (just receives different token/info)

