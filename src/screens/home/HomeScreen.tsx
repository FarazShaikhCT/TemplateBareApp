import { DrawerActions } from "@react-navigation/native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { TopBar } from "../../components/TopBar";
import { APP_DISPLAY_NAME } from "../../config/appDisplayName";
import { navigationRef } from "../../navigation/navigationRef";
import type { HomeMainCompositeProps } from "../../navigation/screenTypes";
import { useThemedStyles } from "../../theme/useThemedStyles";

type Props = HomeMainCompositeProps;

export function HomeScreen({ navigation }: Props) {
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
      caption: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 8,
        color: colors.text2,
      },
      btn: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 8,
      },
      btnText: { color: colors.textOnPrimary, fontWeight: "600" },
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
        <Text style={styles.title}>{t("home.title")}</Text>
        <Text style={styles.caption}>{t("home.caption")}</Text>
        <Text style={styles.caption}>
          Media player (drawer): HLS / DRM demos, download queue with
          notifications, offline MP4 playback, and PiP.
        </Text>

        <Pressable
          style={styles.btn}
          onPress={() =>
            navigation.navigate("HomeDetail", {
              itemId: "42",
              title: t("home.demoItemTitle"),
            })
          }
        >
          <Text style={styles.btnText}>{t("home.navigateDetail")}</Text>
        </Pressable>

        <Pressable
          style={styles.btn}
          onPress={() => navigation.push("HomeMain")}
        >
          <Text style={styles.btnText}>{t("home.pushDuplicate")}</Text>
        </Pressable>

        <Pressable
          style={styles.btn}
          onPress={() =>
            navigation.navigate("ExploreTab", {
              screen: "ExploreMain",
            })
          }
        >
          <Text style={styles.btnText}>{t("home.jumpExplore")}</Text>
        </Pressable>

        <Pressable
          style={styles.btn}
          onPress={() =>
            navigation.navigate("ProfileTab", {
              screen: "Settings",
              params: { from: "Home" },
            })
          }
        >
          <Text style={styles.btnText}>{t("home.openSettings")}</Text>
        </Pressable>

        <Pressable
          style={styles.btn}
          onPress={() => navigationRef.navigate("ExampleModal")}
        >
          <Text style={styles.btnText}>{t("home.rootModal")}</Text>
        </Pressable>

        <Pressable
          style={styles.btn}
          onPress={() =>
            navigationRef.navigate("TransparentModal", {
              message: t("home.fromHomeMessage"),
            })
          }
        >
          <Text style={styles.btnText}>{t("home.transparentModal")}</Text>
        </Pressable>

        <Pressable
          style={styles.btn}
          onPress={() => navigationRef.navigate("FullScreenModal")}
        >
          <Text style={styles.btnText}>{t("home.fullScreenModal")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
