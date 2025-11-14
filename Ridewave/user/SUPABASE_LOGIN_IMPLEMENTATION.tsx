// This is the NEW login screen code using Supabase
// Replace the Google OAuth section in your login.screen.tsx with this

import { supabase } from "@/utils/supabase";

// In your LoginScreen component, replace the Google OAuth code with:

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
    // We handle the result in the useEffect below
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

// Add this useEffect to handle OAuth callback (replace the old one)
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

