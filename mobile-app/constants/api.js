import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

const PROD_API_URL = 'https://bhb-api.onrender.com/api';
const PROD_OCR_URL = 'https://bhb-ocr.onrender.com';

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

  if ((DEV_IP === 'localhost' || DEV_IP === '127.0.0.1') && Platform.OS === 'android') {
    DEV_IP = '10.0.2.2';
  }
}

const extra = Constants.expoConfig?.extra || {};
const localDevUrl = `http://${DEV_IP}:4000/api`;

// syncWithProduction: mobile bookings & records go to the same MongoDB as the deployed web app
const syncWithProduction = extra.syncWithProduction === true;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (syncWithProduction ? PROD_API_URL : null) ||
  (__DEV__ ? localDevUrl : PROD_API_URL);

export const OCR_BASE_URL =
  process.env.EXPO_PUBLIC_OCR_URL ||
  extra.ocrUrl ||
  (syncWithProduction ? PROD_OCR_URL : null) ||
  (__DEV__ ? `http://${DEV_IP}:8000` : PROD_OCR_URL);

export const LOCAL_OCR_BASE_URL = `http://${DEV_IP}:8000`;
