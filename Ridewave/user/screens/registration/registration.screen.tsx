import { View, Text, ScrollView, StyleSheet } from "react-native";
import React, { useState } from "react";
import { useTheme } from "@react-navigation/native";
import { windowHeight, windowWidth } from "@/themes/app.constant";
import TitleView from "@/components/signup/title.view";
import Input from "@/components/common/input";
import Button from "@/components/common/button";
import color from "@/themes/app.colors";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { useToast } from "react-native-toast-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RegistrationScreen() {
  const { colors } = useTheme();
  const { user } = useLocalSearchParams() as any;
  const parsedUser = JSON.parse(user);
  const toast = useToast();
  const [showWarning, setShowWarning] = useState(false);
  const [formData, setFormData] = useState({
    name: parsedUser?.name || "",
    phoneNumber: parsedUser?.phone_number || "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  };
  


  const handleSubmit = async () => {
    console.log("[Registration] Button clicked, formData:", formData);
    console.log("[Registration] EXPO_PUBLIC_SERVER_URI:", process.env.EXPO_PUBLIC_SERVER_URI);
    
    // Validation
    if (!formData.name || formData.name.trim() === "") {
      console.log("[Registration] Validation failed: Name is empty");
      setShowWarning(true);
      toast.show("Please enter your name!", {
        type: "danger",
        placement: "bottom",
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

    setLoading(true);
    
    // Ensure the URL ends with /api/v1 (not /api/v)
    let baseUrl = process.env.EXPO_PUBLIC_SERVER_URI || "";
    if (baseUrl.endsWith("/api/v")) {
      baseUrl = baseUrl + "1";
    } else if (!baseUrl.endsWith("/api/v1")) {
      baseUrl = baseUrl.replace(/\/api\/v\d*$/, "/api/v1");
    }
    
    const apiUrl = `${baseUrl}/complete-profile`;
    console.log("[Registration] Making API call to:", apiUrl);
    console.log("[Registration] Request payload:", {
      name: formData.name,
      userId: parsedUser.id,
    });

    try {
      const res = await axios.post(apiUrl, {
        name: formData.name,
        userId: parsedUser.id,
      }, {
        timeout: 10000, // 10 second timeout
      });

      console.log("[Registration] API response status:", res.status);
      console.log("[Registration] API response data:", res.data);
      setLoading(false);

      if (!res.data || !res.data.accessToken) {
        console.error("[Registration] Invalid response - missing accessToken. Response:", res.data);
        toast.show("Invalid response from server. Please try again.", {
          type: "danger",
          placement: "bottom",
        });
        return;
      }

      // Save token and go directly to home
      await AsyncStorage.setItem("accessToken", res.data.accessToken);
      console.log("[Registration] Token saved, navigating to home...");
      
      toast.show("Profile completed! Welcome!", {
        type: "success",
        placement: "bottom",
      });
      
      router.replace("/(tabs)/home");
      console.log("[Registration] Navigation command executed");
    } catch (error: any) {
      setLoading(false);
      console.error("[Registration] API Error:", {
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
    <ScrollView>
      <View>
        {/* logo */}
        <Text
          style={{
            fontFamily: "TT-Octosquares-Medium",
            fontSize: windowHeight(25),
            paddingTop: windowHeight(50),
            textAlign: "center",
          }}
        >
          Flashride
        </Text>
        <View style={{ padding: windowWidth(20) }}>
          <View
            style={[styles.subView, { backgroundColor: colors.background }]}
          >
            <View style={styles.space}>
              <TitleView
                title={"Create your account"}
                subTitle="Explore your life by joining Flashride"
              />
              <Input
                title="Name"
                placeholder="Enter your name"
                value={formData?.name}
                onChangeText={(text) => handleChange("name", text)}
                showWarning={showWarning && formData.name === ""}
                warning={"Please enter your name!"}
              />
              <Input
                title="Phone Number"
                placeholder="Enter your phone number"
                value={parsedUser?.phone_number}
                disabled={true}
              />
              <View style={styles.margin}>
                <Button
                  onPress={() => handleSubmit()}
                  title="Next"
                  disabled={loading}
                  backgroundColor={color.buttonBg}
                  textColor={color.whiteColor}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  subView: {
    height: "100%",
  },
  space: {
    marginHorizontal: windowWidth(4),
  },
  margin: {
    marginVertical: windowHeight(12),
  },
});
