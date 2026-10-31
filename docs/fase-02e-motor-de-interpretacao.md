# Fase 02E — Motor de interpretação astrológica

Base estruturada de conhecimento e regras que transformam o mapa calculado
(`ChartView`, Fase 02D) em interpretações **rastreáveis**, distribuídas em cinco
capítulos. **Não há integração com IA:** apenas o payload e o validador que uma
fase futura usará. Tudo continua restrito ao ambiente interno.

## 1. Auditoria da 02D

Estado inicial: `386f169` (Fase 02D), árvore limpa — as alterações em
`birth-data-form.tsx` e `fase-02d-mandala-natal.md` já estavam nesse commit.

| Ponto                        | Verificação                                                                                                                                                                                           | Resultado                                                                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estações dentro da janela    | Mercúrio em 30/08/2016 (estação no dia), horário desconhecido. Intervalo pelos extremos: **0,6″**, com a posição central **fora** do intervalo. Amostrado a cada 30 min: **≈ 44″**, contendo o centro | **Problema comprovado → corrigido.** `longitudeRangeFromSamples` amostra a janela a cada 30 min (`SAMPLE_STEP_MINUTES`). Novo campo `motionVaries` |
| Casas numa janela aproximada | A validade de Placidus depende só da latitude (não muda na janela). Mas, com ±120 min, um corpo pode passar por 3 casas e a versão antiga listava só as dos extremos (ex.: "7–9" omitia a 8)          | **Corrigido:** `houseVaries` lista todas as casas visitadas; a casa só é afirmada se for a mesma em todas as amostras                              |
| Contratos de saída           | `ChartBody` ganhou `houseVaries: number[] \| null` (antes tupla) e `motionVaries: boolean`. Mandala e tabelas adaptadas sem mudança visual                                                            | Ok                                                                                                                                                 |

Testes novos em `natal-chart/build-chart.test.ts`: estação de Mercúrio e janela
de ±120 min com 3+ casas.

## 2. Arquitetura

```
ChartView (02D)
  └─ facts.ts          extractFacts → Fact[]          (observação calculada + certeza + origem)
       └─ chapters.ts  regras/pesos por capítulo      (cada fato → capítulo de maior peso)
            └─ engine.ts buildInterpretation          (seleção global, dedup, limites, tensões, limitações)
                 ├─ library/authored.ts  textos autorais (prioridade)
                 ├─ library/base.ts      significados de base (textos compostos)
                 └─ ai/payload.ts + ai/validate.ts    (preparação para IA, sem chamada a modelo)
```

Separação obrigatória em cada item: `observation` (dado astronômico,
verificável) × `symbolic` (leitura da tradição). O relatório leva um
`disclaimer` fixo: as interpretações não são fatos científicos, diagnósticos
nem previsões.

## 3. Estrutura da biblioteca

`src/features/interpretation/library/`

- **`base.ts`** (cobertura completa): 10 corpos (função), 12 signos (elemento,
  modalidade, qualidades, eixos de tom), 12 casas, 5 aspectos (natureza e
  dinâmica), regências tradicionais, temas curtos para aspectos.
- **`authored.ts`** (amostra vertical, 94 textos): Sol, Lua, Ascendente,
  Mercúrio e Vênus nos 12 signos (60); 7 casas; 13 combinações de aspectos
  (Sol–Lua, Sol–Saturno, Sol–Marte, Sol–Plutão, Lua–Marte, Mercúrio–Júpiter,
  Vênus–Júpiter, Vênus–Urano, Vênus–Marte); 6 retrogradações; ênfase e
  ausência dos 4 elementos.
- Chaves: `sign:<corpo|asc>:<signo>`, `house:<corpo>:<n>`,
  `aspect:<a>-<b>:<conjunction|harmonious|tense>`, `retro:<corpo|outer>`,
  `element-dominant|element-absent:<elemento>`.
- Sem texto autoral, o motor **compõe** a partir de `base.ts` e marca
  `origin: "composed"`. Ex.: "Com Marte em Peixes, a tradição associa a
  iniciativa, o desejo e a maneira de agir a temas como sensibilidade,
  imaginação e empatia."
- Regras editoriais: segunda pessoa, verbos de possibilidade, linguagem neutra
  quanto a gênero, 1–2 frases, nenhum diagnóstico ou previsão (verificado em
  teste).

## 4. Fatos

| Tipo               | Origem no `ChartView`                  | Certeza                                                |
| ------------------ | -------------------------------------- | ------------------------------------------------------ |
| `body-sign`        | `bodies.<c>.sign/longitude/range`      | incerto se o intervalo cruza signo                     |
| `body-house`       | `bodies.<c>.house` / `houseVaries`     | incerto se a casa varia na janela                      |
| `body-retrograde`  | `bodies.<c>.speed/retrograde`          | incerto se há estação na janela (`motionVaries`)       |
| `angle-sign`       | `angles.asc/mc`                        | incerto se a faixa cruza signo; ausente sem horário    |
| `cusp-sign`        | `houses.cusps[2,3,6]` (casas 3, 4 e 7) | só com horário exato                                   |
| `aspect`           | `aspects[]`                            | incerto se não vale em toda a janela                   |
| `chart-ruler`      | signo do ASC + regente tradicional     | só com ASC determinado; herda a certeza do regente     |
| `element-dominant` | signos dos 10 corpos (≥ 4 no elemento) | mínimo e máximo quando algum corpo pode mudar de signo |
| `element-absent`   | idem (0 no elemento)                   | idem                                                   |

Fatos impossíveis (casas sem horário, ASC sem horário) **não são criados**.

## 5. Regras de seleção e prioridade

Pesos (`chapters.ts`); `t` = exatidão do aspecto, 1,0 com orbe 0° e 0,4 com 10°.

| Capítulo               | Pesos principais                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Identidade          | Sol no signo 100 · ASC 95 · casa do Sol 70 (×1,2 se angular) · regente 65 · aspectos do Sol 50t · aspectos do ASC 35t · elemento enfatizado 40            |
| 2. Mundo emocional     | Lua no signo 100 · casa da Lua 75 · aspectos da Lua 60t · cúspide 4 45 · Água enfatizada 45 / ausente 40                                                  |
| 3. Mente e comunicação | Mercúrio no signo 100 · casa 70 · retrógrado 65 · aspectos 55t · Ar enfatizado 45 / ausente 40 · cúspide 3 40                                             |
| 4. Relacionamentos     | Vênus 100 · Marte 80 · cúspide 7 75 · casa de Vênus 60 · aspectos de Vênus/Marte 55t · Vênus retr. 50 · casa de Marte 45 · Marte retr. 40                 |
| 5. Talentos e desafios | Saturno 75 · Júpiter 70 · casas de Júpiter/Saturno 60 · MC 55 · aspectos do MC 50t · outros aspectos 45t (tensos 42t) · elemento ausente 45 · lentos ≤ 25 |

Seleção (`engine.ts`), determinística:

1. Cada fato gera candidatos nos capítulos cujas regras o aceitam; a lista
   global é ordenada por peso (desempate: ordem do capítulo, id do fato).
2. **Cada fato é usado uma única vez** (vai para o capítulo de maior peso).
3. Máximo de **6 itens por capítulo** e **4 itens por corpo** num capítulo
   (fatos de elemento não contam).
4. **Mesma chave editorial** (ex.: Urano, Netuno e Plutão retrógrados →
   `retro:outer`) vira **um item** com todos os fatos citados.
5. Signos dos lentos (Urano, Netuno, Plutão) e aspectos só entre lentos não
   são interpretados (geracionais).
6. **Incerteza:** aspectos incertos entram com metade do peso e ressalva;
   os demais fatos incertos **não são interpretados** e viram limitação.
7. **Tensões narrativas:** cada signo e texto autoral carrega eixos de tom
   (`ritmo`, `expressao`, `foco`, `vinculo`). Dois itens do mesmo capítulo em
   lados opostos de um eixo geram uma `NarrativeTension`, com orientação para
   apresentá-los como facetas que convivem.
8. **Limitações** por capítulo: ASC/regente/MC sem horário, casas não
   calculadas ou variáveis, signos/estações incertos.

## 6. Rastreabilidade

`InterpretationItem.factIds` → `Fact.source` (caminhos no `ChartView`) →
`ChartView.parameters` (versão de cálculo, tzdb, instante UTC, dia juliano).
O relatório inclui **todos** os fatos extraídos (inclusive os não usados) e
`basis` (precisão, versão de cálculo, sistema de casas, zodíaco, regências).
Testes garantem que toda observação de item contém a observação do fato e
que os fatos copiam signos, casas e aspectos do cálculo.

## 7. Estratégia de IA (preparada, não integrada)

- `toAiPayload(report)`: regras, disclaimer, base, e por capítulo só os itens
  selecionados (`observation`, `interpretation`, `certainty`, `caveat`),
  limitações e tensões. Nenhum dado de nascimento, nenhum fato não selecionado.
- Saída esperada (`AI_OUTPUT_SCHEMA`): `{ chapters: [{ id, paragraphs: [{ text, itemIds }] }] }`.
- `validateAiOutput(output, report)` recusa: formato inválido; capítulos
  desconhecidos, repetidos ou ausentes; `itemIds` de outro capítulo;
  "<corpo> em <signo>", "casa N", nomes de aspectos e graus que não constem
  nos itens citados; linguagem determinista/clínica ("certamente",
  "comprovado", "diagnóstico", "você vai"…); item incerto sem ressalva.
- Fluxo futuro: motor → payload → modelo → validador → (falhou? descarta e
  usa os textos da biblioteca). O modelo nunca recebe o `ChartView`.

## 8. Exemplo completo (mapa fictício)

São Paulo, 12/05/1990, 14:30 (horário exato) — 55 fatos extraídos, 28 itens
selecionados (16 autorais, 12 compostos). Fonte:
`src/features/interpretation/__fixtures__/example-report.sao-paulo-1990.json`
(snapshot de regressão).

### 1. Sua identidade astrológica

| #   | Fato(s)                  | Observação (calculada)                                                                     | Interpretação (simbólica)                                                                                                                                                                                             | Origem   | Peso  |
| --- | ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----- |
| 1   | `body-sign:sun`          | Sol a 21°43′ de Touro.                                                                     | Com o Sol em Touro, a identidade é tradicionalmente ligada à construção paciente: você pode se sentir mais em casa quando cultiva o que é concreto, belo e duradouro.                                                 | autoral  | 100   |
| 2   | `angle-sign:asc`         | Ascendente a 24°45′ de Virgem.                                                             | Com o Ascendente em Virgem, a aproximação ao mundo é tradicionalmente analítica e cuidadosa: você pode perceber detalhes e oferecer ajuda prática.                                                                    | autoral  | 95    |
| 3   | `body-house:sun`         | Sol na casa 8 (Placidus).                                                                  | O Sol na casa 8 é tradicionalmente associado a buscar identidade nas experiências de profundidade: crises, intimidade e transformações podem ser momentos de autodescoberta.                                          | autoral  | 70    |
| 4   | `chart-ruler:mercury`    | O Ascendente em Virgem tem como regente tradicional Mercúrio, a 8°37′ de Touro, na casa 8. | Com o Ascendente em Virgem, o regente tradicional do mapa é Mercúrio. A tradição sugere que o modo de pensar, aprender e se comunicar — aqui em Touro, na casa 8 — ganha peso especial na condução da sua trajetória. | composta | 65    |
| 5   | `aspect:asc-sun:trine`   | Sol em trígono com Ascendente (orbe 3,03°).                                                | Na tradição, o trígono entre o Sol e o Ascendente sugere que a identidade e a forma de se apresentar fluem com naturalidade, como um talento que se exerce com facilidade.                                            | composta | 40,91 |
| 6   | `element-dominant:earth` | 5 de 10 corpos em signos de Terra: Sol, Mercúrio, Saturno, Urano, Netuno.                  | Muitos corpos em signos de Terra são associados a senso prático e constância: construir com as próprias mãos pode trazer satisfação.                                                                                  | autoral  | 40    |

### 2. Seu mundo emocional

| #   | Fato(s)                     | Observação (calculada)                                  | Interpretação (simbólica)                                                                                                                                                     | Origem   | Peso  |
| --- | --------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----- |
| 1   | `body-sign:moon`            | Lua a 23°35′ de Sagitário.                              | A Lua em Sagitário, na tradição, busca sentido e movimento: otimismo, aventura e espaço para explorar podem renovar o seu ânimo.                                              | autoral  | 100   |
| 2   | `body-house:moon`           | Lua na casa 3 (Placidus).                               | A Lua na casa 3 é associada a emoções que circulam pela comunicação: conversas, escrita e o convívio com o entorno próximo podem acalmar você.                                | autoral  | 75    |
| 3   | `aspect:asc-moon:square`    | Lua em quadratura com Ascendente (orbe 1,16°).          | Na tradição, a quadratura entre a Lua e o Ascendente sugere que as emoções e a forma de se apresentar geram atrito, um desafio que costuma impulsionar crescimento.           | composta | 55,82 |
| 4   | `aspect:mc-moon:opposition` | Lua em oposição com Meio do Céu (orbe 2,82°).           | Na tradição, a oposição entre a Lua e o Meio do Céu sugere que as emoções e a vocação puxam em direções opostas e pedem integração e equilíbrio.                              | composta | 49,84 |
| 5   | `cusp-sign:4`               | Cúspide da casa 4 (Fundo do Céu) a 26°24′ de Sagitário. | Com a cúspide da casa 4 (Fundo do Céu) em Sagitário, a tradição associa as raízes, o lar e a vida íntima a temas como busca de sentido, entusiasmo e amplitude de horizontes. | composta | 45    |

### 3. Sua mente e comunicação

| #   | Fato(s)                          | Observação (calculada)                                   | Interpretação (simbólica)                                                                                                                                                             | Origem   | Peso  |
| --- | -------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----- |
| 1   | `body-sign:mercury`              | Mercúrio a 8°37′ de Touro.                               | Mercúrio em Touro é tradicionalmente ligado a um raciocínio prático e constante: você pode preferir ideias testadas e aprender no seu próprio ritmo.                                  | autoral  | 100   |
| 2   | `body-house:mercury`             | Mercúrio na casa 8 (Placidus).                           | Mercúrio na casa 8 é tradicionalmente ligado a uma mente que investiga: temas profundos, psicologia e o que está por trás das aparências podem atrair a sua atenção.                  | autoral  | 70    |
| 3   | `body-retrograde:mercury`        | Mercúrio em movimento retrógrado (-0,3196°/dia).         | Mercúrio retrógrado no nascimento é associado, na tradição, a um pensamento que revisa e reelabora: você pode preferir refletir antes de falar e voltar às ideias para aprofundá-las. | autoral  | 65    |
| 4   | `aspect:jupiter-mercury:sextile` | Mercúrio em sextil com Júpiter (orbe 0,40°, separativo). | Mercúrio em aspecto harmonioso com Júpiter é associado a uma mente que gosta de ampliar horizontes: aprender e ensinar podem ser atividades naturais para você.                       | autoral  | 53,69 |
| 5   | `cusp-sign:3`                    | Cúspide da casa 3 a 1°19′ de Sagitário.                  | Com a cúspide da casa 3 em Sagitário, a tradição associa a comunicação, o aprendizado e o entorno próximo a temas como busca de sentido, entusiasmo e amplitude de horizontes.        | composta | 40    |

### 4. Seus relacionamentos e vínculos

| #   | Fato(s)                      | Observação (calculada)                                  | Interpretação (simbólica)                                                                                                                                                | Origem   | Peso  |
| --- | ---------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----- |
| 1   | `body-sign:venus`            | Vênus a 9°39′ de Áries.                                 | Vênus em Áries é associada a um afeto espontâneo e entusiasmado: você pode se encantar com a conquista e com relações que tenham vitalidade.                             | autoral  | 100   |
| 2   | `body-sign:mars`             | Marte a 16°16′ de Peixes.                               | Com Marte em Peixes, a tradição associa a iniciativa, o desejo e a maneira de agir a temas como sensibilidade, imaginação e empatia.                                     | composta | 80    |
| 3   | `cusp-sign:7`                | Cúspide da casa 7 (Descendente) a 24°45′ de Peixes.     | Com a cúspide da casa 7 (Descendente) em Peixes, a tradição associa as parcerias e os encontros com o outro a temas como sensibilidade, imaginação e empatia.            | composta | 75    |
| 4   | `body-house:venus`           | Vênus na casa 7 (Placidus).                             | Vênus na casa 7 é associada à importância das parcerias: o encontro com o outro pode ser um campo central de aprendizado e prazer.                                       | autoral  | 60    |
| 5   | `aspect:mars-pluto:trine`    | Marte em trígono com Plutão (orbe 0,03°, separativo).   | Na tradição, o trígono entre Marte e Plutão sugere que a ação e a intensidade fluem com naturalidade, como um talento que se exerce com facilidade.                      | composta | 54,9  |
| 6   | `aspect:uranus-venus:square` | Vênus em quadratura com Urano (orbe 0,41°, separativo). | Vênus em aspecto tenso com Urano é tradicionalmente ligada à tensão entre proximidade e liberdade: relações que acolham a sua independência podem ser mais sustentáveis. | autoral  | 53,63 |

**Tensões:** eixo `vinculo` entre `relacionamentos:body-sign:venus` e `relacionamentos:body-sign:mars` — Estes itens apontam para lados diferentes do eixo vínculo (autonomia × proximidade). A redação deve apresentá-los como facetas que convivem, não como contradição a resolver nem como erro.

### 5. Seus talentos e desafios

| #   | Fato(s)              | Observação (calculada)                | Interpretação (simbólica)                                                                                                                       | Origem   | Peso |
| --- | -------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---- |
| 1   | `body-sign:saturn`   | Saturno a 25°17′ de Capricórnio.      | Com Saturno em Capricórnio, a tradição associa a estrutura, os limites e o amadurecimento a temas como responsabilidade, ambição e paciência.   | composta | 75   |
| 2   | `body-sign:jupiter`  | Júpiter a 9°01′ de Câncer.            | Com Júpiter em Câncer, a tradição associa a expansão, a confiança e a busca de sentido a temas como cuidado, memória afetiva e proteção.        | composta | 70   |
| 3   | `body-house:jupiter` | Júpiter na casa 10 (Placidus).        | Júpiter na casa 10 é tradicionalmente ligado à expansão pela vocação: a vida profissional pode ser um campo de crescimento e de sentido.        | autoral  | 60   |
| 4   | `body-house:saturn`  | Saturno na casa 5 (Placidus).         | Saturno na casa 5 é associado a levar a sério a autoexpressão: a criatividade pode amadurecer com disciplina e ganhar consistência com o tempo. | autoral  | 60   |
| 5   | `angle-sign:mc`      | Meio do Céu a 26°24′ de Gêmeos.       | Com o Meio do Céu em Gêmeos, a tradição associa a vocação e a imagem pública a temas como curiosidade, versatilidade e troca de ideias.         | composta | 55   |
| 6   | `element-absent:air` | Nenhum dos 10 corpos em signos de Ar. | A ausência de corpos em signos de Ar é lida como um convite a dar palavras ao que sente e a buscar outras perspectivas.                         | autoral  | 45   |

Com o mesmo nascimento e **horário aproximado (±120 min)**, o ASC (variação de
77,8°) e o MC deixam de ser interpretados, todas as casas viram limitação
("o Sol (casas 7, 8, 9)") e entram aspectos que antes ficavam de fora. Com
**horário desconhecido**, aspectos da Lua que não valem o dia inteiro entram
com metade do peso e ressalva.

## 9. Testes

`src/features/interpretation/engine.test.ts` — 38 testes, dados fictícios,
motor real (Swiss Ephemeris):

| Grupo                   | O que garante                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| Seleção e prioridade    | 5 capítulos, ≤ 6 itens, fato central abrindo cada capítulo, ordem por peso, exatidão dos aspectos      |
| Associação capítulo     | Todo item é aceito pela regra do seu capítulo (exato, aproximado, desconhecido)                        |
| Posições não inventadas | Fatos = cálculo; itens → fatos existentes; textos da biblioteca passam no validador                    |
| Horário desconhecido    | Sem ASC/MC/casas/cúspides/regente; limitações; aspectos incertos com ressalva                          |
| Horário aproximado      | ASC incerto não interpretado; casas variáveis só como limitação; sem cúspides nem aspectos com ângulos |
| Dados incertos/ausentes | Signo que muda na janela, estação, mapa sem aspectos                                                   |
| Repetição e tensões     | Nenhum fato/chave/texto repetido; agrupamento de `retro:outer`; tensão Vênus × Marte                   |
| Biblioteca              | Formato das chaves; sem linguagem determinista                                                         |
| IA                      | Payload só com itens selecionados; validador recusa invenções, citações erradas e falta de ressalva    |
| Estabilidade            | Mesma entrada → mesma saída; snapshot do relatório de exemplo                                          |

## 10. Limitações

- **Amostra vertical:** 94 textos autorais; o restante é composto a partir de
  significados de base (correto, porém menos rico). Marte, Júpiter e Saturno
  nos signos e a maioria das casas e aspectos ainda são compostos.
- **Regências tradicionais** apenas (sem Urano/Netuno/Plutão como regentes).
- Sem Nodos, Quíron, partes, dignidades, estelia, padrões (T-quadrada, grande
  trígono) nem interceptações.
- Eixos de tom são uma heurística editorial; não detectam toda contradição.
- O validador é léxico: detecta afirmações explícitas ("Sol em Leão", "casa
  12", "quadratura"), não paráfrases ("seu Sol leonino").
- Pesos definidos editorialmente; precisam de revisão com especialista.
- Interface: nada exibido ainda (o relatório é produzido só em código e testes).

## 11. Arquivos

Novos: `src/features/interpretation/{contract,facts,chapters,engine}.ts`,
`library/{base,authored}.ts`, `ai/{payload,validate}.ts`, `engine.test.ts`,
`__fixtures__/example-report.sao-paulo-1990.json`, este documento.

Alterados: `natal-chart/{build-chart,contract}.ts`,
`natal-chart/build-chart.test.ts`, `natal-chart/components/{body-details,chart-tables}.tsx`,
`.prettierignore`, `docs/{ARCHITECTURE,DECISIONS,fase-02d-mandala-natal}.md`, `README.md`.
