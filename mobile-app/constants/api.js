import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

// Safely extract the exact IP address the Metro bundler is using by reading the expo config hostUri or bundle URL.
// This is mathematically guaranteed to be correct for physical devices on ANY Wi-Fi network.
let DEV_IP = '10.0.2.2'; 

if (__DEV__) {
  let host = Constants.expoConfig?.hostUri;
  if (host) {
    host = host.split(':')[0];
    if (host) {
      DEV_IP = host;
    }
  } else {
    const scriptURL = NativeModules.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/([^:\/]+)/);
      if (match && match[1]) {
        DEV_IP = match[1];
      }
    }
  }

  // If resolved to localhost loopback on Android emulator, redirect to 10.0.2.2 loopback tunnel
  if ((DEV_IP === 'localhost' || DEV_IP === '127.0.0.1') && Platform.OS === 'android') {
    DEV_IP = '10.0.2.2';
  }
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${DEV_IP}:4000/api`;
export const OCR_BASE_URL = process.env.EXPO_PUBLIC_OCR_URL || `http://${DEV_IP}:8000`;
