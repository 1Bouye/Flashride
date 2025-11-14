import color from "@/themes/app.colors";
import { fontSizes, windowHeight, windowWidth } from "@/themes/app.constant";
import fonts from "@/themes/app.fonts";
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  transformLine: {
    transform: [{ rotate: "-90deg" }],
    height: windowHeight(50),
    width: windowWidth(120),
    position: "absolute",
    left: windowWidth(-50),
    top: windowHeight(-20),
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.FONT16,
    color: color.primaryText,
    marginBottom: windowHeight(4),
  },
  inputField: {
    width: "100%",
    borderRadius: windowHeight(5),
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.lightGray,
    paddingHorizontal: windowHeight(9),
    paddingVertical: windowHeight(8),
    fontFamily: fonts.regular,
    fontSize: fontSizes.FONT17,
    color: color.primaryText,
  },
});

export default styles;
