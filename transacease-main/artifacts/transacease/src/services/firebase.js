import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyCncfXx0hJywILbu5P-zPsut_v3XUwhJqw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "transactease-815f6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "transactease-815f6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "transactease-815f6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "432683804865",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:432683804865:web:938e52ccbfbf06915fcc40",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const firebaseEnabled = true;

export { app, auth, db, firebaseEnabled };
