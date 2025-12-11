import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDs4vMexj0m8e1qhLZehaUx8m5avhGXMiA",
  authDomain: "record-management-system-db083.firebaseapp.com",
  projectId: "record-management-system-db083",
  storageBucket: "record-management-system-db083.firebasestorage.app",
  messagingSenderId: "813186728948",
  appId: "1:813186728948:web:838a90146a3d44adb82fa1",
  measurementId: "G-R5F9GRW934"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
