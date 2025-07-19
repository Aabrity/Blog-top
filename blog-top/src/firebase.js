// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "ratojhanda-7cb12.firebaseapp.com",
  projectId: "ratojhanda-7cb12",
  storageBucket: "ratojhanda-7cb12.firebasestorage.app",
  messagingSenderId: "964433987016",
  appId: "1:964433987016:web:60e64dfde7ed15f727acfd"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
