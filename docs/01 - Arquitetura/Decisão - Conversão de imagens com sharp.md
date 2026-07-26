# Decisão — Conversão de imagens com sharp

Registro de decisão de arquitetura do [[Projeto Com Hans]]. Refere-se à categoria `images`
de [[Matriz de Conversões]] (`png↔jpg`, `webp→png`, `webp→jpg`, `png→webp`, `jpg→webp` — 6
pares) e ao adendo de [[MVP - Conversões Iniciais]].

- **Data:** 2026-07-25
- **Status:** Decidido
- **Contexto:** [[Contexto Conversão de Arquivos]] · [[Processamento de Arquivos]] ·
  [[Decisão - Conversão docx para pdf sem LibreOffice]]

## Contexto

Até esta sprint o projeto não tinha nenhuma dependência de processamento de imagem — os 14
pares do catálogo anterior (planilhas, dados, documentos, mídia) não decodificavam nem
recodificavam pixel algum. A categoria `images` precisava de uma lib de decode/encode
rodando no servidor (runtime nodejs da rota `/api/convert`), com suporte nativo a
PNG/JPEG/WebP nos dois sentidos, sem depender de um binário de sistema externo (mesma
restrição de deploy serverless que já valeu para `docx → pdf` — ver
[[Decisão - Conversão docx para pdf sem LibreOffice]]).

## Alternativas consideradas

- **sharp** (escolhida) — bindings nativos sobre libvips (C, compilado). Suporta
  PNG/JPEG/WebP de primeira classe, sem plugin, com decode/encode eficiente e é a lib de
  processamento de imagem mais madura do ecossistema Node.
- **jimp** — JS puro, o que evita ter que lidar com binário nativo por plataforma. Rejeitada:
  é sensivelmente mais lenta (processamento pixel a pixel em JS puro, sem o SIMD/otimizações
  de libvips), carrega a imagem inteira decodificada em memória (sem streaming), e o suporte
  a WebP não é nativo — depende de um plugin/wasm separado.
- **@napi-rs/image** — bindings Rust via NAPI, também nativo e rápido. Rejeitada por
  maturidade: ecossistema e histórico em produção bem menores que sharp/libvips, com menos
  cobertura conhecida de edge cases de formato.

## Decisão

Usar **sharp** para os 6 pares de conversão de imagem, atrás de um único adapter
parametrizado (`ImageConvertAdapter`) instanciado 6× a partir do catálogo — um adapter por
combinação `from`/`to`, não uma classe por par. Ver "Desvio consciente do CLAUDE.md" abaixo
para o motivo de não seguir a convenção literal de "1 par = 1 adapter".

## Consequências

### `serverExternalPackages` — sem mudança em `next.config.ts`

O Next 16 já inclui `sharp` na lista default de `serverExternalPackages` (pacotes nativos
que o bundler nunca tenta empacotar — ficam de fora do grafo do Turbopack/webpack e são
resolvidos via `require` normal do Node em runtime). Confirmado lendo `next.config.ts` deste
projeto: não há nenhuma entrada de `serverExternalPackages` nele, e não foi necessário
adicionar uma para `sharp` funcionar.

### Risco de deploy — binário nativo por plataforma

`sharp` depende de um binário nativo por combinação de SO+arquitetura (pacotes `@img/sharp-*`
no `pnpm-lock.yaml`, ex. `@img/sharp-linux-x64`, `@img/sharp-darwin-arm64`). O lockfile deste
projeto é gerado localmente no Windows; a Vercel builda em `linux-x64`. Sem intervenção,
`pnpm install` resolve e trava no lock só os binários da plataforma que rodou o install —
`@img/sharp-linux-x64` pode simplesmente não existir no `pnpm-lock.yaml`, e o build passa
localmente mas quebra em runtime na Vercel.

Mitigação: um `.npmrc` na raiz do repo com `supportedArchitectures` declarando
`os: [linux, win32]`, `cpu: [x64, arm64]`, `libc: [glibc, musl]` — isso faz o pnpm resolver
(e travar no lockfile) os binários nativos de todas essas combinações, não só os da máquina
que rodou o install. **Este é o risco de deploy a vigiar daqui para frente**: se o `.npmrc`
for removido, ou o lockfile for regenerado numa máquina/config sem ele, `@img/sharp-linux-x64`
pode desaparecer do `pnpm-lock.yaml` silenciosamente — sem erro no Windows, só quebra no
build da Vercel.

### Metadados removidos por padrão

`sharp` não copia EXIF/GPS/ICC do arquivo de origem para a saída a menos que
`.withMetadata()` seja chamado explicitamente. Esse projeto não chama — o efeito colateral é
remover metadados de localização/dispositivo de toda imagem convertida. Não foi o motivo da
escolha da lib, mas é um ganho de privacidade real (e não intencional) que vale registrar.

### `.rotate()` e `.flatten()` obrigatórios

- **`.rotate()`** sem argumento aplica a orientação gravada no EXIF (fotos de celular em
  portrait frequentemente têm os pixels em landscape + uma tag EXIF de rotação) e descarta a
  tag depois. Sem isso, a imagem convertida sai deitada em qualquer visualizador que não leia
  EXIF — a maioria, depois do download.
- **`.flatten({ background: "#ffffff" })`** é obrigatório na saída `jpg`: JPEG não tem canal
  alpha, e sem um `flatten` explícito o encoder do sharp preenche a transparência com preto
  em vez de branco — um PNG com fundo transparente vira JPEG com fundo preto. Não gera erro
  nenhum, por isso é o tipo de detalhe fácil de não perceber sem testar com um PNG
  transparente de verdade.

## Desvio consciente do CLAUDE.md — adapter parametrizado

`CLAUDE.md` define "cada par de conversão server-side = um adapter". Os 6 pares de imagem
são a mesma operação (decode → re-encode) variando só o codec de saída — escrever 6 classes
seria repetir a mesma chamada `sharp(bytes).rotate()....toFormat(...)` seis vezes, mudando
apenas uma string. `ImageConvertAdapter` é **um único** adapter parametrizado por formato de
destino, instanciado 6× a partir do catálogo (uma instância por par `from`→`to` registrada no
`ConverterRegistry`), não 6 arquivos.

Isso é possível sem violar o contrato porque `FileConverterPort` declara:

```ts
export interface FileConverterPort {
  readonly from: AcceptedExtension;
  readonly to: AcceptedExtension;
  convert(bytes: Uint8Array): Promise<Uint8Array>;
}
```

`from`/`to` são **campos** de instância, não um literal type fixo por classe — o contrato é
satisfeito por qualquer instância cujos campos apontem para o par correto. Uma classe
genérica configurada no construtor cumpre o port tão bem quanto 6 classes concretas; a
diferença é código duplicado a menos.

### Alternativa de arquitetura descartada

- **6 classes (`PngToJpgAdapter`, `JpgToPngAdapter`, ...)** — seguiria a convenção à risca,
  mas duplicaria a mesma sequência de chamadas do sharp 6 vezes, variando só o formato de
  saída. Rejeitada por duplicação sem ganho: ao contrário de `docx → pdf` vs. `pdf → txt`
  (parsers e formatos de origem completamente diferentes, onde uma classe por par faz
  sentido), os 6 pares de imagem não têm nenhuma regra de negócio distinta entre si.
