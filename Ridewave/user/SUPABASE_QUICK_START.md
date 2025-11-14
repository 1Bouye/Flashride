# Supabase Quick Start Checklist

Follow these steps in order:

## ✅ Phase 1: Supabase Setup (5 minutes)

### 1. Create Supabase Account
- [ ] Go to https://supabase.com
- [ ] Sign up (free)
- [ ] Create new project: "flashride-user"
- [ ] Wait for project to initialize

### 2. Get Credentials
- [ ] Go to Settings → API
- [ ] Copy **Project URL**: `https://xxxxx.supabase.co`
- [ ] Copy **anon public key**: `eyJhbGc...`
- [ ] Add to `.env` file:
  ```env
  EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
  ```

### 3. Configure Google OAuth in Supabase
- [ ] Go to Authentication → Providers → Google
- [ ] Enable Google provider
- [ ] Get Google OAuth credentials from Google Cloud Console:
  - Create OAuth client (Web application)
  - Add redirect URI: `https://xxxxx.supabase.co/auth/v1/callback`
- [ ] Paste Client ID and Client Secret in Supabase
- [ ] Save

---

## ✅ Phase 2: Install & Configure (2 minutes)

### 4. Install Package
```bash
cd Ridewave/user
npm install @supabase/supabase-js
```

### 5. Verify Supabase Client Created
- [ ] Check `utils/supabase.ts` exists ✅ (Already created)

---

## ✅ Phase 3: Update Mobile App (10 minutes)

### 6. Update Login Screen
- [ ] Replace Google OAuth code with Supabase
- [ ] Add Supabase auth state listener
- [ ] Test Google sign-in

### 7. Update Backend (Optional - if using new endpoint)
- [ ] Add `supabaseLogin` endpoint
- [ ] Add route: `/supabase-login`
- [ ] Test endpoint

---

## ✅ Phase 4: Database Update (If Needed)

### Option A: Reuse `googleId` field (Simpler)
- Use existing `googleId` field to store Supabase user ID
- No schema migration needed

### Option B: Add new field (Cleaner)
- Add `supabaseUserId` to schema
- Run migration

---

## ✅ Phase 5: Test (5 minutes)

- [ ] Restart Expo: `npx expo start --clear`
- [ ] Test Google Sign-In
- [ ] Verify user created in database
- [ ] Verify JWT token returned
- [ ] Verify navigation to home screen

---

## 🎯 Total Time: ~20 minutes

---

## Next: Ready to implement?

I can help you:
1. Update the login screen code
2. Create the backend endpoint
3. Test the integration

Let me know when you've completed Phase 1 (Supabase setup) and I'll help with the code implementation!

