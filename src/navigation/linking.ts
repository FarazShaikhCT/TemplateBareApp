import type { LinkingOptions } from '@react-navigation/native';
import { Linking } from 'react-native';

import type { RootStackParamList } from './types';

/**
 * Deep linking config. Test with:
 * npx uri-scheme open templatebareapp://home --ios
 * Adjust prefixes to match your app scheme (see app.json / native config).
 */
export const deepLinkSchemePrefix = 'templatebareapp://';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [deepLinkSchemePrefix],
  async getInitialURL() {
    return Linking.getInitialURL();
  },
  subscribe(listener) {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      listener(url);
    });
    return () => subscription.remove();
  },
  config: {
    screens: {
      Main: {
        screens: {
          TabRoot: {
            screens: {
              HomeTab: {
                screens: {
                  HomeMain: 'home',
                  HomeDetail: 'home/detail/:itemId',
                },
              },
              ExploreTab: {
                screens: {
                  ExploreMain: 'explore',
                  ExploreDetail: 'explore/detail/:section',
                },
              },
              ProfileTab: {
                screens: {
                  ProfileMain: 'profile',
                  Settings: 'profile/settings',
                },
              },
              PostsTab: {
                screens: {
                  PostsMain: 'posts',
                },
              },
            },
          },
          About: 'about',
          NotificationsCatalog: 'notifications',
          CarouselCatalog: 'carousel',
        },
      },
      ExampleModal: 'modal/presentation',
      TransparentModal: 'modal/transparent',
      FullScreenModal: 'modal/fullscreen',
    },
  },
};
