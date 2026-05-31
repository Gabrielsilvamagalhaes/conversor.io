# Conventional Branches

Convenção de branches do Conversor.io.

## Estratégia

Trunk-based development com `main` como única branch permanente. Todo trabalho acontece em branches curtas que entram via Pull Request.

Deploy de produção é disparado por tag `v*` — ver [[Ambientes e Deploy]].

## Branches permanentes

| Branch | Papel |
| --- | --- |
| `main` | Produção — protegida, só aceita via PR com CI aprovado |
| `release` | Estágio de pré-produção — ponto de backup antes do merge em `main` |

## Branches de trabalho

### Formato

```
<type>/<scope>/<short-description>
```

- `<type>` — mesmo vocabulário dos [[Conventional Commits]]
- `<scope>` — mesmo vocabulário dos scopes sugeridos
- `<short-description>` — kebab-case, imperativo, máximo ~5 palavras

### Exemplos

```
release/v0.4.0
feat/conversion/xlsx-to-csv-adapter
feat/auth/firebase-session-middleware
fix/conversion/handle-empty-csv
fix/auth/expired-session-cookie
refactor/catalog/adapter-registry
perf/ffmpeg/reduce-temp-file-writes
ci/add-typecheck-job
docs/roadmap-update
chore/deps/upgrade-next-16
```

## Tipos válidos

| Type | Uso |
| --- | --- |
| `release` | Entrega de versão — branch de pré-produção |
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `refactor` | Refatoração sem mudança de comportamento |
| `perf` | Melhoria de performance |
| `test` | Testes |
| `ci` | GitHub Actions / pipeline |


## Scopes válidos

`conversion`, `auth`, `ui`, `api`, `infra`, `catalog`, `ffmpeg`, `deps`, `ci`, `docs`

## Fluxo

```
main
 └── feat/conversion/xlsx-to-csv-adapter
      ├── commits atômicos (Conventional Commits)
      └── PR → squash merge → main
```

1. Criar branch a partir de `main` atualizado.
2. Commits atômicos seguindo [[Conventional Commits]].
3. Abrir PR → CI roda (`lint`, `typecheck`, `test`, `build`).
4. Vercel gera preview URL automática.
5. Squash merge com mensagem convencional.
6. Branch deletada após merge.

## Regras

- Branches têm vida curta — abrir PR assim que houver trabalho mostrável.
- Nunca commitar diretamente em `main`.
- Rebase em `main` antes de abrir PR se a branch ficou para trás.
- Nomenclatura em inglês, kebab-case, sem números de issue no nome (referenciar no commit/PR body).

## Release

Após merge(s) em `main`, criar tag para disparar deploy de produção:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Ver versionamento em [[Roadmap]] e pipeline em [[GitHub Actions]].
