# Supabase Implementation Code

## Step 1: Install Supabase

```bash
cd Ridewave/user
npm install @supabase/supabase-js
```

---

## Step 2: Add Environment Variables

Add to `Ridewave/user/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## Step 3: Supabase Client (Already Created)

File: `Ridewave/user/utils/supabase.ts` ✅ Created

---

## Step 4: Update Login Screen

Replace the Google sign-in code in `screens/login/login.screen.tsx`:

### Remove these imports:
```typescript
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
```

### Add this import:
```typescript
import { supabase } from "@/utils/supabase";
```

### Replace the Google login handler:

**OLD CODE:**
```typescript
const [request, response, promptAsync] = Google.useIdTokenAuthRequest({...});
useEffect(() => { handleGoogleResponse() }, [response]);
const handleGoogleLogin = async () => { await promptAsync() };
```

**NEW CODE:**
```typescript
const handleGoogleLogin = async () => {
  try {
    setGoogleLoading(true);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'flashride://auth/callback', // Your app scheme
      },
    });

    if (error) {
      throw error;
    }

    // The OAuth flow will redirect, so we handle it in a listener
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

// Add this useEffect to handle OAuth callback
useEffect(() => {
  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // User signed in successfully
        const user = session.user;
        
        try {
          // Send user info to your backend
          const res = await axios.post(
            `${process.env.EXPO_PUBLIC_SERVER_URI}/supabase-login`,
            {
              email: user.email,
              name: user.user_metadata?.full_name || user.user_metadata?.name,
              avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
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
      }
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

## Step 5: Update Backend Endpoint

Create new endpoint: `Ridewave/server/controllers/user.controller.ts`

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

    // Check if user exists by email or supabaseUserId
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { supabaseUserId: supabaseUserId } as any,
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
          supabaseUserId: supabaseUserId,
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
          supabaseUserId: supabaseUserId,
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

Add route in `Ridewave/server/routes/user.route.ts`:

```typescript
import { supabaseLogin } from "../controllers/user.controller";

userRouter.post("/supabase-login", supabaseLogin);
```

---

## Step 6: Update Database Schema (If Needed)

If your Prisma schema doesn't have `supabaseUserId` field, add it:

```prisma
model User {
  id            String   @id @default(uuid())
  // ... existing fields
  supabaseUserId String?  @unique // Add this
  // ... rest of fields
}
```

Then run:
```bash
cd Ridewave/server
npx prisma migrate dev --name add_supabase_user_id
```

---

## Step 7: Configure App Scheme for OAuth Callback

In `app.config.js`, ensure you have:

```javascript
scheme: "flashride",
```

This allows Supabase to redirect back to your app after OAuth.

---

## Step 8: Test

1. Restart Expo: `npx expo start --clear`
2. Click "Continue with Google"
3. Complete Google sign-in
4. Verify user is created in your database
5. Check that you're redirected to home screen

---

## Apple Sign-In (Later)

When ready to add Apple Sign-In:

```typescript
const handleAppleLogin = async () => {
  try {
    setAppleLoading(true);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'flashride://auth/callback',
      },
    });

    if (error) throw error;
  } catch (error: any) {
    setAppleLoading(false);
    toast.show(
      error?.message || "Unable to sign in with Apple.",
      { type: "danger", placement: "bottom" }
    );
  }
};
```

The same `onAuthStateChange` listener will handle Apple sign-in automatically!

