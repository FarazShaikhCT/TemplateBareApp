import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';

import { useAppTheme } from '../theme/ThemeContext';
import { linking } from './linking';
import { navigationRef } from './navigationRef';
import { RootNavigator } from './RootNavigator';

export function ThemedNavigationContainer() {
  const { theme, navigationTheme } = useAppTheme();

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navigationTheme}
      linking={linking}
    >
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        translucent={false}
        backgroundColor="transparent"
      />
      <RootNavigator />
    </NavigationContainer>
  );
}
