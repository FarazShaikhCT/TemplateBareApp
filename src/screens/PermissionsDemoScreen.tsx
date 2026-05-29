import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "../theme/useThemedStyles";
import { usePermission } from "../permissions";
import type { PermissionKey, PermissionStatus } from "../permissions/types";
import { CONFIGURED_PERMISSIONS } from "../permissions/configuredPermissions";
import { AppColors } from "../theme/AppColors";

interface PermissionRowProps {
  label: string;
  permissionKey: PermissionKey;
}

function statusColor(
  status: PermissionStatus | null,
  colors: AppColors,
): string {
  switch (status) {
    case "granted":
      return colors.success;
    case "blocked":
      return colors.error;
    case "denied":
      return colors.secondary;
    default:
      return colors.text2;
  }
}

function PermissionRow({ label, permissionKey }: PermissionRowProps) {
  const { status, isLoading, request, openSettings } =
    usePermission(permissionKey);

  const styles = useThemedStyles(colors => ({
    row: {
      width: "100%" as const,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.inputBoxColor,
      marginBottom: 10,
    },
    label: {
      fontSize: 15,
      fontWeight: "500" as const,
      color: colors.primary,
      flex: 1,
    },
    statusText: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: statusColor(status, colors),
      marginRight: 12,
    },
    button: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    buttonText: {
      color: colors.textOnPrimary,
      fontSize: 13,
      fontWeight: "600" as const,
    },
  }));

  const handlePress = () => {
    if (status === "blocked") {
      openSettings();
    } else {
      request();
    }
  };

  const actionLabel =
    status === "granted"
      ? "Granted"
      : status === "blocked"
      ? "Open Settings"
      : "Request";

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {isLoading ? (
        <ActivityIndicator size="small" style={{ marginRight: 12 }} />
      ) : (
        <Text style={styles.statusText}>{status ?? "—"}</Text>
      )}
      <Pressable
        style={styles.button}
        onPress={handlePress}
        disabled={status === "granted" || isLoading}
      >
        <Text style={styles.buttonText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

export function PermissionsDemoScreen() {
  const styles = useThemedStyles(colors => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      padding: 20,
      paddingBottom: 60,
    },
    title: {
      fontSize: 28,
      fontWeight: "700" as const,
      color: colors.text1,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.text2,
      marginBottom: 28,
      lineHeight: 20,
    },
    sectionHeading: {
      fontSize: 12,
      fontWeight: "600" as const,
      color: colors.text2,
      textTransform: "uppercase" as const,
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    placeholder: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.inputBoxColor,
    },
    placeholderText: {
      fontSize: 14,
      color: colors.text2,
      lineHeight: 20,
    },
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Permissions</Text>
        <Text style={styles.subtitle}>
          Check and request runtime permissions. Tap a button to request access
          or open Settings when a permission is blocked.
        </Text>
        <Text style={styles.sectionHeading}>Runtime Permissions</Text>
        {CONFIGURED_PERMISSIONS.length > 0 ? (
          CONFIGURED_PERMISSIONS.map(({ label, key }) => (
            <PermissionRow key={key} label={label} permissionKey={key} />
          ))
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              No permissions configured. Open{" "}
              <Text style={{ fontWeight: "700" }}>
                src/permissions/configuredPermissions.ts
              </Text>{" "}
              and add entries to{" "}
              <Text style={{ fontWeight: "700" }}>CONFIGURED_PERMISSIONS</Text>,
              then extend{" "}
              <Text style={{ fontWeight: "700" }}>PermissionKey</Text> in{" "}
              <Text style={{ fontWeight: "700" }}>
                src/permissions/types.ts
              </Text>{" "}
              and add the platform mapping in{" "}
              <Text style={{ fontWeight: "700" }}>
                src/permissions/PermissionsManager.ts
              </Text>
              .
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
