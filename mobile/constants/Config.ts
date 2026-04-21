// ─── App configuration ──────────────────────────────────────
// For local dev, use your machine's IP if testing on a real device.
// "localhost" works for iOS simulator.

import { Platform } from "react-native";

const LOCAL_IP = "localhost"; // Change to your machine IP for real device

export const API_BASE_URL =
  Platform.OS === "android"
    ? `http://10.0.2.2:3000`     // Android emulator → host machine
    : `http://${LOCAL_IP}:3000`; // iOS simulator or real device
