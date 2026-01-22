// js/auth.js
import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

export function requireAuthOrRedirect() {
  onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "login.html";
  });
}

export function bindAuthHeader() {
  const $user = document.querySelector("#userName");
  const $logout = document.querySelector("#btnLogout");

  onAuthStateChanged(auth, (user) => {
    if (user && $user) $user.textContent = user.displayName || user.email || "Usuário";
  });

  if ($logout) {
    $logout.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "login.html";
    });
  }
}

export async function login(email, senha) {
  await signInWithEmailAndPassword(auth, email, senha);
}

export async function register(nome, email, senha) {
  const cred = await createUserWithEmailAndPassword(auth, email, senha);
  await updateProfile(cred.user, { displayName: nome });
}
