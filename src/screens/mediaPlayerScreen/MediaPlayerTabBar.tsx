import React from 'react';
import { View, Text, Pressable } from 'react-native';

import type { MainTab } from './mediaPlayerScreen.types';

type MediaPlayerTabBarProps = Readonly<{
  mainTab: MainTab;
  onSelect: (tab: MainTab) => void;
  styles: {
    tabRow: object;
    tabBtn: object;
    tabBtnActive: object;
    tabBtnText: object;
    tabBtnTextActive: object;
  };
}>;

export function MediaPlayerTabBar({
  mainTab,
  onSelect,
  styles,
}: MediaPlayerTabBarProps) {
  return (
    <View style={styles.tabRow}>
      <Pressable
        style={[styles.tabBtn, mainTab === 'player' && styles.tabBtnActive]}
        onPress={() => onSelect('player')}
        accessibilityRole="tab"
        accessibilityState={{ selected: mainTab === 'player' }}
      >
        <Text
          style={[
            styles.tabBtnText,
            mainTab === 'player' && styles.tabBtnTextActive,
          ]}
        >
          Player
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tabBtn, mainTab === 'downloads' && styles.tabBtnActive]}
        onPress={() => onSelect('downloads')}
        accessibilityRole="tab"
        accessibilityState={{ selected: mainTab === 'downloads' }}
      >
        <Text
          style={[
            styles.tabBtnText,
            mainTab === 'downloads' && styles.tabBtnTextActive,
          ]}
        >
          Downloads
        </Text>
      </Pressable>
    </View>
  );
}
