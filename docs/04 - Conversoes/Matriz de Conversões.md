# Matriz de Conversões

Catálogo completo (atual + planejado) do [[Projeto Com Hans]].

## Legenda

| Símbolo | Significado |
| --- | --- |
| ✅ | Disponível |
| 🚧 | Em desenvolvimento |
| 📅 | Planejado |
| 🔮 | Futuro / IA |

## Documentos e dados

| Origem | Destino | Status | Release |
| --- | --- | --- | --- |
| xlsx | csv | ✅ MVP | v0.1 |
| csv | xlsx | ✅ MVP | v0.1 |
| docx | pdf | ✅ MVP | v0.1 |
| pdf | txt | ✅ MVP | v0.1 |
| json | csv | ✅ MVP | v0.1 |
| csv | json | ✅ MVP | v0.1 |
| pptx | pdf | 📅 | v0.2 |
| odt | pdf | 📅 | v0.3 |
| md | pdf | 📅 | v0.3 |
| pdf | docx | 📅 | v0.4 |
| xlsx | json | 📅 | v0.2 |

## Mídia

| Origem | Destino | Status | Release |
| --- | --- | --- | --- |
| mp4/webm/mov | mp3 | ✅ MVP | v0.1 |
| mp4/webm/mov | wav | ✅ MVP | v0.1 |
| mp4/webm/mov | texto (transcrição) | 🔮 | v1.0 |
| mp3 | txt (transcrição) | 🔮 | v1.0 |

## Imagens (fase 2+)

| Origem | Destino | Status | Release |
| --- | --- | --- | --- |
| png | jpg | 📅 | v0.2 |
| jpg | png | 📅 | v0.2 |
| heic | jpg | 📅 | v0.2 |
| webp | png | 📅 | v0.2 |

## Arquivos compactados

| Origem | Destino | Status | Release |
| --- | --- | --- | --- |
| zip | extrair | 📅 | v0.3 |
| múltiplos | zip | 📅 | v0.3 |

## Implementação

Cada linha ✅/📅 vira entrada no `ConversionCatalog` + adapter em `src/infrastructure/converters/`.

Progressão detalhada: [[Progressão Mensal]].
