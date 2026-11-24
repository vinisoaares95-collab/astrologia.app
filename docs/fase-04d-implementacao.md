# Fase 04D — Implementação dos capítulos 8 e 9

Estado: **implementada, só interna.** O motor é AGPL, a leitura das mãos
roda em modo simulado no ambiente interno e não houve deploy. Não houve IA,
chamada paga nem mudança nos motores.

- Fonte editorial: `docs/fase-04d-biblioteca-consolidada.md`, aprovada em
  `d71f524`.
- Com esta fase, a Parte III (Sua Jornada) está funcionalmente completa.

## 1. O que foi feito

### Biblioteca e seleção

Módulo `src/features/report/journey-chapters/`:

| Arquivo                 | Papel                                                                                                                                                                                                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `library.ts`            | Biblioteca **versionada** (`JOURNEY_LIBRARY_VERSION = "04d.1"`): textos literais, tabela de polos das mãos, assuntos (afeto, agir, identidade e pensamento), eixos por assunto e limites                                                                                                        |
| `bridge.ts`             | Pontes com os metadados mínimos: `buildSkyBridge` (a partir do `InterpretationReport`), `buildHandsBridge` (a partir do `PalmReport`) e cópias campo a campo para a memória da jornada                                                                                                          |
| `select.ts`             | Seleção determinística. Capítulo 8: correspondência por assunto (F1), contraponto só no mesmo assunto (F2), U1–U6 e U4-misto. Capítulo 9: assuntos das interpretações apresentadas, prioridade ao capítulo 8, uma tradição por tema fora dele, de 2 a 3 temas, sem repetir assunto nem pergunta |
| `render.ts`             | Capítulos no formato `ChapterArticleData`, só com textos da biblioteca e rótulos já apresentados; `buildJourneyChapters`                                                                                                                                                                        |
| `__fixtures__/cases.ts` | As 84 combinações e as fixtures construídas (só testes)                                                                                                                                                                                                                                         |

### Integração

- **Céu:** `generateSkyChaptersAction` devolve `bridge` junto do relatório,
  calculada no mesmo pedido que já existia.
- **Mãos:** `toClientPalmResult` inclui `bridge` no resultado. O texto dos
  capítulos 6 e 7 não muda.
- **Memória da jornada:** `JourneySky` (pronto) e `JourneyHands` guardam as
  pontes copiadas campo a campo, e o descarte é o mesmo: sair, recarregar ou
  fechar.
- **Montagem no navegador:** `JourneyReading` monta os capítulos 8 e 9 com
  `useMemo`. **Nenhuma requisição nova**, nenhuma chamada aos motores nem a
  provedores.
- **Relatório integrado:** `buildIntegratedReport` recebe `journey`, com os
  estados pronto, carregando ou pendente; a demonstração interna continua
  pendente. Quando a leitura das mãos é simulada, a Parte III leva esse
  aviso.
- **`ChapterArticle`:** as seções ganharam `heading`, `badge` e `refs`, e a
  síntese ficou opcional. Os capítulos 1 a 7 não mudaram.

### O que a ponte leva e o que nunca leva

**Leva:**

- o id do item original (`InterpretationItem.id` ou `PalmItem.id`);
- o capítulo;
- o rótulo já apresentado ("Sol em Touro", "linha do coração longa");
- a chave de assunto;
- os polos;
- nas mãos, as listas de traços parciais, excluídos, sem polo ou não
  classificados, para as causas das ressalvas e de U4.

**Nunca leva:** data, hora ou local de nascimento, coordenadas, graus,
casas, evidência visual, imagem, hash, recibo, mão (direita ou esquerda),
origem do texto nem itens não elegíveis.

O inventário de privacidade (D3 e D9) foi atualizado.

## 2. Testes

| Conjunto                                                    | Resultado                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check` (typegen, tsc, eslint, Vitest)              | **1267 aprovados**, 42 ignorados (pagos e de avaliação)                                                                                                                                                                                                                                                                                                                                                                                                    |
| `npm run build`                                             | Aprovado                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `journey-chapters.test.ts` (novo, 25)                       | As 84 combinações com os números aprovados; variantes construídas (contraponto, diferença no ritmo, duas imagens, reserva, U4, U4-misto, R-hora, R-parcial); rastreabilidade; sem contraponto artificial; assunto e tradição do capítulo 9; mínimo de 2 e máximo de 3; sem repetição; determinismo; segurança editorial e privacidade em todo texto montado; nenhuma requisição; 6 casos adversariais; tema com uma única referência; V2 com um só assunto |
| `library.test.ts` (novo, 6)                                 | Todo texto é literalmente o do documento aprovado; padrões de segurança; perguntas inéditas em relação às dos capítulos 1–7; perguntas aprovadas; polos sustentados pelo texto da biblioteca das mãos; assuntos vindos das funções dos corpos                                                                                                                                                                                                              |
| `journey.test.tsx` (+3)                                     | Cópia campo a campo das pontes; descarte das pontes ao sair                                                                                                                                                                                                                                                                                                                                                                                                |
| `journey-reading.test.tsx` (+2, 2 ajustados)                | Nove capítulos com referências e "9 de 9"; só astrologia; indisponibilidade pela causa real                                                                                                                                                                                                                                                                                                                                                                |
| Ajustes ao contrato aprovado                                | `handlers.test.ts` e `chapters.test.ts`: o texto do cliente continua sem ids internos; a ponte é conferida campo a campo e sem evidência, mão nem origem                                                                                                                                                                                                                                                                                                   |
| Navegador, `04d-jornada.mjs` (desktop 1440×900 e iPhone 13) | **4 execuções aprovadas**, veja abaixo                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Regressões no navegador                                     | `04c-relatorio.mjs` com e sem motor, `04b-jornada.mjs`, `04a-leitura.mjs` (demonstração, axe-core em todos os cenários) e `d5-saida-do-fluxo.mjs` (17/17): aprovados                                                                                                                                                                                                                                                                                       |

Os scripts de navegador antigos foram ajustados ao comportamento novo:

- **04C:** com Recife e a mão clara, o indicador passa a "9 de 9"; sem o
  motor, a "3 de 9".
- **04B:** "em definição" deu lugar à indisponibilidade com o motivo real.
- **D5:** só ganhou a espera pela hidratação antes do primeiro clique.
  Nenhuma verificação foi removida.

### Execuções de navegador da 04D

| Execução                           | Cenários                                                                                                                                                                                                                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| motor ligado, mão clara            | 1. Nove capítulos. 6 e 8. Capítulo 8 indisponível (U6) e 9 disponível, com horário desconhecido. 2. Só astrologia (U1; 6 de 9). 10. Voltar e reabrir sem nenhuma requisição POST, recarregar apaga tudo e sair pelo X. Acessibilidade (axe WCAG A/AA) sem violações. Sem ids, data, hora ou cidade no texto. |
| motor ligado, leitura parcial      | 4 e 9. Traço parcial fora das conexões, com a ressalva; aviso da Parte II preservado; capítulo 9 disponível                                                                                                                                                                                                  |
| motor desligado, mão clara         | 3 e 5. Motor indisponível: capítulo 8 com U2; capítulo 9 só com referências do capítulo 7 (3 de 9)                                                                                                                                                                                                           |
| motor desligado, foto insuficiente | 7. A foto não chega à prévia; capítulos 8 (U3) e 9 (V1) indisponíveis (0 de 9)                                                                                                                                                                                                                               |

Em todas as execuções:

- nada fica em `localStorage`, `sessionStorage`, cookies ou IndexedDB;
- nenhum `blob:` no DOM;
- nenhuma requisição a outro host.

## 3. Cobertura (fixtures; não estima usuários reais)

| Conjunto                                | Capítulo 8                                                                                                                                                  | Capítulo 9                                |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 84 combinações da avaliação             | 29 dos 66 com as duas fontes (aproximação de expressão 18, diferença de expressão 9, aproximação de ritmo 4); indisponíveis: U5 33, U1 11, U2 6, U6 4, U3 1 | 80 de 84 (78 com 3 temas, 2 com 2); V1: 4 |
| 81 combinações com fixtures construídas | 35 dos 74 com as duas fontes, com todas as variantes (incluindo 4 contrapontos e 12 casos de duas imagens nas mãos); U4 14, U4-misto 14                     | 79 de 81; V2: 2                           |

**Participação dos capítulos no capítulo 9** (84 combinações), para a
avaliação editorial posterior:

| Capítulo | Temas |
| -------- | ----- |
| 1        | 77    |
| 2        | 53    |
| 4        | 46    |
| 3        | 45    |
| 7        | 34    |
| **5**    | **0** |
| **6**    | **0** |

O capítulo 5 não tem assunto aprovado (decisão de não reservar vaga). O
capítulo 6 só tem traços excluídos por D3 e D4.

## 4. Capturas

As capturas estão em `docs/capturas/fase-04d/`, em desktop e mobile:

- `nove-capitulos`, `cap8-diferenca` e `cap9-completo`;
- `cap8-indisponivel` e `cap9-sem-cap8`;
- `so-astrologia` e `cap9-so-astrologia`;
- `parcial` e `cap8-parcial`;
- `cap9-so-maos` e `sem-conteudo`.

Todas foram feitas no servidor de desenvolvimento, com leitura das mãos
simulada e imagem sintética.

## 5. Limitações

- **Só interno:** motor AGPL; em produção, a leitura das mãos responde 503
  até o registro de consentimento estar pronto.
- **Cobertura medida em fixtures:** poucas e não aleatórias (4 dos 11 mapas
  são o mesmo nascimento). A distribuição real só aparece com dados reais.
- **Pergunta de identidade quase sempre presente:** o Sol sempre está
  disponível. Ela vem por último, mas a diferenciação do capítulo 9 é
  limitada (12 combinações distintas de perguntas nas 84).
- **Capítulos 5 e 6 sem participação** no capítulo 9; as perguntas de foco
  estão inativas.
- **O capítulo 8 depende de poucos traços:** só linha do coração e início da
  cabeça. Os traços instáveis (D4) continuam fora até a revalidação visual.
- **A demonstração interna (`?cenario=`)** mantém 8 e 9 como "em definição".
  As fixtures de exemplo não têm pontes.
- **Texto da biblioteca, sem IA:** a naturalidade depende só da revisão
  editorial feita.

## 6. Pendências para a 04E

1. Validação de ponta a ponta com o relatório completo e avaliação editorial
   da participação dos capítulos, incluindo o capítulo 5 e as perguntas de
   foco.
2. Experimento de repetibilidade visual (D4), antes de reconsiderar palma,
   comprimento da cabeça e arco da vida.
3. Revisão de privacidade das pontes antes de qualquer ambiente fora do
   interno.
4. Decisão de licenciamento do motor (AGPL) e registro de consentimento em
   produção (bloqueios já registrados).
5. Medir latência e memória da jornada completa no navegador.
6. Atualizar as fixtures da demonstração interna (`?cenario=`) com pontes,
   se a demonstração precisar mostrar 8 e 9.
