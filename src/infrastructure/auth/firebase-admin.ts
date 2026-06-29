import "server-only";
import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { type Auth, getAuth } from "firebase-admin/auth";
import { loadFirebaseAdminEnv } from "@/di/env";

/** Inicializa (uma única vez) o Firebase Admin app com a service account. */
function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0] as App;

  const env = loadFirebaseAdminEnv();
  return initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    }),
  });
}

/** Instância do Firebase Admin Auth — usar apenas no server (Node runtime). */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}
