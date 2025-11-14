import { View, Text, TextInput, StyleSheet } from "react-native";
import { commonStyles } from "@/styles/common.style";
import { windowHeight, windowWidth } from "@/themes/app.constant";
import { external } from "@/styles/external.style";
import styles from "@/screens/login/styles";
import color from "@/themes/app.colors";

interface Props {
  width?: number;
  phone_number: string;
  setphone_number: (phone_number: string) => void;
}

const MAURITANIA_CODE = "+222";
const MAURITANIA_DIGITS = 8;

export default function PhoneNumberInput({
  width,
  phone_number,
  setphone_number,
}: Props) {
  const handleChange = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, "").slice(0, MAURITANIA_DIGITS);
    setphone_number(sanitized);
  };

  return (
    <View>
      <Text
        style={[commonStyles.mediumTextBlack, { marginTop: windowHeight(8) }]}
      >
        Phone Number (Mauritania only)
      </Text>
      <View
        style={[
          external.fd_row,
          external.ai_center,
          external.mt_5,
          { flexDirection: "row" },
        ]}
      >
        <View style={internalStyles.codeBadge}>
          <Text style={internalStyles.codeText}>{MAURITANIA_CODE}</Text>
        </View>
        <View
          style={[
            styles.phoneNumberInput,
            {
              width: width || windowWidth(346),
              borderColor: color.border,
            },
          ]}
        >
          <TextInput
            style={[commonStyles.regularText]}
            placeholderTextColor={color.subtitle}
            placeholder={"Enter 8-digit number"}
            keyboardType="numeric"
            value={phone_number}
            onChangeText={handleChange}
            maxLength={MAURITANIA_DIGITS}
          />
        </View>
      </View>
    </View>
  );
}

const internalStyles = StyleSheet.create({
  codeBadge: {
    height: windowHeight(39),
    borderRadius: 6,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.lightGray,
    paddingHorizontal: windowWidth(14),
    justifyContent: "center",
    marginRight: windowWidth(6),
  },
  codeText: {
    fontSize: windowHeight(14),
    fontWeight: "600",
    color: color.primaryText,
  },
});
