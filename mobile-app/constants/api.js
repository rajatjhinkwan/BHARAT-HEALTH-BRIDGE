import { Platform } from 'react-native';

// Your machine's local IP address (detected from system)
// Use this so physical devices and emulators can both connect
const MACHINE_IP = '10.148.13.85'; 
const LOCALHOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

// On physical devices, use MACHINE_IP. On emulators, LOCALHOST is often preferred.
// If you face issues on emulator, change the host below to LOCALHOST.
const HOST = MACHINE_IP; 

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || `http://${HOST}:4000/api`;
export const OCR_BASE_URL = process.env.EXPO_PUBLIC_OCR_URL || `http://${HOST}:8000`;
