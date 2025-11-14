import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import AuthContainer from "@/utils/container/auth-container";
import { windowHeight } from "@/themes/app.constant";
import styles from "./styles";
import Images from "@/utils/images";
import SignInText from "@/components/login/signin.text";
import { external } from "@/styles/external.style";
import PhoneNumberInput from "@/components/login/phone-number.input";
import Button from "@/components/common/button";
import { router } from "expo-router";
import { useToast } from "react-native-toast-notifications";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase, isSupabaseConfigured } from "@/utils/supabase";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

// Complete OAuth session when app opens
WebBrowser.maybeCompleteAuthSession();

const MAURITANIA_CODE = "+222";
const MAURITANIA_DIGITS = 8;

// Helper function to decode JWT token
const decodeJWT = (token: string): any => {
  try {
    // JWT is in format: header.payload.signature
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      throw new Error('Invalid JWT format');
    }
    
    // Convert base64url to base64
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decode base64 (atob is available in React Native)
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT decode error:', error);
    throw new Error('Failed to decode JWT token');
  }
};

export default function LoginScreen() {
  const [phone_number, setphone_number] = useState("");
  const [loading, setloading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const toast = useToast();

  // Helper function to handle successful login
  const handleSuccessfulLogin = useCallback(async (user: any) => {
    try {
      console.log('📤 Sending user info to backend:', {
        email: user.email,
        name: user.name,
        supabaseUserId: user.id,
      });
      
      // Send user info to your backend
      const res = await axios.post(
        `${process.env.EXPO_PUBLIC_SERVER_URI}/supabase-login`,
        {
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          supabaseUserId: user.id,
        }
      );
      
      await AsyncStorage.setItem("accessToken", res.data.accessToken);
      
      toast.show("Successfully signed in with Google!", {
        type: "success",
        placement: "bottom",
      });
      
      // Navigate to home screen
      router.replace("/(tabs)/home");
    } catch (error: any) {
      console.error('❌ Backend login error:', error);
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
  }, [toast]);

  // Note: We're decoding JWT directly instead of using Supabase session management
  // This avoids the "Invalid API key" error with setSession

  const handleSubmit = async () => {
    if (phone_number.length !== MAURITANIA_DIGITS) {
      toast.show("Please enter a valid Mauritania phone number (8 digits).", {
        placement: "bottom",
      });
    } else {
      setloading(true);
      const phoneNumber = `${MAURITANIA_CODE}${phone_number}`;
      await axios
        .post(`${process.env.EXPO_PUBLIC_SERVER_URI}/registration`, {
          phone_number: phoneNumber,
        })
        .then((res) => {
          setloading(false);
          router.push({
            pathname: "/(routes)/otp-verification",
            params: { phoneNumber },
          });
        })
        .catch((error) => {
          console.log(error);
          setloading(false);
          toast.show(
            error?.response?.data?.message ??
              "Something went wrong! please re check your phone number!",
            {
              type: "danger",
              placement: "bottom",
            }
          );
        });
    }
  };

  const handleGoogleLogin = async () => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      toast.show(
        "Google Sign-In is not configured. Please add Supabase credentials to your .env file.",
        {
          type: "danger",
          placement: "bottom",
        }
      );
      return;
    }

    try {
      setGoogleLoading(true);
      
      // Force use of app scheme instead of Expo dev server URL
      // Format: flashride://auth/callback
      // IMPORTANT: This URL must be added to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
      const redirectUrl = 'flashride://auth/callback';
      
      console.log('🔗 Starting Google OAuth');
      console.log('📍 Redirect URL:', redirectUrl);
      console.log('⚠️ Make sure this URL is added to Supabase Dashboard → Authentication → Redirect URLs');
      
      // Start OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('❌ OAuth Error:', error);
        throw error;
      }

      if (data?.url) {
        console.log('🌐 Opening browser with URL:', data.url);
        // Open the OAuth URL in browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        console.log('🔙 Browser result:', result);

        if (result.type === 'success') {
          // Extract the URL from the result
          const url = result.url;
          if (url) {
            console.log('📥 Received callback URL:', url);
            
            // Supabase returns tokens in URL hash (fragment), not query params
            // Parse the hash to extract tokens
            const hash = url.split('#')[1];
            if (hash) {
              const params = new URLSearchParams(hash);
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              
              console.log('🔑 Extracted tokens:', { 
                hasAccessToken: !!accessToken, 
                hasRefreshToken: !!refreshToken 
              });

              if (accessToken) {
                console.log('✅ Access token received, decoding JWT...');
                
                // Decode JWT token directly to get user info (avoid setSession API key issue)
                try {
                  const decodedToken = decodeJWT(accessToken);
                  console.log('👤 Decoded user info from token');
                  
                  // Extract user information from decoded token
                  const userInfo = {
                    id: decodedToken.sub,
                    email: decodedToken.email || null,
                    name: decodedToken.user_metadata?.full_name || 
                          decodedToken.user_metadata?.name || 
                          null,
                    avatar: decodedToken.user_metadata?.avatar_url || 
                            decodedToken.user_metadata?.picture || 
                            null,
                  };
                  
                  console.log('📧 User email:', userInfo.email);
                  console.log('👤 User name:', userInfo.name);
                  
                  // Call backend directly with user info
                  await handleSuccessfulLogin(userInfo);
                } catch (decodeError: any) {
                  console.error('❌ JWT Decode Error:', decodeError);
                  throw new Error('Failed to decode authentication token: ' + decodeError.message);
                }
              } else {
                throw new Error('No access token in callback URL');
              }
            } else {
              // Try query params as fallback
              const parsedUrl = Linking.parse(url);
              const accessToken = parsedUrl.queryParams?.access_token as string;
              const refreshToken = parsedUrl.queryParams?.refresh_token as string;

              if (accessToken) {
                // Decode JWT token directly (same as above)
                try {
                  const decodedToken = decodeJWT(accessToken);
                  const userInfo = {
                    id: decodedToken.sub,
                    email: decodedToken.email || null,
                    name: decodedToken.user_metadata?.full_name || 
                          decodedToken.user_metadata?.name || 
                          null,
                    avatar: decodedToken.user_metadata?.avatar_url || 
                            decodedToken.user_metadata?.picture || 
                            null,
                  };
                  
                  await handleSuccessfulLogin(userInfo);
                } catch (decodeError: any) {
                  console.error('❌ JWT Decode Error:', decodeError);
                  throw new Error('Failed to decode authentication token: ' + decodeError.message);
                }
              } else {
                throw new Error('No access token found in callback');
              }
            }
          }
        } else if (result.type === 'cancel') {
          setGoogleLoading(false);
          toast.show("Google Sign-In was cancelled.", {
            type: "info",
            placement: "bottom",
          });
        } else {
          throw new Error('OAuth flow was not completed');
        }
      } else {
        throw new Error('No OAuth URL returned');
      }
    } catch (error: any) {
      console.error('❌ Google Login Error:', error);
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

  return (
    <AuthContainer
      topSpace={windowHeight(150)}
      imageShow={true}
      container={
        <View>
          <View>
            <View>
              <Image style={styles.transformLine} source={Images.line} />
              <SignInText />
              <View style={[external.mt_25, external.Pb_10]}>
                <PhoneNumberInput
                  phone_number={phone_number}
                  setphone_number={setphone_number}
                />
                <View style={[external.mt_25, external.Pb_15]}>
                  <Button
                    title="Get OTP"
                    onPress={() => handleSubmit()}
                    disabled={loading}
                  />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    marginVertical: 16,
                  }}
                >
                  <View style={{ flex: 1, height: 1, backgroundColor: "#d4d4d4" }} />
                  <Text style={{ color: "#6b7280" }}>or</Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: "#d4d4d4" }} />
                </View>
                <TouchableOpacity
                  onPress={handleGoogleLogin}
                  disabled={googleLoading}
                  style={{
                    borderWidth: 1,
                    borderColor: "#d4d4d4",
                    borderRadius: 12,
                    paddingVertical: 12,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#fff",
                  }}
                >
                  <Text style={{ fontWeight: "600", color: "#111827" }}>
                    {googleLoading ? "Signing in…" : "Continue with Google"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      }
    />
  );
}
