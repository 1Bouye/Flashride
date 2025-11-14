# Environment Variables Setup

## Quick Fix for Supabase Error

The app is showing an error because Supabase environment variables are missing. Here's how to fix it:

### Step 1: Create `.env` file

Create a file named `.env` in the `Ridewave/user` folder with the following content:

```env
# Supabase Configuration
# Get these from your Supabase project: Settings → API
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server Configuration (if not already set)
EXPO_PUBLIC_SERVER_URI=http://your-server-url:3000
```

### Step 2: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click **Settings** (⚙️ icon) → **API**
3. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Step 3: Restart Expo

After adding the `.env` file:

```bash
cd Ridewave/user
npx expo start --clear
```

The app should now load without errors!

---

## Note

The app will now load even without Supabase credentials, but Google Sign-In won't work until you add them. You'll see a helpful error message if you try to use Google Sign-In without the credentials.

