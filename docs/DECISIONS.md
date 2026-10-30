# Decisões técnicas — Fase 01

Versões verificadas no npm em 30/10/2026.

| Tema           | Somente escuro, acento laranja-cobre (v2)                                  | Direção visual revisada: dark premium, grid sutil, aspecto de app      |
| -------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Framework      | Next.js 16.4.3 + React 19.3                                                | Versão estável atual; App Router; nativo na Vercel                     |
| Cache/prefetch | `cacheComponents` + `partialPrefetching` ligados                           | Padrão do `create-next-app` 16.4; serão obrigatórios na próxima major  |
| TypeScript     | 5.9.3                                                                      | TS 7 (nativo) ainda não é suportado pelo type-check do Next            |
| Estilo         | Tailwind CSS 4.3 com tokens semânticos em `@theme`                         | Troca de identidade sem tocar em componentes                           |
| Fontes         | Geist (interface e títulos) + Geist Mono (rótulos e dados) via `next/font` | Linguagem tecnológica e contemporânea; auto-hospedadas no build        |
| Ícones         | lucide-react                                                               | Leve, tree-shakable, traço fino combina com a direção visual           |
| ORM            | Prisma 7.10.1 (estável)                                                    | A tag `latest` do npm aponta para 8.0 RC; evitamos RC                  |
| Banco          | PostgreSQL via `@prisma/adapter-pg`                                        | Padrão do Prisma 7; compatível com Vercel/Neon/Supabase                |
| Testes         | Vitest 5 + Testing Library + jsdom                                         | Guia oficial do Next; rápido                                           |
| Câmera         | `<input capture>` em vez de `getUserMedia`                                 | Sem permissões extras; usa o app de câmera nativo (foco, flash, HDR)   |
| Foto           | Só URL `blob:` em memória, revogada ao sair                                | Requisito da fase: não enviar nem persistir                            |
| Estado da foto | Context no layout de `/leitura-das-maos`                                   | Sobrevive entre `/foto` e `/previa` e é descartada ao sair do segmento |
| Tema           | Somente escuro, acento laranja-cobre (v2)                                  | Direção visual revisada: dark premium, grid sutil, aspecto de app      |
| Marca          | `src/config/brand.ts` (“Sidera”, provisório)                               | Substituição em um único ponto                                         |

| Navegação | Route groups `(site)` e `(jornada)` | Páginas institucionais com header/rodapé; jornada com barra de app (voltar, progresso `01/04`, sair) e ações fixas no rodapé, sem mudar URLs |

## Revisão visual (v2)

- Paleta: preto quase neutro, laranja-cobre como única cor de ação, azul frio
  apenas para indicar “cálculo”. Tokens semânticos inalterados em nome.
- Fundo com grid técnico esmaecido e brilho cobre (CSS puro, sem imagens).
- Mandala em camadas com rotação contrária; puramente decorativa.
- Novos componentes: `ActionDock`, `FrameCorners`, `Stat`, `Switch`,
  `IconButtonLink`, `FlowHeader`, `HeroOrb`, `ReportExplorer` (abas).
- Capturas de referência em `docs/capturas/`.

## Limitações conhecidas

- **HEIC** é aceito, mas só tem pré-visualização no Safari; em outros
  navegadores a pessoa recebe orientação para usar JPG. Conversão fica para a
  fase de processamento de imagem.
- O botão “Tirar foto” só aparece em dispositivos de toque (`pointer: coarse`);
  em desktop há seleção de arquivo e arrastar-e-soltar.
- O formato do campo de data segue o idioma do navegador.
- A busca de cidades (geocodificação + fuso horário histórico) ainda não existe;
  é pré-requisito do cálculo do mapa.
