import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Try multiple ways to get environment variables (Expo can expose them differently)
const supabaseUrl = 
  process.env.EXPO_PUBLIC_SUPABASE_URL || 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || 
  '';
  
const supabaseAnonKey = 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  '';

// Debug logging (remove in production)
if (__DEV__) {
  console.log('🔍 Supabase Config Check:');
  console.log('  URL:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'NOT SET');
  console.log('  Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');
  console.log('  Configured:', !!(supabaseUrl && supabaseAnonKey));
}

// Create Supabase client with fallback empty strings to prevent immediate error
// The client will only be used when env vars are properly set
let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  if (__DEV__) {
    console.log('✅ Supabase client initialized successfully');
  }
} else {
  // Create a dummy client to prevent errors, but it won't work
  // This allows the app to load without crashing
  console.warn(
    '⚠️ Supabase environment variables not set. Google Sign-In will not work until you add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.'
  );
  // Create a client with placeholder values (will fail gracefully when used)
  supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const supabase = supabaseClient;

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

