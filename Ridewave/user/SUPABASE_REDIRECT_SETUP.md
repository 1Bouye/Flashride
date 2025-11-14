# Fix: Safari Cannot Open Page - Redirect URL Setup

## Problem
When clicking "Continue with Google", Safari shows "Safari cannot open the page" error.

## Solution: Add Redirect URL to Supabase

You need to add your app's redirect URL to Supabase's allowed redirect URLs.

### Step 1: Get Your Redirect URL

Your app uses this redirect URL format:
```
flashride://auth/callback
```

### Step 2: Add to Supabase Dashboard

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: `flashride-user` (or your project name)
3. Go to **Authentication** → **URL Configuration**
4. Find **"Redirect URLs"** section
5. Click **"Add URL"**
6. Add this URL:
   ```
   flashride://auth/callback
   ```
7. Click **"Save"**

### Step 3: Alternative - Use Supabase Callback URL

If the above doesn't work, you can also add:
```
https://agdsaednqpvegcgtnrxk.supabase.co/auth/v1/callback
```
(Replace with your actual Supabase project URL)

### Step 4: Restart Expo

After adding the redirect URL:
```bash
cd Ridewave/user
npx expo start --clear
```

### Step 5: Test

1. Click "Continue with Google"
2. Browser should open with Google OAuth
3. After signing in, it should redirect back to your app
4. App should navigate to home screen

---

## Why This Happens

Supabase requires you to whitelist redirect URLs for security. Without adding your app's redirect URL, Supabase rejects the callback, causing Safari to show the error.

---

## Still Not Working?

If it still doesn't work:
1. Check the console logs - look for the redirect URL being used
2. Make sure the URL in Supabase dashboard matches exactly (including `flashride://`)
3. Try using the full Supabase callback URL instead

