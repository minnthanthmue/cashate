import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCi4uJBE4NCZpc7flyO4e51mzsn9rBxMHM",
  authDomain: "n8n-project-495802.firebaseapp.com",
  projectId: "n8n-project-495802",
  storageBucket: "n8n-project-495802.firebasestorage.app",
  messagingSenderId: "126942038276",
  appId: "1:126942038276:web:9f7736c018424aa6412851",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
