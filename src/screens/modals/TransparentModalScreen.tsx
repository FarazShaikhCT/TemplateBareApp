import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../../navigation/types";
import { useThemedStyles } from "../../theme/useThemedStyles";

type Props = NativeStackScreenProps<RootStackParamList, "TransparentModal">;

export function TransparentModalScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(colors => ({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      padding: 24,
    },
    dismissHitbox: {
      ...StyleSheet.absoluteFillObject,
    },
    card: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      gap: 12,
    },
    title: { fontSize: 18, fontWeight: "700", color: colors.text1 },
    meta: { fontSize: 15, color: colors.text2 },
    btn: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    btnText: { color: colors.textOnPrimary, fontWeight: "600" },
  }));

  const message = route.params?.message;

  return (
    <View style={styles.backdrop}>
      <Pressable
        style={styles.dismissHitbox}
        onPress={() => navigation.goBack()}
      />
      <View style={styles.card}>
        <Text style={styles.title}>{t("transparentModal.title")}</Text>
        {message ? <Text style={styles.meta}>{message}</Text> : null}
        <Pressable style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>{t("transparentModal.close")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
