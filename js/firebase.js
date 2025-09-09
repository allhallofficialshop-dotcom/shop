// Firebase core (shared)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export const firebaseConfig = {
  apiKey: "AIzaSyD2-n2E63mxeYwQBfyIDd-OmRMQzu3z9xw",
  authDomain: "all-hall-shop.firebaseapp.com",
  databaseURL: "https://all-hall-shop-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "all-hall-shop",
  storageBucket: "all-hall-shop.appspot.com",
  messagingSenderId: "741136437274",
  appId: "1:741136437274:web:86931f347cd0127faf81a3",
};
export const app = initializeApp(firebaseConfig);
export const db  = getDatabase(app);

// Cloudinary
export const CLOUD_NAME = "dzgsde4su";
export const PRODUCT_PRESET = "allhall_product";     // folder: product/
export const RECEIPT_PRESET = "allhall_receipts";    // folder: receipts/
export const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
