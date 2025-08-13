// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDQNkRMvrT0teoqnRp0Ar6NBhQNxM9COQE",
  authDomain: "doctor-patient-pro-83d1a.firebaseapp.com",
  projectId: "doctor-patient-pro-83d1a",
  storageBucket: "doctor-patient-pro-83d1a.firebasestorage.app",
  messagingSenderId: "545133155859",
  appId: "1:545133155859:web:4f881d4fcc3ca48fc151e6",
  measurementId: "G-CZ1XZKHPE3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);