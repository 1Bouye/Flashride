import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import AuthContainer from "@/utils/container/auth-container";
import { windowHeight } from "@/themes/app.constant";
import SignInText from "@/components/login/signin.text";
import { commonStyles } from "@/styles/common.style";
import { external } from "@/styles/external.style";
import Button from "@/components/common/button";
import { style } from "../verification/style";
import color from "@/themes/app.colors";
import { useToast } from "react-native-toast-notifications";
import OTPTextInput from "react-native-otp-textinput";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EmailVerificationScreen() {
  const [otp, setOtp] = useState("");
  const [loader, setLoader] = useState(false);
  const toast = useToast();
  const { user } = useLocalSearchParams() as any;
  const parsedUser = JSON.parse(user);

  const handleSubmit = async () => {
    if (!otp || otp.length !== 4) {
      toast.show("Please enter the complete 4-digit OTP code!", {
        placement: "bottom",
        type: "danger",
      });
      return;
    }

    if (!process.env.EXPO_PUBLIC_SERVER_URI) {
      toast.show("Server configuration error. Please contact support.", {
        type: "danger",
        placement: "bottom",
      });
      console.error("EXPO_PUBLIC_SERVER_URI is not set");
      return;
    }

    setLoader(true);
    const otpNumbers = `${otp}`;
    
    // Ensure the URL ends with /api/v1
    let baseUrl = process.env.EXPO_PUBLIC_SERVER_URI || "";
    if (baseUrl.endsWith("/api/v")) {
      baseUrl = baseUrl + "1";
    } else if (!baseUrl.endsWith("/api/v1")) {
      baseUrl = baseUrl.replace(/\/api\/v\d*$/, "/api/v1");
    }
    
    const apiUrl = `${baseUrl}/email-otp-verify`;
    console.log("[Email Verification] Making API call to:", apiUrl);
    console.log("[Email Verification] Request payload:", {
      token: parsedUser.token ? "present" : "missing",
      otp: otpNumbers,
    });

    try {
      const res = await axios.put(apiUrl, {
        token: parsedUser.token,
        otp: otpNumbers,
      }, {
        timeout: 10000,
      });

      console.log("[Email Verification] API response status:", res.status);
      console.log("[Email Verification] API response data:", res.data);
      setLoader(false);

      if (!res.data || !res.data.accessToken) {
        console.error("[Email Verification] Invalid response - missing accessToken");
        toast.show("Invalid response from server. Please try again.", {
          type: "danger",
          placement: "bottom",
        });
        return;
      }

      await AsyncStorage.setItem("accessToken", res.data.accessToken);
      console.log("[Email Verification] Token saved, navigating to home...");
      
      toast.show("Email verified successfully! Welcome!", {
        type: "success",
        placement: "bottom",
      });
      
      router.replace("/(tabs)/home");
      console.log("[Email Verification] Navigation command executed");
    } catch (error: any) {
      setLoader(false);
      console.error("[Email Verification] API Error:", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: apiUrl,
      });
      
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong! Please try again.";
      
      toast.show(errorMessage, {
        type: "danger",
        placement: "bottom",
      });
    }
  };

  return (
    <AuthContainer
      topSpace={windowHeight(240)}
      imageShow={true}
      container={
        <View>
          <SignInText
            title={"Email Verification"}
            subtitle={"Check your email address for the otp!"}
          />
          <OTPTextInput
            handleTextChange={(code) => setOtp(code)}
            inputCount={4}
            textInputStyle={style.otpTextInput}
            tintColor={color.subtitle}
            autoFocus={false}
          />
          <View style={[external.mt_30]}>
            <Button
              title="Verify"
              onPress={() => handleSubmit()}
              disabled={loader}
            />
          </View>
          <View style={[external.mb_15]}>
            <View
              style={[
                external.pt_10,
                external.Pb_10,
                { flexDirection: "row", gap: 5, justifyContent: "center" },
              ]}
            >
              <Text style={[commonStyles.regularText]}>Not Received yet?</Text>
              <TouchableOpacity>
                <Text style={[style.signUpText, { color: "#000" }]}>
                  Resend it
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      }
    />
  );
}
