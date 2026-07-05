import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9HTzMctgzHPHZDkARjbcIlACemnluWSE",
  authDomain: "spinstream-1e0a1.firebaseapp.com",
  projectId: "spinstream-1e0a1",
  storageBucket: "spinstream-1e0a1.firebasestorage.app",
  messagingSenderId: "636517926777",
  appId: "1:636517926777:web:dd8a9834a5b1dd6eb851a8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
