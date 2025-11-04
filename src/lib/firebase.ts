import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBdjvf6GBRG2pbwE0EXFmulP7dsvs6Mv18",
  authDomain: "syntaxtual-4e014.firebaseapp.com",
  projectId: "syntaxtual-4e014",
  storageBucket: "syntaxtual-4e014.firebasestorage.app",
  messagingSenderId: "181659641057",
  appId: "1:181659641057:web:9e3462b1a848d5b58803a0",
  measurementId: "G-HG3XFM4ZZ7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
