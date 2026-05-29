import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ToastConfig } from "./types";

interface ToastProps {
  config: ToastConfig | null;
  onDismiss: () => void;
}

export function Toast({ config, onDismiss }: ToastProps) {
  const insets = useSafeAreaInsets();
  const [animation] = useState(new Animated.Value(0));
  const [opacity] = useState(new Animated.Value(0));

  const dismissToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [animation, opacity, onDismiss]);

  useEffect(() => {
    if (config) {
      Animated.parallel([
        Animated.spring(animation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 40,
          friction: 7,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        dismissToast();
      }, config.duration || 3000);

      return () => clearTimeout(timer);
    } else {
      animation.setValue(0);
      opacity.setValue(0);
    }
  }, [config, animation, opacity, dismissToast]);

  if (!config) return null;

  const position = config.position || "top";
  const iconColor = getIconColor(config.type || "info");

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: position === "bottom" ? [100, 0] : [-100, 0],
  });

  const positionStyle =
    position === "bottom"
      ? { bottom: insets.bottom + 16 }
      : { top: insets.top + 16 };

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <Pressable onPress={dismissToast} style={styles.content}>
        <View style={[styles.icon, { backgroundColor: iconColor }]}>
          <Text style={styles.iconText}>{getIcon(config.type || "info")}</Text>
        </View>
        <View style={styles.textContainer}>
          {config.title ? (
            <Text style={styles.title}>{config.title}</Text>
          ) : null}
          <Text style={styles.message}>{config.message}</Text>
        </View>
        {config.action && (
          <Pressable
            onPress={() => {
              config.action?.onPress?.();
              dismissToast();
            }}
            style={styles.actionButton}
          >
            <Text style={[styles.actionText, { color: iconColor }]}>
              {config.action.text}
            </Text>
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

function getIcon(type: string): string {
  switch (type) {
    case "success":
      return "✓";
    case "error":
      return "✕";
    case "warning":
      return "!";
    case "info":
    default:
      return "i";
  }
}

function getIconColor(type: string): string {
  switch (type) {
    case "success":
      return "#4CAF50";
    case "error":
      return "#F44336";
    case "warning":
      return "#FF9800";
    case "info":
    default:
      return "#2196F3";
  }
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 18,
  },
  actionButton: {
    marginLeft: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
