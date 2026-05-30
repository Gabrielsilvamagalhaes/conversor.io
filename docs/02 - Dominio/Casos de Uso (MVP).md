# Casos de Uso (MVP)

Use cases da camada de aplicação — [[Projeto Com Hans]].

## 1. ListSupportedPairsUseCase

**Ator:** visitante ou usuário logado  
**Entrada:** nenhuma (ou filtro por categoria)  
**Saída:** lista de pares habilitados com metadados (label, ícone, limites)

**Fluxo:**
1. Consulta `ConversionCatalog.listEnabled()`.
2. Mapeia para DTO de apresentação.

---

## 2. ConvertFileUseCase

**Ator:** visitante ou usuário logado  
**Entrada:** arquivo (buffer/stream), `ConversionPair`, `userId?`  
**Saída:** `ConversionJobDto` com `jobId`

**Fluxo:**
1. Validar par suportado.
2. Validar tamanho e formato.
3. (Futuro) Validar quota do usuário/IP.
4. Persistir arquivo temp via `FileStoragePort`.
5. Criar `ConversionJob` (`pending`).
6. Resolver conversor via `ConverterRegistry`.
7. Transicionar para `processing`.
8. Executar `converter.convert()`.
9. Persistir output temp; job → `completed` ou `failed`.
10. Retornar DTO.

**Erros mapeados:** ver [[Camadas e Dependências]].

---

## 3. GetJobStatusUseCase

**Entrada:** `jobId`  
**Saída:** status + URL download se `completed`

**Fluxo:**
1. Buscar job no repository.
2. Se não encontrado → `JobNotFoundError`.
3. Se expirado → status `expired`, sem URL.
4. Gerar signed URL via storage port.

---

## 4. GetSessionUseCase

**Entrada:** request (cookies/headers)  
**Saída:** `AuthenticatedUser | null`

Delega a `AuthSessionPort.verifySession()`.

---

## 5. CreateSessionUseCase (auth)

**Entrada:** Firebase ID token (client)  
**Saída:** Set-Cookie session

Usado em `POST /api/auth/session`.

---

## 6. RevokeSessionUseCase (auth)

**Entrada:** session cookie  
**Saída:** cookie limpo

Usado em `POST /api/auth/logout`.

---

## Ordem de implementação sugerida

1. `ListSupportedPairsUseCase`
2. `ConvertFileUseCase` (documentos simples: csv ↔ json)
3. `GetJobStatusUseCase`
4. Conversores xlsx, pdf, docx
5. `FfmpegVideoToAudioAdapter`
6. Auth use cases + middleware

## Testes por use case

Cada use case: mock de todos os ports + cenários happy path e erro de domínio.
