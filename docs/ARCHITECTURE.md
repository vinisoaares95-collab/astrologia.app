# Arquitetura — Fase 01

## Visão geral

Monólito Next.js (App Router) pronto para Vercel. Sem microsserviços. Nesta fase
todas as rotas são pré-renderizadas como estáticas; a interatividade (foto,
formulário, oferta) roda em Client Components isolados.

```
Navegador ──► Next.js (Vercel)
               ├─ Server Components: páginas, layout, conteúdo
               ├─ Client Components: captura de foto, formulário, oferta
               └─ (futuro) Route Handlers / Server Actions
                     ├─ PostgreSQL via Prisma (lib/db.ts — preparado, não usado)
                     ├─ Motor astrológico (fase futura)
                     ├─ Processamento de imagem / IA (fase futura)
                     └─ Gateway de pagamento (fase futura)
```

## Diretórios

```
prisma/
  schema.prisma            # Catálogo (Product); sem dados pessoais
prisma.config.ts           # Config do Prisma 7 (DATABASE_URL opcional)
src/
  app/                     # Rotas (App Router)
    layout.tsx             # Fontes, metadados, header/footer
    globals.css            # Design tokens (Tailwind v4 @theme)
    leitura-das-maos/      # layout.tsx mantém a foto em memória
  components/
    ui/                    # Design system: Button, Badge, Card, Callout…
    layout/                # Header, footer, wordmark
    visuals/               # Mandala e ilustração da palma (SVG)
  features/
    palm-reading/          # Contexto da foto, validação, captura, prévia demo
    birth-data/            # Formulário e validação local
    report/                # Resumo da oferta (order bumps)
  config/                  # brand.ts (marca provisória), routes.ts
  content/                 # Catálogo e estrutura editorial do relatório
  lib/                     # Utilitários (cn, format, db)
  generated/prisma/        # Prisma Client gerado (ignorado no git)
docs/
```

Regra geral: `components/` não conhece regras de negócio; `features/` agrupa
UI + lógica de cada domínio; `content/` e `config/` são dados editáveis sem
mexer em componentes.

## Fluxo de dados da foto

1. `PhotoCapture` recebe o `File` de um `<input type="file">` (com
   `capture="environment"` para câmera em celulares) ou de arrastar-e-soltar.
2. `validateImageFile` checa tipo/extensão, tamanho (≤ 15 MB) e arquivo vazio.
3. `loadLocalPhoto` cria uma URL `blob:`, decodifica a imagem e checa a
   resolução mínima (600 px no lado menor); em caso de erro revoga a URL.
4. `PalmPhotoProvider` (no layout do segmento) guarda a foto e revoga a URL ao
   substituir, remover ou desmontar.

## Banco de dados (preparado)

- Prisma 7 com o gerador `prisma-client` e driver adapter `@prisma/adapter-pg`.
- `src/lib/db.ts` cria o cliente sob demanda e falha com mensagem clara se
  `DATABASE_URL` não existir. Marcado com `server-only`.
- Nenhuma migração criada. Entidades previstas para as próximas fases:
  `Customer`, `Order`/`OrderItem`, `BirthData`, `PalmPhoto` (com política de
  retenção), `Report`/`ReportChapter`, `ConsentRecord`.

## Segurança

- Cabeçalhos: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`; `poweredByHeader` desativado.
- `robots: noindex` enquanto o produto é protótipo.
- Nenhum dado pessoal sai do navegador nesta fase.
