import { View, Text, ScrollView } from "react-native";
import React, { useMemo, useState } from "react";
import { windowHeight, windowWidth } from "@/themes/app.constant";
import ProgressBar from "@/components/common/progress.bar";
import styles from "./styles";
import { useTheme } from "@react-navigation/native";
import TitleView from "@/components/signup/title.view";
import Input from "@/components/common/input";
import SelectInput from "@/components/common/select-input";
import { countryNameItems } from "@/configs/country-name-list";
import Button from "@/components/common/button";
import color from "@/themes/app.colors";
import { router } from "expo-router";
import { Toast } from "react-native-toast-notifications";

export default function SignupScreen() {
  const { colors } = useTheme();
  const [showWarning, setShowWarning] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    country: countryNameItems[0]?.label ?? "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (key: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  };

  const countryCodeMap = useMemo(() => {
    const map = new Map<string, string>();
    countryNameItems.forEach((item: any) => {
      map.set(item.label, item.value);
    });
    return map;
  }, []);

  const gotoDocument = () => {
    if (
      !formData.name.trim() ||
      !formData.country ||
      !formData.phoneNumber.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setShowWarning(true);
      Toast.show("Please complete all required fields.", {
        placement: "bottom",
      });
      return;
    }

    if (formData.password.length < 6) {
      Toast.show("Password must be at least 6 characters long.", {
        placement: "bottom",
        type: "danger",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Toast.show("Passwords do not match.", {
        placement: "bottom",
        type: "danger",
      });
      return;
    }

    setShowWarning(false);

    const dialCode = countryCodeMap.get(formData.country);
    const phone_number = dialCode
      ? `+${dialCode}${formData.phoneNumber}`
      : formData.phoneNumber;

    const driverData = {
      name: formData.name,
      country: formData.country,
      phone_number,
      email: formData.email,
      password: formData.password,
    };
    router.push({
      pathname: "/(routes)/document-verification",
      params: driverData,
    });
  };

  return (
    <ScrollView>
      <View>
        {/* logo */}
        <Text
          style={{
            fontFamily: "TT-Octosquares-Medium",
            fontSize: windowHeight(22),
            paddingTop: windowHeight(50),
            textAlign: "center",
          }}
            >
              Flashride
        </Text>
        <View style={{ padding: windowWidth(20) }}>
          <ProgressBar fill={1} />
          <View
            style={[styles.subView, { backgroundColor: colors.background }]}
          >
            <View style={styles.space}>
                  <TitleView
                    title={"Create your account"}
                    subTitle={"Explore your life by joining Flashride"}
                  />
              <Input
                title="Name"
                placeholder="Enter your name"
                value={formData.name}
                onChangeText={(text) => handleChange("name", text)}
                showWarning={showWarning && formData.name === ""}
                warning={"Please enter your name!"}
              />
              <SelectInput
                title="Country"
                placeholder="Select your country"
                value={formData.country}
                onValueChange={(text) => handleChange("country", text)}
                showWarning={showWarning && formData.country === ""}
                items={countryNameItems}
              />
              <Input
                title="Phone Number"
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                value={formData.phoneNumber}
                onChangeText={(text) => handleChange("phoneNumber", text)}
                showWarning={showWarning && formData.phoneNumber === ""}
                warning={"Please enter your phone number!"}
              />
              <Input
                title={"Email Address"}
                placeholder={"Enter your email address"}
                keyboardType="email-address"
                value={formData.email}
                onChangeText={(text) => handleChange("email", text)}
                showWarning={showWarning && formData.email.trim() === ""}
                warning={"Please enter your email!"}
              />
              <Input
                title="Password"
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(text) => handleChange("password", text)}
                showWarning={showWarning && formData.password === ""}
                warning={"Please create a password!"}
                secureTextEntry
              />
              <Input
                title="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(text) =>
                  handleChange("confirmPassword", text)
                }
                showWarning={showWarning && formData.confirmPassword === ""}
                warning={"Please confirm your password!"}
                secureTextEntry
              />
            </View>
            <View style={styles.margin}>
              <Button
                onPress={gotoDocument}
                height={windowHeight(30)}
                title={"Next"}
                backgroundColor={color.buttonBg}
                textColor={color.whiteColor}
              />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
