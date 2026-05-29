import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import React from "react";
import { useTranslation } from "react-i18next";

import { AboutDrawerScreen } from "../screens/drawer/AboutDrawerScreen";
import type { DrawerParamList } from "./types";
import { MainTabs } from "./MainTabs";
import { SettingsScreen } from "../screens/profile/SettingsScreen";
import { MediaPlayerScreen } from "../screens/MediaPlayerScreen";
import { AnalyticsDemoScreen } from "../screens/analytics/AnalyticsDemoScreen";
import { FeedbackCatalogScreen } from "../screens/FeedbackCatalogScreen";
import { RemoteConfigScreen } from "../screens/remote-config/RemoteConfigScreen";
import { NotificationsCatalogScreen } from "../screens/NotificationsCatalogScreen";
import { CarouselCatalogScreen } from "../screens/CarouselCatalogScreen";
import { PermissionsDemoScreen } from "../screens/PermissionsDemoScreen";
import { CrashLoggerDemoScreen } from "../screens/CrashLoggerDemoScreen";

const Drawer = createDrawerNavigator<DrawerParamList>();

function MainDrawerContent(props: DrawerContentComponentProps) {
  const { state, descriptors } = props;

  const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[focusedRoute.key];
  const { drawerContentStyle, drawerContentContainerStyle } =
    focusedDescriptor.options;

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={drawerContentContainerStyle}
      style={drawerContentStyle}
    >
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

/**
 * Drawer: opens from the left; contains primary tabs and a standalone drawer screen.
 */
export function MainDrawer() {
  const { t } = useTranslation();

  return (
    <Drawer.Navigator
      drawerContent={p => <MainDrawerContent {...p} />}
      screenOptions={{
        drawerType: "front",
        headerShown: false,
      }}
    >
      <Drawer.Screen
        name="TabRoot"
        component={MainTabs}
        options={{
          title: t("drawer.tabRootTitle"),
          drawerLabel: t("drawer.tabRootLabel"),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t("drawer.settingsTitle") }}
      />
      <Drawer.Screen
        name="About"
        component={AboutDrawerScreen}
        options={{ title: t("drawer.aboutTitle") }}
      />
      <Drawer.Screen
        name="MediaPlayer"
        component={MediaPlayerScreen}
        options={{
          title: "Media player",
          drawerLabel: "Media player (HLS / DRM / offline / PiP)",
        }}
      />
      <Drawer.Screen
        name="AnalyticsDemo"
        component={AnalyticsDemoScreen}
        options={{ title: "Analytics demo", drawerLabel: "Analytics demo" }}
      />
      <Drawer.Screen
        name="FeedbackCatalog"
        component={FeedbackCatalogScreen}
        options={{ title: "Feedback", drawerLabel: "Feedback Catalog" }}
      />
      <Drawer.Screen
        name="RemoteConfig"
        component={RemoteConfigScreen}
        options={{ title: "Remote config", drawerLabel: "Remote config" }}
      />
      <Drawer.Screen
        name="NotificationsCatalog"
        component={NotificationsCatalogScreen}
        options={{
          title: "Notifications",
          drawerLabel: "Notifications Catalog",
        }}
      />
      <Drawer.Screen
        name="CarouselCatalog"
        component={CarouselCatalogScreen}
        options={{ title: "Carousel", drawerLabel: "Carousel Catalog" }}
      />
      <Drawer.Screen
        name="PermissionsDemo"
        component={PermissionsDemoScreen}
        options={{ title: "Permissions", drawerLabel: "Permissions" }}
      />
      <Drawer.Screen
        name="CrashLoggerDemo"
        component={CrashLoggerDemoScreen}
        options={{
          title: "Crash Logger demo",
          drawerLabel: "Crash Logger demo",
        }}
      />
    </Drawer.Navigator>
  );
}
