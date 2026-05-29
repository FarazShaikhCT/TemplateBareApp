import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import type { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import React, { forwardRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ThemePreference } from "../../theme/ThemeContextType";
import { useThemedStyles } from "../../theme/useThemedStyles";

export type ThemePickerOption = ThemePreference;

type Props = {
  selectedKey: ThemePickerOption;
  onSelect: (option: ThemePickerOption) => void;
};

const OPTIONS: readonly {
  key: ThemePickerOption;
  labelKey:
    | "settings.themeSystem"
    | "settings.themeLight"
    | "settings.themeDark";
}[] = [
  { key: "system", labelKey: "settings.themeSystem" },
  { key: "light", labelKey: "settings.themeLight" },
  { key: "dark", labelKey: "settings.themeDark" },
];

export const ThemePickerBottomSheet = forwardRef<
  BottomSheetModalMethods,
  Props
>(function ThemePickerBottomSheet({ selectedKey, onSelect }, ref) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const styles = useThemedStyles(
    colors => ({
      sheetBackground: {
        backgroundColor: colors.background,
      },
      handleIndicator: {
        backgroundColor: colors.text3,
      },
      content: {
        paddingHorizontal: 20,
        paddingBottom: Math.max(insets.bottom, 16),
        paddingTop: 8,
      },
      title: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.text1,
        marginBottom: 16,
      },
      row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.grayBackground,
      },
      rowLast: {
        borderBottomWidth: 0,
      },
      rowLabel: {
        fontSize: 16,
        color: colors.text1,
      },
      rowLabelSelected: {
        fontWeight: "700",
      },
      checkmark: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.primary,
      },
    }),
    [insets.bottom],
  );

  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      enablePanDownToClose
      enableDynamicSizing
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>{t("settings.themeSheetTitle")}</Text>
        {OPTIONS.map((option, index) => {
          const isSelected = selectedKey === option.key;
          const isLast = index === OPTIONS.length - 1;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(option.key)}
              style={[styles.row, isLast && styles.rowLast]}
            >
              <Text
                style={[styles.rowLabel, isSelected && styles.rowLabelSelected]}
              >
                {t(option.labelKey)}
              </Text>
              {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
            </Pressable>
          );
        })}
      </BottomSheetView>
    </BottomSheetModal>
  );
});
