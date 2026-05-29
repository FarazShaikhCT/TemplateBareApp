import type { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import i18n from "i18next";
import React, { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { ProfileStackParamList } from "../../navigation/types";
import { changeAppLanguage } from "../../third-party/i18n/changeAppLanguage";
import { getDeviceLanguageTag } from "../../third-party/i18n/getDeviceLanguageTag";
import { matchSupportedLanguage } from "../../third-party/i18n/supportedLanguages";
import { localStorageImpl } from "../../third-party/localstorage/LocalStorageImpl";
import { useThemedStyles } from "../../theme/useThemedStyles";
import { useSettingsRemoteFlags } from "../../settings/useSettingsRemoteFlags";

import {
  LanguagePickerBottomSheet,
  type LanguagePickerOption,
} from "./LanguagePickerBottomSheet";
import {
  ThemePickerBottomSheet,
  type ThemePickerOption,
} from "./ThemePickerBottomSheet";
import { TopBar } from "../../components/TopBar";
import { APP_DISPLAY_NAME } from "../../config/appDisplayName";
import { useAppTheme } from "../../theme/ThemeContext";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = NativeStackScreenProps<ProfileStackParamList, "Settings">;

function resolveLanguageSelectionKey(): LanguagePickerOption {
  const stored = localStorageImpl.getStringValue("app.locale");
  if (!stored) {
    return "device";
  }
  if (stored === "es") {
    return "es";
  }
  return "en";
}

export function SettingsScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { showLanguagePicker, showThemeToggle } = useSettingsRemoteFlags();
  const { colors, themePreference, setTheme } = useAppTheme();
  const languageSheetRef = useRef<BottomSheetModalMethods>(null);
  const themeSheetRef = useRef<BottomSheetModalMethods>(null);

  const styles = useThemedStyles(colors => ({
    container: {
      flex: 1,
      padding: 16,
      gap: 10,
      backgroundColor: colors.background,
    },
    title: { fontSize: 22, fontWeight: "700", color: colors.text1 },
    meta: { fontSize: 16, color: colors.text2 },
    sectionLabel: {
      fontSize: 16,
      fontWeight: "600",
      marginTop: 8,
      marginBottom: 8,
      color: colors.text1,
    },
    languageTrigger: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.primaryLight,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 8,
    },
    languageTriggerText: {
      color: colors.textOnSecondary,
      fontWeight: "600",
      flex: 1,
    },
    languageTriggerChevron: {
      color: colors.textOnSecondary,
      fontSize: 20,
      fontWeight: "600",
      marginLeft: 8,
    },
    btn: {
      backgroundColor: colors.secondary,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 8,
    },
    btnText: { color: colors.textOnSecondary, fontWeight: "600" },
    settingsTriggers: {
      gap: 10,
    },
  }));

  const from = route.params?.from;

  const selectedKey = resolveLanguageSelectionKey();
  const triggerLabel =
    selectedKey === "device"
      ? t("settings.useDeviceLanguage")
      : selectedKey === "es"
      ? t("settings.languageSpanish")
      : t("settings.languageEnglish");

  const openLanguageSheet = useCallback(() => {
    languageSheetRef.current?.present();
  }, []);

  const openThemeSheet = useCallback(() => {
    themeSheetRef.current?.present();
  }, []);

  const handleLanguageSelect = useCallback((option: LanguagePickerOption) => {
    if (option === "en") {
      changeAppLanguage("en");
    } else if (option === "es") {
      changeAppLanguage("es");
    } else {
      localStorageImpl.removeValue("app.locale");
      // eslint-disable-next-line import/no-named-as-default-member -- i18next default instance
      i18n
        .changeLanguage(matchSupportedLanguage(getDeviceLanguageTag()))
        .catch(() => {});
    }
    languageSheetRef.current?.dismiss();
  }, []);

  const handleThemeSelect = useCallback(
    (option: ThemePickerOption) => {
      setTheme(option);
      themeSheetRef.current?.dismiss();
    },
    [setTheme],
  );

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={styles.container}>
      <TopBar
        topBarTitle={APP_DISPLAY_NAME}
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.settingsTriggers}>
        {showLanguagePicker ? (
          <Pressable
            accessibilityRole="button"
            style={styles.languageTrigger}
            onPress={openLanguageSheet}
          >
            <Text style={styles.languageTriggerText}>
              {t("settings.language")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text1} />
          </Pressable>
        ) : null}
        {showThemeToggle ? (
          <Pressable
            accessibilityRole="button"
            style={styles.languageTrigger}
            onPress={openThemeSheet}
          >
            <Text style={styles.languageTriggerText}>
              {t("settings.theme")}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text1} />
          </Pressable>
        ) : null}
      </View>

      {showLanguagePicker ? (
        <LanguagePickerBottomSheet
          ref={languageSheetRef}
          selectedKey={selectedKey}
          onSelect={handleLanguageSelect}
        />
      ) : null}
      {showThemeToggle ? (
        <ThemePickerBottomSheet
          ref={themeSheetRef}
          selectedKey={themePreference}
          onSelect={handleThemeSelect}
        />
      ) : null}
    </SafeAreaView>
  );
}
