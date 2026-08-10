<<<<<<< HEAD
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBvcrVMewNRE3dAtZdZFD8AuKr4PU0if9g",
  authDomain: "mcqgyaanai.firebaseapp.com",
  projectId: "mcqgyaanai",
  storageBucket: "mcqgyaanai.appspot.com", // ✅ FIXED
  messagingSenderId: "402793674945",
  appId: "1:402793674945:web:dd19b144ed66b7d09dbc40",
  measurementId: "G-ZNEWJXL41Q",
};

// ✅ Initialize Firebase only once
export const app = initializeApp(firebaseConfig);

// ✅ Services you ACTUALLY need
export const auth = getAuth(app);
export const db = getFirestore(app);

// ✅ Analytics (safe for Vite / browser only)
isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  }
});
=======
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBvcrVMewNRE3dAtZdZFD8AuKr4PU0if9g",
  authDomain: "mcqgyaanai.firebaseapp.com",
  projectId: "mcqgyaanai",
  storageBucket: "mcqgyaanai.appspot.com", // ✅ FIXED
  messagingSenderId: "402793674945",
  appId: "1:402793674945:web:dd19b144ed66b7d09dbc40",
  measurementId: "G-ZNEWJXL41Q",
};

// ✅ Initialize Firebase only once
export const app = initializeApp(firebaseConfig);

// ✅ Services you ACTUALLY need
export const auth = getAuth(app);
export const db = getFirestore(app);

// ✅ Analytics (safe for Vite / browser only)
isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  }
});
>>>>>>> fb6ac06a10fc66af0329ecd63713bd2c4019a9ed
