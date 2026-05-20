/**
 * @format
 */

import 'react-native-gesture-handler';
import '@react-native-firebase/app';
import './src/notifications/notificationSetup';
import './src/crashLogger/crashLoggerSetup';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
