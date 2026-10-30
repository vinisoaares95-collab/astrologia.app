# Sidera (nome provisório) — Plataforma de astrologia e autoconhecimento

Protótipo da **Fase 01** do Projeto Cation Digital: fundação técnica, design
system inicial e telas demonstrativas da jornada (landing → leitura das mãos →
dados de nascimento → proposta do relatório).

> Nada nesta fase calcula mapas, analisa fotos, gera relatórios ou processa
> pagamentos. Todas as telas que simulam resultados são identificadas como
> demonstração.

## Requisitos

- Node.js 20.19+ (testado com 22.22)
- npm 10+
- PostgreSQL **não é necessário** nesta fase

## Executar localmente

```bash
npm install
```

```bash
npm run ephe:fetch   # efemérides do motor astrológico (necessário para testes)
```

```bash
npm run dev
```

Acesse http://localhost:3000. O `postinstall` gera o Prisma Client
automaticamente (não precisa de banco).

Opcional: copie `.env.example` para `.env` para definir variáveis.

## Scripts

| Script                | O que faz                                    |
| --------------------- | -------------------------------------------- |
| `npm run dev`         | Servidor de desenvolvimento (Turbopack)      |
| `npm run build`       | Build de produção                            |
| `npm start`           | Servir o build de produção                   |
| `npm run lint`        | ESLint (regras do Next.js + TypeScript)      |
| `npm run typecheck`   | Gera tipos de rota e roda `tsc --noEmit`     |
| `npm test`            | Testes unitários e de componentes (Vitest)   |
| `npm run check`       | typecheck + lint + testes                    |
| `npm run format`      | Prettier (com ordenação de classes Tailwind) |
| `npm run db:generate` | Gera o Prisma Client                         |
| `npm run db:validate` | Valida o schema Prisma                       |
| `npm run ephe:fetch`  | Baixa e confere os arquivos de efemérides    |

A base de localidades é gerada por `scripts/geo/build-places.mjs`; veja
`docs/fase-02c-localizacao-e-fusos.md` (seção "Regenerar a base").

## Telas

| Rota                       | Conteúdo                                               |
| -------------------------- | ------------------------------------------------------ |
| `/`                        | Landing page                                           |
| `/leitura-das-maos`        | Orientações para fotografar a palma                    |
| `/leitura-das-maos/foto`   | Câmera/galeria, pré-visualização, troca e erros        |
| `/leitura-das-maos/previa` | Prévia **demonstrativa** (texto fixo, sem IA)          |
| `/dados-de-nascimento`     | Formulário com validação local (nada é enviado)        |
| `/relatorio`               | Estrutura do relatório e oferta (pagamento desativado) |
| `/como-funciona`           | Cálculo × observação × símbolo, FAQ                    |
| `/sistema-visual`          | Referência interna de tokens e componentes             |

## Privacidade da foto

A imagem é lida com `URL.createObjectURL` e exibida apenas no navegador. Não há
upload nem armazenamento. A URL local é revogada ao trocar/remover a foto ou ao
sair de `/leitura-das-maos` (o provider do segmento é desmontado). Recarregar a
página também descarta a imagem.

## Trocar nome e identidade

- Nome, slogan e empresa: `src/config/brand.ts`
- Cores, fontes e movimento: tokens em `src/app/globals.css` (`@theme`)
- Fontes (Geist / Geist Mono): `src/app/layout.tsx`

## Capturas

Veja `docs/capturas/` (mobile 390 px e desktop 1440 px).

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Decisões técnicas](docs/DECISIONS.md)
