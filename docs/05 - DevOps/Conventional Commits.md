# Conventional Commits

Padrão de commits do [[Projeto Com Hans]].

## Formato

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types

| Type | Uso |
| --- | --- |
| `feat` | Nova funcionalidade (conversor, tela, auth) |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `style` | Formatação (sem mudança lógica) |
| `refactor` | Refatoração |
| `perf` | Performance |
| `test` | Testes |
| `build` | Build, deps, docker |
| `ci` | GitHub Actions |
| `chore` | Tarefas gerais |
| `revert` | Revert commit |

## Scopes sugeridos

`conversion`, `auth`, `ui`, `api`, `infra`, `catalog`, `ffmpeg`, `deps`, `ci`

## Exemplos

```
feat(conversion): add xlsx to csv adapter

fix(auth): handle expired firebase session cookie

ci: add typecheck job to pull request workflow

feat(catalog): enable pptx to pdf pair for v0.2.0
```

## Breaking changes

```
feat(api)!: change job status response shape

BREAKING CHANGE: field `url` renamed to `downloadUrl`
```

## Ferramentas

### commitlint

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [
      'conversion', 'auth', 'ui', 'api', 'infra',
      'catalog', 'ffmpeg', 'deps', 'ci', 'docs',
    ]],
  },
};
```

### Husky

```bash
npx husky init
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

## Regras de equipe

1. Commits atômicos — um propósito por commit.
2. Descrição em imperativo: "add", não "added".
3. Referenciar issue quando existir: `fix(conversion): #42 handle empty csv`
4. PR squash: manter mensagem convencional no merge.
