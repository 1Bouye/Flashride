import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import AuthContainer from "@/utils/container/auth-container";
import { windowHeight } from "@/themes/app.constant";
import SignInText from "@/components/login/signin.text";
import OTPTextInput from "react-native-otp-textinput";
import { style } from "./style";
import color from "@/themes/app.colors";
import { external } from "@/styles/external.style";
import Button from "@/components/common/button";
import { router, useLocalSearchParams } from "expo-router";
import { commonStyles } from "@/styles/common.style";
import { useToast } from "react-native-toast-notifications";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function OtpVerificationScreen() {
  const [otp, setOtp] = useState("");
  const [loader, setLoader] = useState(false);
  const toast = useToast();
  const { phoneNumber } = useLocalSearchParams();

  const handleSubmit = async () => {
    if (otp === "" || otp.length !== 4) {
      toast.show("Please enter the complete 4-digit OTP code!", {
        placement: "bottom",
      });
    } else {
      setLoader(true);
      const otpNumbers = `${otp}`;
      await axios
        .post(`${process.env.EXPO_PUBLIC_SERVER_URI}/verify-otp`, {
          phone_number: phoneNumber,
          otp: otpNumbers,
        })
        .then(async (res) => {
          setLoader(false);
          
          // Check if user is new (no name or email) - only new users go to registration
          const user = res.data.user;
          const isNewUser = !user.name && !user.email;
          
          if (isNewUser) {
            // New user - send to registration to complete profile
            console.log("[OTP Verification] New user detected, redirecting to registration");
            router.push({
              pathname: "/(routes)/registration",
              params: { user: JSON.stringify(user) },
            });
            toast.show("Account verified! Please complete your profile.");
          } else {
            // Existing user - log them in directly
            console.log("[OTP Verification] Existing user, logging in");
            await AsyncStorage.setItem("accessToken", res.data.accessToken);
            toast.show("Welcome back!", {
              type: "success",
              placement: "bottom",
            });
            router.replace("/(tabs)/home");
          }
        })
        .catch((error) => {
          setLoader(false);
          toast.show("Something went wrong! please re check your otp!", {
            type: "danger",
            placement: "bottom",
          });
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
            title={"OTP Verification"}
            subtitle={"Check your phone number for the otp!"}
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
