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

## Localização e fusos (Fase 02C)

| Tema                                  | Decisão                                                                                               | Motivo                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Base de localidades                   | JSON estático no servidor: 5.571 municípios IBGE + 4.288 cidades GeoNames (≥ 100 mil hab. e capitais) | Proporcional ao MVP; sem banco nem serviço pago                  |
| Fuso dos municípios                   | `zone1970.tab` por UF; polígonos (`geo-tz/all`) para PA e AM; Noronha explícito                       | Fonte oficial; 0 divergências com os polígonos nas demais UFs    |
| Coluna `fuso_horario` do dataset IBGE | **Não usada**                                                                                         | Agrupa por deslocamento atual; erra o histórico                  |
| Fuso disputado                        | Localidade sem fuso → recusada                                                                        | Não adivinhar                                                    |
| Conversão                             | `Intl` (ICU/tzdb) com fuso explícito; módulo próprio                                                  | Sem dependência; trata inexistente/duplicado explicitamente      |
| Horário de verão                      | Metadados do ICU (`true`/`false`/`null`)                                                              | Heurística de deslocamento confundia mudança de fuso (Acre 2008) |
| Horário aproximado                    | Extremos pelo relógio, com piso na janela física                                                      | Cobre horários duplicados na janela                              |
| Horário desconhecido                  | Dia local em UTC + meio-dia de referência                                                             | Convenção declarada; sem ângulos                                 |
| "Hoje" no servidor                    | Data em UTC+14                                                                                        | Nunca recusar um nascimento de hoje em nenhum fuso               |

## Consolidação (Fase 02C.1)

| Tema                             | Decisão                                                                | Motivo                                                                         |
| -------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Localidades estrangeiras menores | Catálogo offline GeoNames cities1000 (+128.913), carregado sob demanda | Sem serviço externo; a política do Nominatim proíbe autocompletar; privacidade |
| Localidade fora do catálogo      | Recusar; nunca substituir por cidade próxima                           | Coordenadas erradas alteram Ascendente e casas                                 |
| Versão da tzdb                   | Fixada em **2026f** via arquivos ICU (`tzdata/`), não a do Node        | Resultados não mudam em silêncio; a 2026f corrige o Brasil em 1965/1966        |
| Divergência de versão            | Bloquear a normalização (`TZDB_VERSION_MISMATCH`)                      | Melhor indisponível do que incorreto                                           |
| Regressão                        | Snapshot de 757 transições brasileiras, conferido contra o Python      | Qualquer mudança exige revisão explícita                                       |
| Segundos                         | `UtcInstant.second` opcional, sem arredondamento                       | Hora média local tem segundos; 28 s mudam o Ascendente em ~7′                  |
| Datas civis puladas              | Recusadas (`DATE_NONEXISTENT_IN_ZONE`) com qualquer precisão           | Não existem como data de nascimento                                            |

## Mandala natal (Fase 02D)

| Tema                     | Decisão                                                                          | Motivo                                            |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------- |
| Acesso ao motor          | `SIDERA_INTERNAL_ENGINE=1`, verificado na Server Action antes de processar dados | Licença AGPL; nada calculado em deploys           |
| Orientação               | Ascendente às 9 h; sem horário, 0° Áries às 9 h; longitude anti-horária          | Convenção ocidental; nada afirmado sem horário    |
| Planetas próximos        | Só o símbolo é afastado (≥ 9°); marca na posição real                            | A posição exata nunca é deslocada                 |
| Símbolos                 | Contornos vetoriais das fontes Noto (OFL)                                        | Evita emoji no iOS e dependência de fonte         |
| Horário aproximado       | Faixas de ASC/MC; casas não determinadas; aspectos incertos tracejados           | Não apresentar valores variáveis como definitivos |
| Horário desconhecido     | Sem ângulos/casas; intervalos no dia local                                       | Idem                                              |
| `ICU_TIMEZONE_FILES_DIR` | Sempre absoluto (launcher)                                                       | Exigência do ICU; relativo caía na 2025b          |

## Motor de interpretação (Fase 02E)

| Tema                   | Decisão                                                   | Motivo                                                       |
| ---------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| Intervalos na janela   | Amostragem a cada 30 min (antes: extremos)                | Estações planetárias e casas intermediárias eram perdidas    |
| Observação × simbólico | Campos separados em todo item                             | Nunca apresentar tradição como fato                          |
| Fatos incertos         | Aspectos: metade do peso + ressalva; demais: só limitação | Não afirmar o que muda dentro da janela                      |
| Distribuição           | Cada fato em um único capítulo; ≤ 6 itens; ≤ 4 por corpo  | Evitar repetição                                             |
| Regências              | Tradicionais                                              | Convenção mais difundida; documentada                        |
| Corpos lentos          | Signos e aspectos só entre lentos não interpretados       | São geracionais                                              |
| IA                     | Só payload + validador; modelo nunca recebe o `ChartView` | Impedir posições inventadas; integração depende de aprovação |

## Geração com IA (Fase 02F)

| Tema                 | Decisão                                                           | Motivo                                                        |
| -------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| Modelo recomendado   | Claude Sonnet 5.5, esforço `medium`; Haiku 5.5 como candidato A/B | Custo estimado < 2% do ticket; preços e políticas verificados |
| Provedor             | Interface `AiProvider` independente                               | Trocar de fornecedor sem mexer no motor nem no validador      |
| Granularidade        | Uma chamada por capítulo, em paralelo                             | Latência e isolamento de falhas                               |
| Saída                | JSON Schema por capítulo, `itemIds` restritos                     | Formato validável; impede citar itens de outro capítulo       |
| Falha                | No máximo 2 tentativas (teto 3); depois, biblioteca identificada  | Nunca entregar texto inválido; sem laços infinitos            |
| Limitações e títulos | Vêm do motor, não do modelo                                       | O modelo não pode apagar ou reescrever limitações             |
| Credenciais          | Só variáveis de ambiente do servidor; `.env.example` sem valores  | Segurança                                                     |

## Avaliação comparativa (Fase 02F.1)

| Tema                   | Decisão                                                                   | Motivo                                                  |
| ---------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| Fallback entre modelos | Desligado na avaliação; nunca enviado a modelos sem suporte (Haiku 5.5)   | Cada resposta deve vir do modelo avaliado               |
| Teto de gasto          | R$ 15 no total; pior caso conferido antes e reservado por chamada         | Gasto limitado mesmo com novas tentativas e paralelismo |
| Avaliação              | Cega (rótulos sorteados, chave separada), 10 critérios, tamanho não conta | Evitar viés de marca e de extensão                      |
| Artefatos              | Sem prompts; só textos gerados, IDs e métricas                            | Não registrar prompts em arquivos persistentes          |

## Limitações conhecidas

- **HEIC** é aceito, mas só tem pré-visualização no Safari; em outros
  navegadores a pessoa recebe orientação para usar JPG. Conversão fica para a
  fase de processamento de imagem.
- O botão “Tirar foto” só aparece em dispositivos de toque (`pointer: coarse`);
  em desktop há seleção de arquivo e arrastar-e-soltar.
- O seletor de data nativo (calendário) não é usado; a pessoa digita a data.
- A busca de cidades (geocodificação + fuso horário histórico) ainda não existe;
  é pré-requisito do cálculo do mapa.
