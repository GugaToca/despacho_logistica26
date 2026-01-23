// js/firebase.js

// Importações Firebase (SDK modular v9)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyARSwboGJ9TVrxec2NpL_oR1HHA7yhvdXk",
  authDomain: "gestao-logistica-2fce5.firebaseapp.com",
  projectId: "gestao-logistica-2fce5",
  storageBucket: "gestao-logistica-2fce5.firebasestorage.app",
  messagingSenderId: "695950531643",
  appId: "1:695950531643:web:84f0e1c66f59ef4f61901e"
};

// Inicializa o app
export const app = initializeApp(firebaseConfig);

// Serviços que o sistema vai usar
export const auth = getAuth(app);
export const db = getFirestore(app);
