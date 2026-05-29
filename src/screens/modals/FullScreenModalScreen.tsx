import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import type { RootStackParamList } from "../../navigation/types";
import { useThemedStyles } from "../../theme/useThemedStyles";

type Props = NativeStackScreenProps<RootStackParamList, "FullScreenModal">;

export function FullScreenModalScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(colors => ({
    container: {
      flex: 1,
      padding: 24,
      justifyContent: "center",
      gap: 12,
      backgroundColor: colors.background,
    },
    title: { fontSize: 20, fontWeight: "700", color: colors.text1 },
    caption: { fontSize: 14, opacity: 0.7, color: colors.text2 },
    btn: {
      backgroundColor: colors.secondary,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: "center",
    },
    btnText: { color: colors.textOnSecondary, fontWeight: "600" },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("fullScreenModal.title")}</Text>
      <Text style={styles.caption}>{t("fullScreenModal.caption")}</Text>
      <Pressable style={styles.btn} onPress={() => navigation.goBack()}>
        <Text style={styles.btnText}>{t("fullScreenModal.dismiss")}</Text>
      </Pressable>
    </View>
  );
}
