import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDs4vMexj0m8e1qhLZehaUx8m5avhGXMiA",
  authDomain: "record-management-system-db083.firebaseapp.com",
  projectId: "record-management-system-db083",
  storageBucket: "record-management-system-db083.firebasestorage.app",
  messagingSenderId: "813186728948",
  appId: "1:813186728948:web:838a90146a3d44adb82fa1",
  measurementId: "G-R5F9GRW934"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
