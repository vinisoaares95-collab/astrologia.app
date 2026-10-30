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

## Refinamento final (v3)

- Mandala com escala de 1°, rótulos a cada 30°, 12 setores com os símbolos
  geométricos tradicionais dos quatro elementos (fogo, terra, ar, água — na
  sequência clássica), losangos cardeais, hexagrama + dodecagrama e retícula.
  Removidas as “órbitas” soltas, que podiam ser lidas como posições de
  planetas. Variante `detail="compact"` para tamanhos pequenos.
- Datas e horários em campos de texto com máscara `DD/MM/AAAA` e `HH:MM`
  (24 h), validados como dia/mês — independentes do idioma do navegador.
- Contraste: `fg-subtle` ajustado para ≥ 4,5:1 (WCAG AA).
- Áreas seguras (`pt-safe`, `pb-safe`) e `scroll-padding` para foco e âncoras
  não ficarem sob barras fixas; a barra “Ver oferta” fica presa à coluna de
  capítulos e não cobre a oferta.
- Abas do relatório com navegação por setas, Home e End (padrão WAI-ARIA).

## Motor astrológico (Fases 02A e 02B)

| Tema       | Decisão                                                                 | Motivo                                          |
| ---------- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| Motor      | Swiss Ephemeris via `sweph` 2.10.3-8, provisório                        | Precisão de referência; ASC/MC/Placidus prontos |
| Licença    | AGPL, uso interno; **sem serviço público** até resolver o licenciamento | Decisão da revisão da Fase 02A                  |
| Isolamento | Interface `EphemerisProvider`                                           | Permite trocar de motor                         |
| Efemérides | `sepl_18`/`semo_18` (1800–2399), baixadas com SHA-256                   | Não redistribuir arquivos AGPL no repositório   |
| Fallbacks  | Recusar o modo Moshier e a troca automática para Porfírio               | Precisão e sistema de casas sempre conhecidos   |
| Tempo      | UTC → JD via `swe_utc_to_jd`; antes de 1972, entrada tratada como UT1   | Não existia UTC com segundos bissextos          |
| Orbes      | `orbs-v1` (8/8/7/7/5, +2 luminares, 5 ângulos), versionado              | Aprovado provisoriamente                        |
| Validação  | JPL DE421 (Skyfield), oráculo próprio de casas, Astronomy Engine        | Referências independentes do motor              |

## Limitações conhecidas

- **HEIC** é aceito, mas só tem pré-visualização no Safari; em outros
  navegadores a pessoa recebe orientação para usar JPG. Conversão fica para a
  fase de processamento de imagem.
- O botão “Tirar foto” só aparece em dispositivos de toque (`pointer: coarse`);
  em desktop há seleção de arquivo e arrastar-e-soltar.
- O seletor de data nativo (calendário) não é usado; a pessoa digita a data.
- A busca de cidades (geocodificação + fuso horário histórico) ainda não existe;
  é pré-requisito do cálculo do mapa.
