import type { DrawerScreenProps } from "@react-navigation/drawer";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { DrawerParamList } from "../../navigation/types";
import { useThemedStyles } from "../../theme/useThemedStyles";

type Props = DrawerScreenProps<DrawerParamList, "About">;

export function AboutDrawerScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(
    colors => ({
      container: {
        flex: 1,
        padding: 16,
        gap: 10,
        backgroundColor: colors.background,
        paddingTop: 16 + insets.top,
      },
      title: { fontSize: 22, fontWeight: "700", color: colors.text1 },
      caption: { fontSize: 14, opacity: 0.7, color: colors.text2 },
      btn: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 8,
      },
      btnText: { color: colors.textOnPrimary, fontWeight: "600" },
    }),
    [insets.top],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("aboutDrawer.title")}</Text>
      <Text style={styles.caption}>{t("aboutDrawer.caption")}</Text>
      <Pressable
        style={styles.btn}
        onPress={() =>
          navigation.navigate("TabRoot", {
            screen: "HomeTab",
            params: { screen: "HomeMain" },
          })
        }
      >
        <Text style={styles.btnText}>{t("aboutDrawer.goTabs")}</Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={() => navigation.closeDrawer()}>
        <Text style={styles.btnText}>{t("aboutDrawer.closeDrawer")}</Text>
      </Pressable>
    </View>
  );
}
