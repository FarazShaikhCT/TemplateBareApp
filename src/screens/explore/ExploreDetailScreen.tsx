import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import type { ExploreStackParamList } from "../../navigation/types";
import { useThemedStyles } from "../../theme/useThemedStyles";

type Props = NativeStackScreenProps<ExploreStackParamList, "ExploreDetail">;

export function ExploreDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(colors => ({
    container: {
      flex: 1,
      padding: 16,
      gap: 10,
      backgroundColor: colors.background,
    },
    title: { fontSize: 20, fontWeight: "700", color: colors.text1 },
    btn: {
      backgroundColor: colors.secondary,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 8,
    },
    btnText: { color: colors.textOnSecondary, fontWeight: "600" },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {t("exploreDetail.title", { section: route.params.section })}
      </Text>
      <Pressable style={styles.btn} onPress={() => navigation.pop()}>
        <Text style={styles.btnText}>{t("exploreDetail.pop")}</Text>
      </Pressable>
    </View>
  );
}
