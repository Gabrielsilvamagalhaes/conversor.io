import "server-only";
import { ValidateUploadUseCase } from "@/application/conversion/validate-upload.use-case";
import { CreateSessionUseCase } from "@/application/identity/create-session.use-case";
import { GetSessionUseCase } from "@/application/identity/get-session.use-case";
import { RevokeSessionUseCase } from "@/application/identity/revoke-session.use-case";
import { FirebaseAuthAdapter } from "@/infrastructure/auth/firebase-auth.adapter";
import { MagicBytesDetector } from "@/infrastructure/conversion/magic-bytes-detector";

/**
 * Composition root: instancia os adapters de infraestrutura e injeta nos use cases.
 * Route handlers e Server Components devem consumir os use cases somente daqui.
 */
export interface Container {
  readonly createSession: CreateSessionUseCase;
  readonly getSession: GetSessionUseCase;
  readonly revokeSession: RevokeSessionUseCase;
  readonly validateUpload: ValidateUploadUseCase;
}

let cached: Container | null = null;

export function getContainer(): Container {
  if (cached) return cached;

  const authSession = new FirebaseAuthAdapter();
  const fileTypeDetector = new MagicBytesDetector();

  cached = {
    createSession: new CreateSessionUseCase(authSession),
    getSession: new GetSessionUseCase(authSession),
    revokeSession: new RevokeSessionUseCase(authSession),
    validateUpload: new ValidateUploadUseCase(fileTypeDetector),
  };
  return cached;
}
