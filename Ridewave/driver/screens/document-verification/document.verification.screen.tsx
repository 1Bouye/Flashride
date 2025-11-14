import { View, Text, ScrollView } from "react-native";
import React, { useState } from "react";
import { windowHeight, windowWidth } from "@/themes/app.constant";
import ProgressBar from "@/components/common/progress.bar";
import styles from "../signup/styles";
import { useTheme } from "@react-navigation/native";
import TitleView from "@/components/signup/title.view";
import Input from "@/components/common/input";
import SelectInput from "@/components/common/select-input";
import Button from "@/components/common/button";
import color from "@/themes/app.colors";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { Toast } from "react-native-toast-notifications";

export default function DocumentVerificationScreen() {
  const driverData = useLocalSearchParams();
  const { colors } = useTheme();
  const getParamValue = (param: any) =>
    Array.isArray(param) ? param[0] : param ?? "";
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicleType: "Car",
    registrationNumber: "",
    registrationDate: "",
    drivingLicenseNumber: "",
    color: "",
    rate: "",
  });

  const handleChange = (key: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    if (
      !formData.vehicleType ||
      !formData.registrationNumber.trim() ||
      !formData.registrationDate.trim() ||
      !formData.drivingLicenseNumber.trim() ||
      !formData.color.trim() ||
      !formData.rate.trim()
    ) {
      setShowWarning(true);
      Toast.show("Please fill out all vehicle details.", {
        placement: "bottom",
      });
      return;
    }

    const apiBaseUrl = process.env.EXPO_PUBLIC_SERVER_URI;

    if (!apiBaseUrl) {
      setLoading(false);
      Toast.show(
        "Driver API URL is not configured. Please set EXPO_PUBLIC_SERVER_URI.",
        {
          placement: "bottom",
          type: "danger",
        }
      );
      return;
    }

    if (
      apiBaseUrl.includes("localhost") ||
      apiBaseUrl.includes("127.0.0.1")
    ) {
      setLoading(false);
      Toast.show(
        "EXPO_PUBLIC_SERVER_URI points to localhost. Use your computer's LAN IP when testing on a phone.",
        {
          placement: "bottom",
          type: "danger",
        }
      );
      return;
    }

    const payload = {
      name: getParamValue(driverData.name),
      country: getParamValue(driverData.country),
      phone_number: getParamValue(driverData.phone_number),
      email: getParamValue(driverData.email),
      password: getParamValue(driverData.password),
      vehicle_type: formData.vehicleType,
      registration_number: formData.registrationNumber,
      registration_date: formData.registrationDate,
      driving_license: formData.drivingLicenseNumber,
      vehicle_color: formData.color,
      rate: formData.rate,
    };

    setLoading(true);
    try {
      const { password: _, ...payloadWithoutPassword } = payload;
      console.log(
        "[DocumentVerification] Submitting driver application",
        JSON.stringify(payloadWithoutPassword)
      );
      await axios.post(`${apiBaseUrl}/driver/register`, payload);
      Toast.show(
        "Application submitted. An administrator will review your details shortly.",
        {
          placement: "bottom",
        }
      );
      console.log(
        "[DocumentVerification] Submission succeeded, navigating to login"
      );
      router.replace({
        pathname: "/(routes)/login",
        params: { submitted: "true", phone: payload.phone_number },
      });
    } catch (error: any) {
      console.log(
        "[DocumentVerification] Submission failed",
        error?.response?.data ?? error?.message ?? error
      );
      const message =
        error?.response?.data?.message ??
        "Unable to submit application. Please try again.";
      Toast.show(message, {
        placement: "bottom",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
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
          <ProgressBar fill={2} />
          <View
            style={[styles.subView, { backgroundColor: colors.background }]}
          >
            <View style={styles.space}>
                  <TitleView
                    title={"Vehicle Registration"}
                    subTitle={"Explore your life by joining Flashride"}
                  />
              <SelectInput
                title="Vehicle Type"
                placeholder="Choose your vehicle type"
                value={formData.vehicleType}
                onValueChange={(text) => handleChange("vehicleType", text)}
                showWarning={showWarning && formData.vehicleType === ""}
                warning={"Please choose your vehicle type!"}
                items={[
                  { label: "Car", value: "Car" },
                  { label: "Motorcycle", value: "Motorcycle" },
                  { label: "CNG", value: "CNG" },
                ]}
              />
              <Input
                title="Registration Number"
                placeholder="Enter your vehicle registration number"
                keyboardType="number-pad"
                value={formData.registrationNumber}
                onChangeText={(text) =>
                  handleChange("registrationNumber", text)
                }
                showWarning={showWarning && formData.registrationNumber === ""}
                warning={"Please enter your vehicle registration number!"}
              />
              <Input
                title="Vehicle Registration Date"
                placeholder="Enter your vehicle registration date"
                value={formData.registrationDate}
                onChangeText={(text) => handleChange("registrationDate", text)}
                showWarning={showWarning && formData.registrationDate === ""}
                warning={"Please enter your vehicle Registration Date number!"}
              />
              <Input
                title={"Driving License Number"}
                placeholder={"Enter your driving license number"}
                keyboardType="number-pad"
                value={formData.drivingLicenseNumber}
                onChangeText={(text) =>
                  handleChange("drivingLicenseNumber", text)
                }
                showWarning={
                  showWarning && formData.drivingLicenseNumber === ""
                }
                warning={"Please enter your driving license number!"}
              />
              <Input
                title={"Vehicle Color"}
                placeholder={"Enter your vehicle color"}
                value={formData.color}
                onChangeText={(text) => handleChange("color", text)}
                showWarning={showWarning && formData.color === ""}
                warning={"Please enter your vehicle color!"}
              />
              <Input
                title={"Rate per km"}
                placeholder={
                  "How much you want to charge from your passenger per km."
                }
                keyboardType="number-pad"
                value={formData.rate}
                onChangeText={(text) => handleChange("rate", text)}
                showWarning={showWarning && formData.rate === ""}
                warning={
                  "Please enter how much you want to charge from your customer per km."
                }
              />
            </View>
            <View style={styles.margin}>
              <Button
                onPress={() => handleSubmit()}
                title={loading ? "Submitting..." : "Submit"}
                height={windowHeight(30)}
                disabled={loading}
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
