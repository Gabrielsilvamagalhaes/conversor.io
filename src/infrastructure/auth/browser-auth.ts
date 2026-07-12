import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirebaseAuth } from "@/infrastructure/auth/firebase-client";

/**
 * Helpers de autenticação do lado do browser. Cada login obtém o ID token do
 * Firebase e o troca por um session cookie httpOnly via `POST /api/auth/session`.
 * Devem ser chamados apenas em Client Components.
 */
async function exchangeIdTokenForSession(idToken: string): Promise<void> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    throw new Error("Falha ao criar a sessão.");
  }
}

export async function signInWithGoogle(): Promise<void> {
  const credential = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
  await exchangeIdTokenForSession(await credential.user.getIdToken());
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  await exchangeIdTokenForSession(await credential.user.getIdToken());
}

export async function registerWithEmail(email: string, password: string): Promise<void> {
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  await exchangeIdTokenForSession(await credential.user.getIdToken());
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
  await signOut(getFirebaseAuth());
}
