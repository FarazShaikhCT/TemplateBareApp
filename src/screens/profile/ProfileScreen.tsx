import { CommonActions, DrawerActions } from "@react-navigation/native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { TopBar } from "../../components/TopBar";
import { APP_DISPLAY_NAME } from "../../config/appDisplayName";
import type { ProfileMainCompositeProps } from "../../navigation/screenTypes";
import { useThemedStyles } from "../../theme/useThemedStyles";

type Props = ProfileMainCompositeProps;

export function ProfileScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(
    colors => ({
      root: { flex: 1, backgroundColor: colors.background },
      container: {
        flex: 1,
        padding: 16,
        gap: 10,
        backgroundColor: colors.background,
        paddingTop: 16,
      },
      title: { fontSize: 22, fontWeight: "700", color: colors.text1 },
      btn: {
        backgroundColor: colors.secondary,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 8,
      },
      btnText: { color: colors.textOnSecondary, fontWeight: "600" },
    }),
    [],
  );

  return (
    <View style={styles.root}>
      <TopBar
        topBarTitle={APP_DISPLAY_NAME}
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />
      <View style={styles.container}>
        <Text style={styles.title}>{t("profile.title")}</Text>

        <Pressable
          style={styles.btn}
          onPress={() => navigation.navigate("Settings")}
        >
          <Text style={styles.btnText}>{t("profile.navigateSettings")}</Text>
        </Pressable>

        <Pressable
          style={styles.btn}
          onPress={() =>
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "ProfileMain" }],
              }),
            )
          }
        >
          <Text style={styles.btnText}>{t("profile.reset")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
