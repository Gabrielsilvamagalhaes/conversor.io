# Design — Reforma de UI "Codex de Da Vinci" + upload de .csv

- **Data:** 2026-06-28
- **Status:** Aprovado (design) — pronto para plano de implementação
- **Contexto bounded:** Conversão (input/validação) · Identidade (gate de rota) · Presentation

## 1. Objetivo

Substituir a home padrão do Next, introduzir uma identidade visual profissional e
distintiva ("Codex de Da Vinci"), proteger a área de conversão por login e entregar a
**primeira fatia de upload**: receber e **validar** um arquivo `.csv` (sem conversão ainda).

### Em escopo
- Identidade visual + design system (tema claro **e** escuro, padrão = sistema).
- Landing pública redesenhada (hero com obra de Da Vinci + efeito máquina de escrever + rodapé).
- `/login` redesenhada (reaproveita a lógica de auth já existente).
- `/app` protegida com área de upload bonita e interativa.
- Upload de `.csv`: recepção + validação (magic bytes/heurística, tamanho, sanitização de nome).
- Integração do **shadcn/ui** (Tailwind 4).
- Curadoria de arte de Da Vinci (domínio público) em `/public/art`.
- Atualizar `CLAUDE.md` com a temática de design.

### Fora de escopo
- Conversão real do `.csv` (próxima fase) e demais pares do catálogo.
- Histórico, settings, planos/monetização, API pública.

## 2. Direção visual — "Codex de Da Vinci"

Renascença digital: Hermes/Nous usa arte clássica como peça central; aqui a obra de Da Vinci
é a protagonista do hero, apresentada **nítida** (sem blend sépia que embarra), em **grid
editorial assimétrico**, com tipografia refinada e **um único acento**. Restrição é a regra;
a ousadia mora na arte.

### Tipografia
- **Display:** `Fraunces` (serifa de alto contraste, itálico característico) — títulos e wordmark.
- **UI / corpo:** `Inter` — navegação, botões, textos, rótulos.
- Carregadas via `next/font/google` (substituem Geist/Geist_Mono do scaffold).

### Tokens de cor (CSS variables; mapeadas para o shadcn)

| Token | Claro | Escuro |
| --- | --- | --- |
| `--bg` | `#f4f0e7` | `#14120d` |
| `--bg-elev` | `#ece5d6` | `#1b1813` |
| `--fg` | `#211d15` | `#efe7d6` |
| `--muted` | `#6c6354` | `#9b9180` |
| `--sanguine` (acento) | `#b1502f` | `#c8694a` |
| `--gold` (acento 2, raro) | `#9a7a2c` | `#cda851` |
| `--line` | `rgba(33,29,21,.14)` | `rgba(239,231,214,.14)` |

- **Diferenciação anti-clichê:** o tema claro evita o default "creme `#F4F1EA` + serifa + terracota"
  apoiando-se na execução editorial, na arte real e no par Fraunces/Inter (não serifa-em-tudo).
- **Tratamento da arte:** imagem nítida, leve grade de contraste; **bordas dissolvidas no fundo**
  via gradientes (scrim) — sem `mix-blend-mode: multiply`, sem moldura em arco que corte a obra.
- **Motion:** typewriter sutil em **uma palavra** do título (cursor fino, sem bloco piscando);
  respeitar `prefers-reduced-motion` (sem animação → mostra a 1ª palavra estática).

### Tema (claro/escuro)
- Variáveis sob `:root` (claro) e `.dark` (escuro) no `globals.css`.
- Padrão = `prefers-color-scheme` do sistema; **toggle manual** persiste escolha em `localStorage`.
- Script inline mínimo no `<head>` (antes da pintura) para aplicar a classe e evitar FOUC.

## 3. Curadoria de arte (domínio público)

Obras de Leonardo da Vinci (falecido 1519 → domínio público). Fonte: Wikimedia Commons.
Baixadas para `public/art/` (sem hotlink em produção). Página/seção de **créditos** (autor,
obra, fonte) no rodapé ou em `/sobre`, mesmo sendo domínio público.

| Arquivo | Obra | Uso |
| --- | --- | --- |
| `public/art/vitruvian.jpg` | Homem Vitruviano (c.1490) | Hero da landing |
| `public/art/selfportrait.jpg` | Autorretrato em sanguínea (c.1512) | `/login` (a cor da obra = acento) |
| `public/art/anatomy.jpg` | Estudo anatômico | Textura de seção / `/app` *(a obter)* |
| `public/art/machine.jpg` | Máquina voadora / engrenagens | Detalhe / 404 *(a obter)* |

> As duas primeiras já foram baixadas em alta resolução durante o brainstorm; as duas
> últimas serão obtidas de fontes abertas (Wikimedia / museus Open Access) na implementação.

## 4. Rotas e proteção de acesso

| Rota | Acesso | Conteúdo |
| --- | --- | --- |
| `/` | **pública** | Landing: nav, hero (arte + typewriter), formatos, como funciona, rodapé |
| `/login` | pública | Redesenho; Google + e-mail/senha (lógica existente) |
| `/app` | **protegida** | Área de upload `.csv` (recebe + valida) |

- `src/proxy.ts`: `PROTECTED_PATHS = ["/app"]` (presence-check do cookie `__session` no Edge);
  `matcher` ajustado para `/app/:path*`. Verificação real continua server-side via `getServerSession()`.
- Não autenticado em `/app` → redirect `/login?redirect=/app`. Após login, volta para `redirect`.
- A landing decide o CTA: logado → `/app`; deslogado → `/login`.

## 5. Páginas

### 5.1 Landing `/` (pública)
- **Nav:** wordmark `conversor.io`, links (Formatos, Como funciona), botão **Entrar**, toggle de tema.
- **Hero:** grid assimétrico — copy à esquerda (kicker "Renascença digital", H1 com typewriter,
  sub, CTA primário + ghost, meta), **Homem Vitruviano** à direita sangrando e dissolvendo no fundo,
  com plaquinha de crédito.
- **Formatos:** grade dos pares do catálogo (xlsx↔csv, docx→pdf, pdf→txt, json↔csv, vídeo→áudio),
  com `.csv` em destaque como o disponível agora.
- **Como funciona:** 3 passos (enviar → transmutar → baixar).
- **Rodapé:** ver §6.

### 5.2 `/login` (pública)
- Layout duas colunas: formulário à esquerda, **autorretrato em sanguínea** à direita.
- Reaproveita `browser-auth.ts` (Google + e-mail/senha, signin/signup toggle) e o fluxo de
  session cookie já existente. Mantém `<Suspense>` por causa do `useSearchParams`.
- Re-skin com tokens Codex + componentes shadcn (`button`, `input`).

### 5.3 `/app` (protegida)
- Server Component resolve sessão via `getServerSession()`; exibe e-mail + **sair**.
- **`FileDropzone`** (client): área grande, arraste-e-solte + clique, estados
  (ocioso → arrastando → validando → aceito / rejeitado), feedback com nome, tamanho e tipo detectado.
- Aceita **apenas `.csv`** por enquanto; mensagem clara de que a conversão chega na próxima fase.

## 6. Rodapé (padrão "wordmark + colunas")

- **Colunas:** blurb da marca · **Formatos** · **Produto** · **Contato**.
- **Contato:** `gabiles278@gmail.com` (mailto) · `github.com/Gabrielsilvamagalhaes`.
- **Barra legal:** `© 2026 conversor.io — todos os direitos reservados`.
- **Assinatura discreta:** wordmark tipográfico (refinado, sem exageros) — pode incluir nota de
  créditos das obras (domínio público, Wikimedia).

## 7. Upload de `.csv` — Clean Architecture

Pertence ao bounded context **Conversão** (arquivo de entrada). Apenas recepção + validação.

```
domain/conversion/
  value-objects/  file-name.ts · file-size.ts · accepted-format.ts
  errors/         invalid-file-type.error.ts · file-too-large.error.ts · empty-file.error.ts
  ports/          file-type-detector.port.ts        # detecta tipo real a partir dos bytes
application/conversion/
  validate-upload.use-case.ts                       # ValidateUploadUseCase + DTO de saída
infrastructure/conversion/
  magic-bytes-detector.ts                           # implements FileTypeDetectorPort
presentation:
  app/app/page.tsx (server) + components/file-dropzone.tsx (client)
  app/api/upload/route.ts  (POST, runtime nodejs)
di/container.ts: + validateUpload (injeta MagicBytesDetector)
```

- **Regras de validação:**
  - Tamanho ≤ `MAX_DOCUMENT_SIZE_MB` (10 MB) → `FileTooLargeError`; vazio → `EmptyFileError`.
  - Formato aceito: `.csv` (allowlist) → `InvalidFileTypeError` caso contrário.
  - **CSV não tem magic bytes fortes** (é texto): a validação rejeita **assinaturas binárias/executáveis**
    (PK/ZIP, MZ, ELF, %PDF, etc.), confirma que é texto plausível (UTF-8) e checa a extensão.
  - **Sanitizar nome** (sem path traversal; remover caracteres perigosos).
- **Resposta:** `{ accepted, fileName, size, detectedType, message }`. Mapeamento erro→HTTP só na
  route handler (400 para validação). Sem persistência nesta fase.

## 8. shadcn/ui

- Init: `pnpm dlx shadcn@canary init` (compatível com Tailwind 4 + React 19). Base **neutral**,
  componentes em `src/components/ui`, alias `@/components`.
- Mapear as CSS vars do shadcn (`--background`, `--foreground`, `--primary`, `--ring`, …) para os
  **tokens Codex** no `globals.css` (claro + `.dark`).
- Componentes previstos: `button`, `input`, `sonner` (toasts de validação), `card`, e um toggle de tema.
- **Biome:** garantir que `src/components/ui/**` seja formatável (ou ignorado conforme convenção);
  rodar `pnpm check` após gerar componentes.

## 9. CLAUDE.md

Adicionar seção curta "Design — Codex de Da Vinci": direção visual, tokens, par tipográfico
(Fraunces + Inter), uso de arte de domínio público e a frase "Codex de Da Vinci" como mote de marca.

## 10. Testes

- **Domain:** unit puro dos VOs/erros (tamanho, formato, nome).
- **Application:** `ValidateUploadUseCase` com mock de `FileTypeDetectorPort` (aceita csv, rejeita binário/grande/vazio).
- **Infrastructure:** `MagicBytesDetector` com amostras (csv válido, zip/pdf/exe disfarçados).
- **Presentation:** E2E (Playwright) — landing pública carrega; `/app` redireciona deslogado; upload de
  csv mostra aceito; arquivo grande/binário mostra erro; toggle de tema.

## 11. Riscos / decisões

- **Migração de tema:** scaffold usa Geist + cores zinc; trocaremos por Fraunces/Inter + tokens Codex.
- **FOUC de tema:** mitigado com script inline pré-pintura.
- **CSV sem magic bytes:** validação é heurística (texto + allowlist + rejeição de binários) — documentar a limitação.
- **Peso das imagens:** otimizar (next/image, dimensões adequadas) para não inflar o LCP do hero.
- **`prefers-reduced-motion`:** typewriter desligado mostra a primeira frase estática.
