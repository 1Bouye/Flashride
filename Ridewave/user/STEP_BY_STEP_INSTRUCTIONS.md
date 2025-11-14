# Complete Step-by-Step Supabase Setup Instructions

## 🎯 Goal
Replace current Google OAuth with Supabase OAuth (works with Expo Go, no configuration headaches)

---

## 📝 STEP 1: Create Supabase Project (5 min)

1. **Go to Supabase**: https://supabase.com
2. **Sign Up**: Use GitHub, Google, or email
3. **Create New Project**:
   - Name: `flashride-user`
   - Database Password: Create strong password (save it!)
   - Region: Choose closest to your users
   - Click **"Create new project"**
4. **Wait 2-3 minutes** for initialization

---

## 📝 STEP 2: Get Supabase Credentials (2 min)

1. In Supabase dashboard, click **Settings** (⚙️ icon) → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

3. **Add to your `.env` file** (`Ridewave/user/.env`):
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## 📝 STEP 3: Configure Google OAuth in Supabase (10 min)

### 3a. Get Google OAuth Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Select your project** (or create new)
3. **Navigate**: APIs & Services → Credentials
4. **Create OAuth Client**:
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
   - Application type: **"Web application"**
   - Name: `Supabase Google OAuth`
   - **Authorized redirect URIs**: Add this (IMPORTANT!):
     ```
     https://xxxxx.supabase.co/auth/v1/callback
     ```
     *(Replace `xxxxx` with your Supabase project reference - it's in your Supabase URL)*
   - Click **"Create"**
5. **Copy credentials**:
   - **Client ID**: `1079236247674-xxxxx.apps.googleusercontent.com`
   - **Client Secret**: `GOCSPX-xxxxx`

### 3b. Add to Supabase

1. **In Supabase**: Authentication → Providers
2. **Find "Google"** and click to expand
3. **Enable Google** (toggle on)
4. **Paste credentials**:
   - **Client ID (for OAuth)**: Your Google Client ID
   - **Client Secret (for OAuth)**: Your Google Client Secret
5. **Click "Save"**

---

## 📝 STEP 4: Install Supabase Package (1 min)

```bash
cd Ridewave/user
npm install @supabase/supabase-js
```

---

## 📝 STEP 5: Verify Supabase Client (Already Created ✅)

File `Ridewave/user/utils/supabase.ts` is already created. Just verify it exists.

---

## 📝 STEP 6: Update Login Screen (10 min)

### 6a. Update Imports

In `Ridewave/user/screens/login/login.screen.tsx`:

**Remove:**
```typescript
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
```

**Add:**
```typescript
import { supabase } from "@/utils/supabase";
```

### 6b. Remove Old Google OAuth Code

**Remove these lines:**
```typescript
const GOOGLE_ANDROID_CLIENT_ID = ...
const GOOGLE_IOS_CLIENT_ID = ...
const GOOGLE_EXPO_CLIENT_ID = ...
WebBrowser.maybeCompleteAuthSession();
const [request, response, promptAsync] = Google.useIdTokenAuthRequest({...});
useEffect(() => { handleGoogleResponse() }, [response, toast]);
```

### 6c. Replace handleGoogleLogin Function

**Replace the entire `handleGoogleLogin` function with:**

```typescript
const handleGoogleLogin = async () => {
  try {
    setGoogleLoading(true);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'flashride://auth/callback',
      },
    });

    if (error) {
      throw error;
    }
    // OAuth will open browser, user signs in, then redirects back
  } catch (error: any) {
    setGoogleLoading(false);
    toast.show(
      error?.message || "Unable to sign in with Google right now.",
      {
        type: "danger",
        placement: "bottom",
      }
    );
  }
};
```

### 6d. Add Auth State Listener

**Add this useEffect (replace the old Google response handler):**

```typescript
useEffect(() => {
  // Listen for auth state changes from Supabase
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const user = session.user;
        
        try {
          // Send user info to your backend
          const res = await axios.post(
            `${process.env.EXPO_PUBLIC_SERVER_URI}/supabase-login`,
            {
              email: user.email,
              name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              supabaseUserId: user.id,
            }
          );
          
          await AsyncStorage.setItem("accessToken", res.data.accessToken);
          
          toast.show("Successfully signed in with Google!", {
            type: "success",
            placement: "bottom",
          });
          
          router.replace("/(tabs)/home");
        } catch (error: any) {
          console.log(error);
          toast.show(
            error?.response?.data?.message ??
              "Unable to sign in with Google right now.",
            {
              type: "danger",
              placement: "bottom",
            }
          );
        } finally {
          setGoogleLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setGoogleLoading(false);
      }
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}, [toast]);
```

---

## 📝 STEP 7: Update Backend (10 min)

### 7a. Add Supabase Login Endpoint

**Add to `Ridewave/server/controllers/user.controller.ts`:**

```typescript
export const supabaseLogin = async (req: Request, res: Response) => {
  try {
    const { email, name, avatar, supabaseUserId } = req.body as {
      email: string;
      name: string | null;
      avatar: string | null;
      supabaseUserId: string;
    };

    if (!email || !supabaseUserId) {
      return res.status(400).json({
        success: false,
        message: "Missing required user information.",
      });
    }

    // Check if user exists by email or supabaseUserId (stored in googleId field)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { googleId: supabaseUserId } as any, // Reuse googleId field
        ],
      },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name: name || null,
          avatar: avatar || null,
          googleId: supabaseUserId, // Store Supabase user ID
          authProvider: "google",
        } as any,
      });
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.email || email,
          name: user.name || name || null,
          avatar: (user as any).avatar || avatar || null,
          googleId: supabaseUserId,
          authProvider: "google",
        } as any,
      });
    }

    await sendToken(user, res);
  } catch (error: any) {
    console.error("[SupabaseAuth] Error:", {
      message: error?.message,
      stack: error?.stack,
    });
    res.status(401).json({
      success: false,
      message: error?.message || "Unable to authenticate with Google.",
    });
  }
};
```

### 7b. Add Route

**Update `Ridewave/server/routes/user.route.ts`:**

**Add import:**
```typescript
import {
  // ... existing imports
  supabaseLogin,
} from "../controllers/user.controller";
```

**Add route:**
```typescript
userRouter.post("/supabase-login", supabaseLogin);
```

---

## 📝 STEP 8: Test (5 min)

1. **Restart Expo**:
   ```bash
   cd Ridewave/user
   npx expo start --clear
   ```

2. **Test Google Sign-In**:
   - Click "Continue with Google"
   - Complete Google sign-in in browser
   - Should redirect back to app
   - Should navigate to home screen

3. **Verify**:
   - Check database: User should be created/updated
   - Check AsyncStorage: accessToken should be saved
   - Check navigation: Should go to home screen

---

## ✅ Done!

Your Google Sign-In now works with Supabase! No more OAuth configuration headaches.

---

## 🍎 Adding Apple Sign-In Later

When ready, just add:

```typescript
const handleAppleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: 'flashride://auth/callback',
    },
  });
};
```

The same auth state listener will handle it automatically!

---

## 🆘 Troubleshooting

**"Invalid API key"**
- Check `.env` file has correct values
- Restart Expo after changing `.env`

**"Redirect URI mismatch"**
- Verify redirect URI in Google Cloud Console: `https://xxxxx.supabase.co/auth/v1/callback`
- Must match exactly (including https://)

**"User not created"**
- Check backend endpoint `/supabase-login` is working
- Check database connection
- Check Prisma schema allows the fields

