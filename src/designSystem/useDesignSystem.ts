import { useColorScheme } from "react-native";
import { BorderRadiusToken } from "./generated/borderRadius";
import { BorderWidthToken } from "./generated/borderWidth";
import { ButtonHeightToken } from "./generated/buttonHeight";
import { ColorToken } from "./generated/colors";
import { FontFamilyToken } from "./generated/fontFamily";
import { FontSizeToken } from "./generated/fontSize";
import { FontWeightToken } from "./generated/fontWeight";
import { IconSizeToken } from "./generated/iconSize";
import { LetterSpacingToken } from "./generated/letterSpacing";
import { LineHeightToken } from "./generated/lineHeight";
import { SpacingToken } from "./generated/spacing";

export const useDesignSystem = () => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const getColor = (token: keyof typeof ColorToken) => {
    const entry = ColorToken[token];
    if (!entry) {
      console.warn(`Token ${String(token)} not found`);
      return "#FF00FF";
    }
    return entry(isDark);
  };

  return {
    isDark,
    getColor,
    spacing: SpacingToken,
    radius: BorderRadiusToken,
    borderWidth: BorderWidthToken,
    lineHeight: LineHeightToken,
    letterSpacing: LetterSpacingToken,
    fontFamily: FontFamilyToken,
    fontWeight: FontWeightToken,
    fontSize: FontSizeToken,
    iconSize: IconSizeToken,
    buttonHeight: ButtonHeightToken,
  };
};
