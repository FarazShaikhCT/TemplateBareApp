import React from "react";
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "../theme/ThemeContext";
import { useThemedStyles } from "../theme/useThemedStyles";

const ROW_HORIZONTAL_PADDING = 12;
const LEADING_ICON_PADDING_H = 4;

export type TopBarProps = {
  /** Shown next to the menu or back control (e.g. product name). */
  topBarTitle: string;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
} & (
  | { onMenuPress: () => void; onBackPress?: undefined }
  | { onBackPress: () => void; onMenuPress?: undefined }
);

export function TopBar({
  topBarTitle,
  onBackPress,
  onMenuPress,
  rightAction,
  style,
  titleStyle,
}: TopBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(c => ({
    outer: {
      backgroundColor: c.background,
    },
    contentRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: ROW_HORIZONTAL_PADDING,
      paddingBottom: 8,
      minHeight: 48,
    },
    leadingButton: {
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: LEADING_ICON_PADDING_H,
      paddingVertical: 8,
    },
    appName: {
      flex: 1,
      fontSize: 18,
      fontWeight: "600",
      color: c.text1,
    },
    rightSlot: {
      minWidth: 48,
      minHeight: 48,
      justifyContent: "center",
      alignItems: "center",
    },
  }));

  const leadingIsMenu = onMenuPress != null;
  const handleLeadingPress = leadingIsMenu ? onMenuPress : onBackPress!;

  return (
    <View style={[styles.outer, { paddingTop: insets.top }, style]}>
      <View style={styles.contentRow}>
        <Pressable
          style={styles.leadingButton}
          onPress={handleLeadingPress}
          accessibilityRole="button"
          accessibilityLabel={leadingIsMenu ? "Open menu" : "Go back"}
        >
          <Ionicons
            name={leadingIsMenu ? "menu" : "chevron-back"}
            size={26}
            color={colors.text1}
          />
        </Pressable>
        <Text
          style={[styles.appName, titleStyle]}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {topBarTitle}
        </Text>
        <View style={styles.rightSlot}>{rightAction ?? null}</View>
      </View>
    </View>
  );
}
