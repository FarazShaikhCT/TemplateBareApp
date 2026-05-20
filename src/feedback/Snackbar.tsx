import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, Animated, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SnackbarConfig } from './types';

interface SnackbarProps {
  config: SnackbarConfig | null;
  onDismiss: () => void;
}

export function Snackbar({ config, onDismiss }: SnackbarProps) {
  const insets = useSafeAreaInsets();
  const [animation] = useState(new Animated.Value(0));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissSnackbar = useCallback(() => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  }, [animation, onDismiss]);

  useEffect(() => {
    if (config) {
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }).start();

      // Auto-dismiss only if duration > 0
      const duration = config.duration ?? 3000;
      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          dismissSnackbar();
        }, duration);
      }

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    } else {
      animation.setValue(0);
    }
  }, [config, animation, dismissSnackbar]);

  if (!config) return null;

  const position = config.position || 'bottom';
  const backgroundColor = getBackgroundColor(config.type || 'info');

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: position === 'bottom' ? [100, 0] : [-100, 0],
  });

  const positionStyle =
    position === 'bottom'
      ? { bottom: insets.bottom + 16 }
      : { top: insets.top + 16 };

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        { backgroundColor, transform: [{ translateY }] },
      ]}
    >
      <Pressable onPress={dismissSnackbar} style={styles.content}>
        <Text style={styles.message}>{config.message}</Text>
        {config.action && (
          <Pressable
            onPress={() => {
              config.action?.onPress?.();
              dismissSnackbar();
            }}
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>{config.action.text}</Text>
          </Pressable>
        )}
      </Pressable>
    </Animated.View>
  );
}

function getBackgroundColor(type: string): string {
  switch (type) {
    case 'success':
      return '#4CAF50';
    case 'error':
      return '#F44336';
    case 'warning':
      return '#FF9800';
    case 'info':
    default:
      return '#2196F3';
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
