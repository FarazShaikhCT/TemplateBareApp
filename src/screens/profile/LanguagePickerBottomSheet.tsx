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

import { useThemedStyles } from "../../theme/useThemedStyles";

export type LanguagePickerOption = "en" | "es" | "device";

type Props = {
  selectedKey: LanguagePickerOption;
  onSelect: (option: LanguagePickerOption) => void;
};

const OPTIONS: readonly {
  key: LanguagePickerOption;
  labelKey:
    | "settings.languageEnglish"
    | "settings.languageSpanish"
    | "settings.useDeviceLanguage";
}[] = [
  { key: "en", labelKey: "settings.languageEnglish" },
  { key: "es", labelKey: "settings.languageSpanish" },
  { key: "device", labelKey: "settings.useDeviceLanguage" },
];

export const LanguagePickerBottomSheet = forwardRef<
  BottomSheetModalMethods,
  Props
>(function LanguagePickerBottomSheet({ selectedKey, onSelect }, ref) {
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
        <Text style={styles.title}>{t("settings.languageSheetTitle")}</Text>
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
