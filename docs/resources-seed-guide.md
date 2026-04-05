# Seed inicial da página de recursos

Este guia popula o schema `resourceItem` com exemplos para você visualizar a rota `/resources` imediatamente.

## 1) Verificar variáveis de ambiente

Confirme que o projeto está com:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET` (ex.: `production`)
- `SANITY_API_TOKEN` com permissão de escrita

## 2) Rodar import no dataset

No diretório raiz do projeto:

```bash
npx sanity dataset import sanity/seeds/resource-items.ndjson production --replace
```

Se você usa um dataset diferente de `production`, troque no comando.

## 3) Validar no Studio

1. Abra `http://localhost:3000/studio`
2. Entre em **Resource Item**
3. Confirme que os registros foram criados
4. Ajuste links reais, categorias e textos conforme necessidade

## 4) Validar na página

1. Abra `http://localhost:3000/resources`
2. Confira:
   - cards carregados
   - busca por palavra-chave
   - filtros por categoria e tipo
   - links externos abrindo em nova aba

## Observações

- O arquivo de seed usa URLs de exemplo (`example.com`) para acelerar bootstrap.
- Recomenda-se substituir por URLs reais antes de produção.
- Para reimportar do zero, mantenha o `--replace`.
