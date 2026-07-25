import "server-only";
import { type Firestore, getFirestore } from "firebase-admin/firestore";
import { getAdminApp } from "@/infrastructure/auth/firebase-admin";

let db: Firestore | null = null;

/**
 * Instância do Firestore (Admin SDK), memoizada e reaproveitando o mesmo app
 * inicializado em `firebase-admin.ts` (mesma service account do Auth).
 *
 * `ignoreUndefinedProperties: true` evita que campos `undefined` (ex.: opcionais
 * não preenchidos) quebrem o `set`/`update` — só precisamos nos preocupar com `null`.
 * `settings()` só pode ser chamado uma vez, antes de qualquer outra operação (o tipo
 * `FirestoreSettings` exposto por `initializeFirestore` no `firebase-admin` desta versão
 * não inclui essa opção; `Firestore#settings()`, do `@google-cloud/firestore` subjacente,
 * inclui). Em dev, HMR pode reexecutar este módulo com um `db` local zerado enquanto a
 * instância do Firestore (cacheada no app singleton) já foi configurada — por isso o
 * try/catch: a segunda chamada a `settings()` reaproveita a instância existente.
 */
export function getFirestoreDb(): Firestore {
  if (db) return db;

  const instance = getFirestore(getAdminApp());
  try {
    instance.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Já inicializado — instância existente (e suas settings) é reaproveitada.
  }
  db = instance;
  return db;
}
