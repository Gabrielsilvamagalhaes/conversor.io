import "server-only";
import { z } from "zod";

/**
 * Validação das variáveis de ambiente do Firebase Admin (server-only).
 *
 * Lazy + memoizado: a validação só roda na primeira chamada (em runtime), nunca
 * no momento do `import`. Assim o `next build` não quebra quando o `.env.local`
 * ainda tem placeholders, e o erro só aparece quando uma rota realmente usa o Admin SDK.
 */
const firebaseAdminEnvSchema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID is required"),
  FIREBASE_CLIENT_EMAIL: z.string().min(1, "FIREBASE_CLIENT_EMAIL is required"),
  FIREBASE_PRIVATE_KEY: z.string().min(1, "FIREBASE_PRIVATE_KEY is required"),
});

export type FirebaseAdminEnv = z.infer<typeof firebaseAdminEnvSchema>;

let cached: FirebaseAdminEnv | null = null;

export function loadFirebaseAdminEnv(): FirebaseAdminEnv {
  if (cached) return cached;

  const parsed = firebaseAdminEnvSchema.safeParse({
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    // A chave costuma vir com `\n` escapado (uma linha no .env) — normaliza para quebras reais.
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  });

  if (!parsed.success) {
    throw new Error(`Invalid Firebase admin environment:\n${z.prettifyError(parsed.error)}`);
  }

  cached = parsed.data;
  return cached;
}
