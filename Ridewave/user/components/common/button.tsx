import { Pressable, StyleSheet, Text, DimensionValue } from "react-native";
import React from "react";
import { commonStyles } from "@/styles/common.style";
import color from "@/themes/app.colors";
import { windowHeight } from "@/themes/app.constant";
import { external } from "@/styles/external.style";

interface ButtonProps {
  title: string;
  onPress: () => void;
  width?: DimensionValue;
  backgroundColor?: string;
  textColor?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  width,
  backgroundColor,
  textColor,
  disabled,
}) => {
  const handlePress = () => {
    console.log("[Button] Pressed:", title, "disabled:", disabled);
    if (!disabled && onPress) {
      onPress();
    } else {
      console.log("[Button] Press ignored - disabled or no onPress handler");
    }
  };
  
  return (
    <Pressable
      style={[
        styles.container,
        {
          width: width || "100%",
          backgroundColor: backgroundColor || color.buttonBg,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      <Text
        style={[
          commonStyles.extraBold,
          { color: textColor || color.whiteColor },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.buttonBg,
    height: windowHeight(40),
    borderRadius: 6,
    ...external.ai_center,
    ...external.js_center,
  },
});

export default Button;
