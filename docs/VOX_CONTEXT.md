# Vox — Contexto do Projeto

## Visão Geral
Portfolio pessoal de design com carousel horizontal de projetos, painel de detalhes deslizante, e CMS headless via Sanity. O site é hospedado na Vercel com deploy automático via GitHub.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack, React Compiler) |
| CMS | Sanity v3 — embedded Studio em `/studio` |
| Hosting | Vercel (free tier) — auto-deploy do GitHub |
| Domínio | Hostinger (apenas DNS, A records apontando para Vercel) |
| Animações | GSAP (carousel drag/fling/loop) |
| Estilo | Tailwind CSS v4 |
| Imagens CDN | cdn.sanity.io |

---

## Credenciais Sanity

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `gj1u011w` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `SANITY_API_TOKEN` | ver `.env.local` |
| `SANITY_WEBHOOK_SECRET` | ver `.env.local` |

**CORS configurado para:** `https://vox-phi.vercel.app`

**Webhook:** POST para `/api/revalidate` — revalida a home page on-demand quando um projeto é publicado.

---

## URLs

- **Site ao vivo:** https://vox-phi.vercel.app
- **Sanity Studio:** https://vox-phi.vercel.app/studio
- **GitHub:** git@github.com:thalysonblack/vox.git

---

## Estrutura de Arquivos Críticos

```
/
├── sanity.config.ts              # Config do Sanity Studio (basePath: /studio, name: default)
├── next.config.ts                # serverExternalPackages: sanity/@sanity/ui/styled-components
├── .env.local                    # Credenciais (gitignored)
│
├── sanity/schemas/
│   └── project.ts                # Schema completo de projeto
│
└── src/
    ├── app/
    │   ├── page.tsx              # Server Component — fetch GROQ + render carousel
    │   ├── studio/[[...tool]]/
    │   │   └── page.tsx          # Studio route (use no memo + force-dynamic)
    │   └── api/revalidate/
    │       └── route.ts          # Webhook ISR
    │
    ├── components/
    │   ├── ProjectCarousel.tsx   # Client Component — GSAP drag carousel
    │   ├── ProjectDetailPanel.tsx # Painel deslizante com todos os campos
    │   ├── ProjectCard.tsx       # Card individual do carousel
    │   ├── StudioClient.tsx      # Wrapper "use client" para o NextStudio
    │   ├── Nav.tsx
    │   └── Footer.tsx
    │
    ├── lib/
    │   ├── sanity.ts             # createClient
    │   └── queries.ts            # GROQ query polimórfica
    │
    └── types/
        └── project.ts            # Interfaces TypeScript
```

---

## Schema do Projeto (Sanity)

### Campos de metadata
| Campo | Tipo | Descrição |
|---|---|---|
| `name` | string | Nome do projeto (required) |
| `slug` | slug | ID URL (auto-gerado do name) |
| `order` | number | Posição no carousel (10, 20, 30...) |
| `image` | image | Cover do carousel (required) |
| `description` | text | Descrição principal |
| `year` | string | Ano de execução |
| `category` | string | Categoria livre |
| `discipline` | string | Tipo: Branding / Website / UI Design / Motion / Print / 3D |
| `client` | string | Nome do cliente |
| `tags` | string[] | Tags livres |
| `role` | string[] | Funções desempenhadas |
| `liveUrl` | url | URL do site ao vivo |
| `externalUrl` | url | Behance, Dribbble etc |

### Content Blocks (array polimórfico)
O campo `content` é um array de blocos — cada bloco tem um `_type` que determina como renderiza:

| `_type` | Campos | Renderização |
|---|---|---|
| `imageBlock` | `image`, `orientation` (horizontal/vertical), `caption?` | Imagem com aspect ratio 16:9 ou 4:5 |
| `imagePair` | `imageLeft`, `imageRight`, `caption?` | Duas imagens lado a lado 1:1 |
| `videoBlock` | `video` (file), `caption?` | Player de vídeo nativo |
| `gifBlock` | `gif` (file), `caption?` | `<img>` tag (preserva animação) |
| `textBlock` | `text` | Parágrafo de texto mid-content |

### Outros campos
| Campo | Tipo | Descrição |
|---|---|---|
| `credits` | `{ role, name }[]` | Créditos da equipe |
| `relatedProjects` | `reference[]` | Até 4 projetos relacionados |

---

## Decisões Técnicas Importantes

### Por que `"use no memo"` no studio page?
React Compiler (ativado via `reactCompiler: true` no next.config) não é compatível com o Sanity Studio. O directive desativa a compilação para aquela rota.

### Por que `StudioClient.tsx` existe?
`next/dynamic` com `ssr: false` só funciona em Client Components. O studio page é Server Component, então o `NextStudio` (que não pode rodar no servidor) é encapsulado em um Client Component wrapper.

### Por que `serverExternalPackages: ["styled-components", "@sanity/ui", "sanity"]`?
O Turbopack tentava fazer SSR do styled-components e do Sanity UI, causando crash. Marcar como external packages força o Node a importá-los diretamente sem bundling.

### Por que `name: "default"` no sanity.config?
O Sanity usa o workspace `name` no roteamento interno. Com qualquer outro nome, o Studio tentava navegar para `/studio/{name}` e causava "Tool not found".

### ISR Strategy
- `revalidate = 60` na home (fallback)
- Webhook on-demand via `/api/revalidate` quando projeto é publicado no Studio
- `.catch(() => [])` no fetch garante que a home não crasha se o Sanity estiver offline

---

## Como Adicionar um Projeto

1. Acessar https://vox-phi.vercel.app/studio
2. Structure → Project → + Create
3. Preencher: name → slug (auto) → order → cover image → metadata
4. Adicionar blocos em **Content**: imageBlock, imagePair, videoBlock, gifBlock, textBlock
5. Adicionar créditos, related projects, liveUrl
6. Publicar → webhook dispara → site atualiza em segundos

---

## Próximos Passos (pendentes)

- [ ] Revisar performance (GSAP tree-shaking, next/image sizes, fontes)
- [ ] Configurar DNS na Hostinger (A records apex apontando para Vercel IPs)
- [ ] Adicionar projetos reais no Studio
- [ ] Related Projects clicáveis (callback para navegar no carousel)
- [ ] Configurar domínio custom no Vercel
