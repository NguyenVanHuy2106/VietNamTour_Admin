// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDialn9c8AR8qHCz8zdSRbe2zg-X_HEgao",
  authDomain: "core-pilates-e0144.firebaseapp.com",
  projectId: "core-pilates-e0144",
  storageBucket: "core-pilates-e0144.firebasestorage.app",
  messagingSenderId: "316052676209",
  appId: "1:316052676209:web:7a59f99815ac2f3fb545d0",
  measurementId: "G-Q4T8JZ17SJ",
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
