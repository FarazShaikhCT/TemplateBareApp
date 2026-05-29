import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import type { HomeStackParamList } from "../../navigation/types";
import { useAppTheme } from "../../theme/ThemeContext";
import { useThemedStyles } from "../../theme/useThemedStyles";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeDetail">;

export function HomeDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(c => ({
    container: {
      flex: 1,
      padding: 16,
      gap: 10,
      backgroundColor: c.background,
    },
    title: { fontSize: 22, fontWeight: "700", color: c.text1 },
    meta: { fontSize: 16, color: c.text2 },
    btn: {
      backgroundColor: c.success,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 8,
    },
    btnText: { color: c.textOnPrimary, fontWeight: "600" },
  }));

  const { itemId, title } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("homeDetail.title")}</Text>
      <Text style={styles.meta}>{t("homeDetail.itemId", { id: itemId })}</Text>
      {title ? (
        <Text style={styles.meta}>{t("homeDetail.titleMeta", { title })}</Text>
      ) : null}

      <Pressable style={styles.btn} onPress={() => navigation.goBack()}>
        <Text style={styles.btnText}>{t("homeDetail.goBack")}</Text>
      </Pressable>

      <Pressable style={styles.btn} onPress={() => navigation.popToTop()}>
        <Text style={styles.btnText}>{t("homeDetail.popToTop")}</Text>
      </Pressable>

      <Pressable
        style={styles.btn}
        onPress={() => navigation.replace("HomeMain")}
        android_ripple={{ color: colors.grayBackground }}
      >
        <Text style={styles.btnText}>{t("homeDetail.replaceMain")}</Text>
      </Pressable>

      <Pressable
        style={styles.btn}
        onPress={() =>
          navigation.setParams({ title: t("homeDetail.updatedTitle") })
        }
      >
        <Text style={styles.btnText}>{t("homeDetail.setParams")}</Text>
      </Pressable>
    </View>
  );
}
