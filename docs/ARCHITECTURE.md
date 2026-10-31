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
    layout.tsx             # Fontes, metadados
    globals.css            # Design tokens (Tailwind v4 @theme)
    (site)/                # Home, como funciona, sistema visual (header + rodapé)
    (jornada)/             # Fluxo com barra de app (FlowHeader)
      leitura-das-maos/    # layout.tsx mantém a foto em memória
  components/
    ui/                    # Design system: Button, Badge, Card, Callout…
    layout/                # Header, FlowHeader, footer, wordmark
    visuals/               # Mandala, HeroOrb e ilustração da palma (SVG)
  features/
    astrology/             # Motor astrológico (Fase 02B, experimental, server-only)
      domain/              #   funções puras: signos, casas, aspectos, orbes
      engine/              #   EphemerisProvider + adapter Swiss Ephemeris
      service/             #   computeNatalChart (validação + orquestração)
    natal-chart/           # Mapa natal: ChartView, geometria, mandala SVG (Fase 02D)
    places/                # Localidades: base IBGE + GeoNames, busca (Fase 02C)
    birth-time/            # Horário local → UTC com regras históricas IANA (Fase 02C)
    birth-data/            # Formulário + normalização (contrato, Server Actions)
    palm-reading/          # Contexto da foto, validação, captura, prévia demo
    birth-data/            # Formulário e validação local
    report/                # Abas de capítulos e resumo da oferta
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

## Motor astrológico (Fase 02B — experimental)

- Detalhes, convenções e resultados: `docs/fase-02a-motor-astrologico.md` e
  `docs/fase-02b-prova-de-viabilidade.md`.
- O cálculo roda **apenas no servidor** (`server-only`, runtime Node.js
  padrão). Componentes visuais nunca importam o motor; consomem `NatalChart`.
- `sweph` é um addon nativo: `serverExternalPackages` + binários Linux e
  arquivos `.se1` em `outputFileTracingIncludes` (`next.config.ts`).
- Efemérides em `ephe/` (não versionado): `npm run ephe:fetch`.
- **Swiss Ephemeris sob AGPL**: uso interno; nenhum serviço público antes do
  licenciamento. A rota `/api/dev/astro-poc` responde 404 sem
  `SIDERA_ASTRO_POC=1` (rota removida na Fase 02D).

## Localização e fusos (Fase 02C)

- Detalhes, fontes e limitações: `docs/fase-02c-localizacao-e-fusos.md`.
- Base estática (~1,5 MB) carregada só no servidor; busca em memória por
  Server Action. Gerada por `scripts/geo/build-places.mjs` (reproduzível).
- Conversão local → UTC via `Intl` com fuso IANA explícito: inexistente e
  duplicado nunca são resolvidos automaticamente.
- Nada é persistido; o motor astrológico não é chamado nesta fase.
- Fase 02C.1: catálogo estendido (GeoNames cities1000) lido sob demanda;
  base de fusos fixada em `tzdata/2026f` (`ICU_TIMEZONE_FILES_DIR`), com
  bloqueio se a versão do processo divergir e snapshot de regressão das
  transições brasileiras. Detalhes em `docs/fase-02c1-consolidacao.md`.

## Mandala natal (Fase 02D)

- `computeChartAction` reutiliza `normalizeOnServer` (mesma normalização da
  conferência) e `computeNatalChart` (02B); a mandala só desenha o `ChartView`.
- Ambiente interno apenas: `SIDERA_INTERNAL_ENGINE=1` no servidor (AGPL).
- Convenção geométrica, testes de correspondência e limitações em
  `docs/fase-02d-mandala-natal.md`.

## Motor de interpretação (Fase 02E)

- `src/features/interpretation/`: `ChartView` → fatos (com certeza e origem) →
  regras dos 5 capítulos → seleção determinística → `InterpretationReport`.
- Biblioteca editorial em `library/` (base completa + 94 textos autorais).
- `ai/` prepara payload e validador; nenhum modelo é chamado.
- Detalhes em `docs/fase-02e-motor-de-interpretacao.md`.

## Geração com IA (Fase 02F)

- `src/features/interpretation/ai/`: um capítulo por chamada → provedor
  (`AiProvider`: Anthropic ou simulado) → validação → `GeneratedReport`.
  Falhou? O capítulo usa a biblioteca (`source: "library"`).
- Chave só no servidor (`ANTHROPIC_API_KEY`); IA real só com
  `SIDERA_AI_ENABLED=1` + `SIDERA_AI_PROVIDER=anthropic`. Nenhuma rota pública.
- Detalhes em `docs/fase-02f-geracao-com-ia.md`.

## Segurança

- Cabeçalhos: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`; `poweredByHeader` desativado.
- `robots: noindex` enquanto o produto é protótipo.
- Nenhum dado pessoal sai do navegador nesta fase.
