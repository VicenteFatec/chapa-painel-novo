import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBOzvTb9IAQ2-x9JhZq2cE1x-KtBK9wucE",
  authDomain: "chapa-amigo-empresas.firebaseapp.com",
  projectId: "chapa-amigo-empresas",
  
  // AQUI ESTÁ A CORREÇÃO FINAL:
  storageBucket: "chapa-amigo-empresas.firebasestorage.app",

  messagingSenderId: "912991691952",
  appId: "1:912991691952:web:339b7883ee6aee528c8775",
  measurementId: "G-SRM8HCL53Z"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };