# Fase 04D — Especificação editorial dos capítulos 8 e 9

> **Histórico.** Para a revisão dos textos, das correspondências e das regras dos capítulos 8 e 9, a referência única é `docs/fase-04d-biblioteca-consolidada.md`.

Estado: **proposta para aprovação.** Nenhum código foi implementado, nenhum
motor foi alterado e não houve chamada paga nem deploy. Todos os textos
marcados como **[PROPOSTA]** precisam de aprovação editorial antes da
implementação.

Títulos preservados (`src/content/report-chapters.ts`):

- Capítulo 8: **Conexões simbólicas entre céu e mãos**: "Onde as duas
  leituras conversam — e onde divergem."
- Capítulo 9: **Seu guia pessoal de reflexão**: "Perguntas e práticas para
  levar a leitura ao cotidiano."

---

## 1. Investigação: o que já existe

### 1.1 Lado astrológico (capítulos 1–5)

| Elemento             | Onde                                     | O que oferece                                                                                                                                                                                                                                                 |
| -------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Fact`               | `interpretation/contract.ts`, `facts.ts` | Fato calculado, com `id` estável (`body-sign:sun`), `certainty` (`determined` ou `uncertain`), corpos, signo e casa                                                                                                                                           |
| `InterpretationItem` | idem                                     | `id` (`identidade:body-sign:sun`), `factIds`, `certainty`, `symbolic` (texto da tradição), `caveat`, `score` e **`tags: ToneTag[]`**                                                                                                                          |
| **`ToneTag`**        | `library/base.ts`                        | **Vocabulário de tom já existente**, com quatro eixos de dois polos: `ritmo` (impulso × cautela), `expressao` (expansiva × reservada), `foco` (mudança × estabilidade) e `vinculo` (autonomia × proximidade). Os rótulos ficam em `AXIS_LABELS` (`engine.ts`) |
| Origem das etiquetas | `engine.ts` (`tagsFor`)                  | Só itens de **signo** de um corpo ou do Ascendente (`SIGN_MEANINGS[signo].tags`; o Meio do Céu não recebe etiqueta) e as entradas autorais de ênfase de elemento. Casas, aspectos, cúspides, regente e retrogradação **não** têm etiqueta                     |
| `NarrativeTension`   | `engine.ts` (`tensionsOf`)               | Num mesmo capítulo, dois itens em polos opostos do mesmo eixo, com a nota "facetas que convivem, não contradição"                                                                                                                                             |
| `limitations`        | `ChapterInterpretation`                  | O que ficou de fora por causa do horário (Ascendente, casas e signos incertos)                                                                                                                                                                                |
| Perguntas            | `ai/library-chapter.ts` (`QUESTIONS`)    | **Duas perguntas fixas por capítulo**, iguais para todas as pessoas (por exemplo, cap. 4: "Que equilíbrio entre proximidade e espaço próprio parece bom para você hoje?")                                                                                     |
| Validador            | `ai/validate.ts`                         | `FORBIDDEN_PATTERNS` (certeza, ciência, destino), `SENSITIVE_PATTERNS` (saúde, finanças, rupturas), `PRECISION_PATTERNS`, `REPETITION`, `CROSS_REFERENCE` e `UNKNOWN_ITEM`                                                                                    |

### 1.2 Lado das mãos (capítulos 6–7)

| Elemento              | Onde                                         | O que oferece                                                                                                                                                                                                                 |
| --------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Características       | `analysis/contract.ts` (`FEATURE_VALUES`)    | Nove características em categorias fechadas: palma, dedos, coração (comprimento e traçado), cabeça (comprimento, inclinação e início), arco da vida e destino (presença)                                                      |
| Visibilidade          | idem                                         | `clear` → `determined`; `partial` → `uncertain`, com a ressalva `PARTIAL_CAVEAT`; `not_visible` não gera item, só limitação (com motivos, inclusive `unclassifiable`)                                                         |
| `PalmItem`            | `analysis/engine.ts`                         | `id` (`linhas:heart.shape:curved`), `factIds`, `certainty`, `observation` (frase do sistema) e `symbolic`. **Não tem etiquetas**                                                                                              |
| Tipo de mão           | idem (`HAND_TYPES`)                          | Terra, Ar, Fogo ou Água: combinação de palma e dedos da **quiromancia moderna** (Gettings, 1965), identificada como tal                                                                                                       |
| Ressalvas permanentes | `library.ts`                                 | `PROPORTION_CAVEAT`: palma e dedos são "proporções estimadas a olho"                                                                                                                                                          |
| Confiabilidade medida | `docs/fase-03f2-plano.md`                    | Com a **mesma foto**, três características inverteram: formato da palma, comprimento da linha da cabeça e arco da vida. O experimento de repetibilidade (`docs/experimento-repetibilidade-visual.md`) ainda aguarda aprovação |
| Estados da leitura    | `validate-observation.ts`, `presentation.ts` | `complete`, `partial` ou `insufficient`, além de `retakeRecommended` e `simulated`                                                                                                                                            |
| Perguntas             | `chapters/library-draft.ts`                  | Uma ou duas por capítulo, montadas só com os tópicos do capítulo ("Entre a linha do coração e a linha da cabeça, qual leitura conversa mais com o que você vive hoje?")                                                       |
| Validador             | `chapters/validate.ts`, `editorial.ts`       | Linguagem proibida, atributos sensíveis, característica não sustentada, gênero presumido e seção redundante                                                                                                                   |

### 1.3 O que chega à jornada hoje (04B/04C)

`toJourneySky` e `toJourneyHands` copiam **só o texto**. Por decisão de
privacidade e de apresentação, `itemIds`, `factIds`, etiquetas e certeza
**não** chegam à jornada. Ou seja: hoje, os capítulos 8 e 9 **não teriam
como rastrear** de onde vem cada tema. Por isso é preciso a extensão de
contrato da seção 7.

### 1.4 O que pode ser relacionado sem criar interpretação

- **Pode:** o eixo e o polo de um item astrológico, que já vêm da biblioteca
  (`ToneTag`), e o eixo e o polo de um traço da mão, **desde que** a própria
  frase simbólica já aprovada da biblioteca de quiromancia use o termo do
  polo (tabela 2.2).
- **Não pode:**
  - casas, aspectos, cúspides e regente, que não têm etiqueta, nem o Meio do
    Céu;
  - inferir um polo a partir do texto livre de um item astrológico;
  - qualquer relação de causa entre os dois sistemas;
  - os **elementos** (veja a regra de homonímia, 2.3).

---

## 2. Fundamentação editorial do vocabulário comum

### 2.1 Decisão: não criar taxonomia nova

O vocabulário da ponte é o **mesmo dos quatro eixos de `ToneTag`**, que já
existe, já foi aprovado na Fase 02E e já é usado nos capítulos 1–5. Nenhum
eixo, polo ou tema novo é criado.

O motivo é editorial: os eixos descrevem **modos** (ritmo, expressão, foco e
vínculo), não traços comprovados. Os dois lados já usam essas mesmas palavras
nos textos aprovados. Assim, aproximar as duas leituras é uma comparação de
**vocabulário simbólico**, nunca uma correspondência entre tradições.

### 2.2 Etiquetas das mãos [PROPOSTA]

Regra: um traço da mão só recebe um polo quando o texto `symbolic` já
aprovado dele (biblioteca `03f2.1`) contém a palavra do polo ou um sinônimo
direto. Abaixo está a citação literal que justifica cada etiqueta.

| Traço (valor)                 | Termo no texto aprovado                                        | Polo proposto         | Uso no cap. 8                     |
| ----------------------------- | -------------------------------------------------------------- | --------------------- | --------------------------------- |
| `heart.length` `short`        | "afeto mais **reservado**, que se revela aos poucos"           | `expressao:reservada` | Sim                               |
| `heart.length` `long`         | "afeto **expansivo** e generoso"                               | `expressao:expansiva` | Sim                               |
| `heart.length` `medium`       | "equilíbrio entre expressar… e preservar"                      | — (equilíbrio)        | Não                               |
| `heart.shape` `straight`      | "modo mais racional e **contido**"                             | `expressao:reservada` | Sim                               |
| `heart.shape` `curved`        | "expressão afetiva calorosa e **aberta**"                      | `expressao:expansiva` | Sim                               |
| `head.start` `joined_life`    | "associar isso à **cautela**"                                  | `ritmo:cautela`       | Sim                               |
| `head.start` `separate`       | "**independência** e disposição para seguir o próprio caminho" | `vinculo:autonomia`   | Sim                               |
| `hand.fingerLength` `short`   | "modo de agir **rápido e direto**"                             | `ritmo:impulso`       | **Decisão D3** (proporção)        |
| `hand.fingerLength` `long`    | "gosto por **pensar antes de agir**"                           | `ritmo:cautela`       | **Decisão D3** (proporção)        |
| `hand.fingerLength` `medium`  | "equilíbrio entre impulso e reflexão"                          | —                     | Não                               |
| `hand.palmShape` (ambos)      | —                                                              | não etiquetar         | Não (instável na 03F.2)           |
| `head.length` (todos)         | —                                                              | não etiquetar         | Não (instável na 03F.2)           |
| `life.arc` (ambos)            | —                                                              | não etiquetar         | Não (instável na 03F.2)           |
| `hand.type` (todos)           | —                                                              | não etiquetar         | Não (depende da palma; homonímia) |
| `head.slope`, `fate.presence` | nenhum termo de polo                                           | —                     | Não                               |

Resultado: o eixo `foco` **não tem nenhum traço da mão** utilizável, e isso é
intencional. Os traços instáveis não recebem etiqueta, mesmo que o texto
permita (por exemplo, "abertura para novas experiências" no arco amplo). A
etiqueta deles só pode ser reconsiderada se o experimento de repetibilidade
os classificar como estáveis.

### 2.3 Regra de homonímia: elementos

A astrologia usa os elementos Fogo, Terra, Ar e Água para os signos. A
quiromancia moderna usa os mesmos nomes para os tipos de mão. **São
classificações independentes que compartilham nomes.** O capítulo 8 **nunca**
aproxima elemento com elemento: "mão de Terra" e "ênfase em Terra" não são
uma conexão. Por isso:

- os itens `element-dominant` e `element-absent` não entram na ponte (são
  agregados e trazem esse risco; um deles fala em "construir com as próprias
  mãos");
- o tipo de mão não entra na ponte;
- o validador recusa "Fogo", "Terra", "Ar", "Água" e "mão de" no texto do
  capítulo 8.

---

## 3. Capítulo 8 — Conexões simbólicas entre céu e mãos

### 3.1 Papel no produto

O capítulo 8 mostra **onde as duas leituras usam imagens parecidas e onde
apontam para lados diferentes**, sempre citando de onde vem cada imagem. É um
capítulo de **comparação**, não de conclusão. Ele não acrescenta nenhum
significado: organiza o que os capítulos 1–7 já disseram.

### 3.2 Itens elegíveis

| Lado | Entra na ponte                                                                                                                                       | Não entra                                                                                                                                                |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Céu  | Itens entregues nos capítulos 1–5 com `certainty: "determined"`, `tags` não vazias, de tipo `body-sign` (Sol a Saturno) ou `angle-sign` (Ascendente) | `uncertain` (por exemplo, Ascendente com horário aproximado ou desconhecido), corpos lentos (Urano, Netuno, Plutão: geracionais), elementos, Meio do Céu |
| Mãos | Itens entregues nos capítulos 6–7 com `certainty: "determined"` (visibilidade `clear`), em traço da lista da tabela 2.2                              | `partial` (com ressalva), `not_visible`, traços instáveis ou sem polo; leitura com `retakeRecommended`                                                   |

**Características indeterminadas nunca sustentam conexões.** Um item
parcial pode aparecer na lista "o que ficou de fora", nunca como base de um
tema.

### 3.3 Combinação por eixo

Para cada eixo, junte os polos dos itens elegíveis de cada lado.

| Situação no eixo                                                     | Relação                         | Como aparece                                                               |
| -------------------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------------------- |
| A mão tem o polo P; o céu tem P e não tem o oposto                   | **Aproximação**                 | "As duas leituras usam a imagem de…"                                       |
| A mão tem P; o céu tem P **e** o oposto                              | **Aproximação com contraponto** | Igual à anterior, **e o contraponto do céu é sempre citado**               |
| A mão tem P; o céu tem só o oposto                                   | **Diferença**                   | "Aqui as leituras apontam para lados diferentes…", sem conciliação         |
| A mão tem os dois polos no eixo (por exemplo, coração curto e curvo) | **Facetas na mão**              | Mostra as duas imagens da mão e o que o céu traz, sem declarar aproximação |
| Só um lado tem o eixo                                                | —                               | Não vira tema                                                              |

Regras de redação:

- **Nunca** "confirma", "comprova", "reforça", "as duas mostram que você é",
  "não é coincidência", "prova" ou "evidência".
- Uma aproximação é descrita como **semelhança de imagens entre duas
  tradições**, nunca como indício de personalidade.
- Uma diferença não é suavizada ("no fundo é a mesma coisa") nem explicada
  ("talvez porque…").

### 3.4 Seleção e quantidade

- **No máximo 3 temas**, um por eixo. Hoje, só `ritmo`, `expressao` e
  `vinculo` podem ter os dois lados, então 3 é também o teto natural.
- **No mínimo 1 tema** para o capítulo ter conteúdo.
- **Diferenças não podem ser ocultadas.** Se existe uma diferença, ela
  entra, mesmo que reste espaço só para ela.
- Ordem: diferenças e aproximações intercaladas, por ordem fixa dos eixos
  (`ritmo`, `expressao`, `vinculo`, `foco`); ordem determinística.
- Referências por tema: até **3 do céu** (preferindo capítulos diferentes e,
  dentro do capítulo, o maior `score`) e até **2 das mãos**. O contraponto
  cita até 2 referências.
- As referências são **rótulos curtos** já existentes, nunca o texto
  simbólico completo, que já está nos capítulos 1–7:
  - céu: "Sol em Touro (cap. 1)", montado com `BODY_MEANINGS.name` e
    `SIGN_MEANINGS.name`;
  - mãos: "linha do coração curvando-se para cima (cap. 7)", montado com
    `observation` da biblioteca 03C.

### 3.5 Estrutura

1. **Introdução fixa** [PROPOSTA]:
   > Este capítulo compara as imagens que a astrologia e a quiromancia usaram
   > nos capítulos anteriores. São duas tradições simbólicas independentes:
   > quando usam imagens parecidas, isso é uma semelhança de linguagem, não
   > uma confirmação de quem você é. Quando apontam para lados diferentes, as
   > duas imagens ficam lado a lado.
2. **Temas** (1 a 3). Cada tema tem:
   - título do eixo (por exemplo, "Ritmo: impulso e cautela");
   - selo da relação;
   - "No céu" e "Nas mãos", com as referências;
   - **uma frase-ponte autoral** da biblioteca do capítulo 8: uma por
     combinação de eixo × polo × relação, até 24 frases fixas, todas
     [PROPOSTA].
3. **O que ficou de fora**, escrito pelo sistema:
   - traços parciais ou indeterminados;
   - traços de confiabilidade limitada ("variaram entre análises da mesma
     foto" ou "proporções estimadas a olho");
   - pontos astrológicos incertos por causa do horário.

   No máximo 3 frases, no molde de `condensedLimitations`.

4. **Síntese fixa por padrão** [PROPOSTA], escolhida pelo conjunto de
   relações:
   - só aproximações;
   - só diferenças;
   - misto.

   A síntese não traz números nem juízo de força.

5. **Limitações**:
   - aviso fixo: "Semelhanças entre tradições simbólicas não comprovam traços
     de personalidade";
   - a nota de leitura simulada, quando houver.
6. **Sem perguntas.** As perguntas ficam para o capítulo 9, que retoma os
   temas daqui. Isso evita repetição.

Extensão visual: `ChapterArticleData.sections[]` recebe dois campos
opcionais. `heading` leva o título do eixo e o selo. `refs` traz listas com
rótulo ("No céu", "Nas mãos" e "No céu, o outro lado"). Hoje o rótulo
`observed` é fixo ("Observado na foto") e não serve para isso.

---

## 4. Capítulo 9 — Seu guia pessoal de reflexão

### 4.1 Papel no produto

O capítulo 9 é o fechamento prático do relatório. Ele escolhe **poucos**
temas da leitura da pessoa e devolve perguntas e uma prática de observação
para o dia a dia, **convidando também a discordar**. Não promete resultado,
não prevê nada e não diagnostica.

### 4.2 Seleção dos temas (no máximo 3, um por eixo)

Por prioridade:

1. temas do capítulo 8, na mesma ordem;
2. tensões narrativas dos capítulos 1–5 (`NarrativeTension`, já calculadas
   pelo motor), num eixo ainda não usado;
3. eixo com mais referências elegíveis num só lado, quando falta um dos
   lados. Nesse caso o tema é rotulado com a tradição de origem ("na leitura
   do céu").

Cada tema traz:

- **retomada**: uma linha com referências, sem repetir o texto simbólico
  (por exemplo, "Ritmo — capítulos 1, 3 e 7");
- **pergunta do eixo** [PROPOSTA]: duas perguntas autorais por eixo, uma
  para cada relação (com contraponto ou diferença, e sem). São 8 perguntas
  no total, neutras quanto à tradição, para servir também quando só um lado
  existe.

### 4.3 Perguntas retomadas

- No máximo **2 perguntas já existentes** dos capítulos 1–7, copiadas
  **literalmente** e marcadas com a origem ("retomada do capítulo 1").
- Elas saem de capítulos **não representados** nos temas.
- Têm preferência as perguntas que convidam a discordar, por exemplo a do
  cap. 1: "Qual dessas descrições combina menos com a sua experiência, e por
  quê?".

### 4.4 Prática e fechamento

- **Uma prática de observação** [PROPOSTA], ligada ao primeiro tema. São 4
  práticas autorais, uma por eixo, e mais uma genérica. Por exemplo:
  > Durante uma semana, anote um momento em que você agiu de imediato e outro
  > em que preferiu esperar. Depois, compare com o que os capítulos citados
  > descrevem — inclusive no que não combina.
- **Uma pergunta de fechamento fixa** [PROPOSTA]:
  > Qual destas leituras você quer observar com mais atenção nas próximas
  > semanas — e qual você prefere deixar de lado?
- **Nota final fixa** [PROPOSTA]: o relatório é um ponto de partida para
  reflexão, não uma descrição definitiva, um conselho profissional nem uma
  previsão.

### 4.5 Quantidade

O capítulo tem **de 4 a 7 itens de reflexão**:

| Item                   | Quantidade             |
| ---------------------- | ---------------------- |
| Perguntas de eixo      | de 1 a 3, uma por tema |
| Perguntas retomadas    | de 0 a 2               |
| Prática                | 1                      |
| Pergunta de fechamento | 1                      |

### 4.6 Repetição e personalização

- Nenhuma frase do capítulo 9 repete uma frase simbólica dos capítulos 1–8
  (conferido com a mesma normalização de `REPETITION`).
- Cada eixo aparece uma vez.
- Cada pergunta aparece uma vez no capítulo.
- As perguntas retomadas são as únicas repetições permitidas, sempre
  marcadas e limitadas a 2.
- **Personalização sem invenção:**
  - o que muda de pessoa para pessoa é **a seleção** (quais eixos, quais
    capítulos, quais referências e qual variante de pergunta);
  - o texto é sempre o da biblioteca;
  - nada descreve a pessoa ("você é…"). As perguntas perguntam.

### 4.7 Relação com o capítulo 8

O capítulo 9 **retoma** os temas do capítulo 8 como perguntas, em vez de
repetir a comparação. Com o capítulo 8 indisponível, o capítulo 9 continua
possível com os temas de um lado só (4.2, itens 2 e 3), **sem mencionar
nenhuma conexão**.

---

## 5. Cenários parciais e indisponíveis

| #   | Cenário                                                                      | Capítulo 8                                                                                                                                                                                                 | Capítulo 9                                                                                                            |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1   | Capítulos 1–7 disponíveis                                                    | Conforme a seção 3. Sem nenhum tema elegível: **indisponível** — "As duas leituras não usaram imagens comparáveis com segurança suficiente; nenhuma conexão foi criada para preencher o capítulo."         | Completo                                                                                                              |
| 2   | Só os capítulos 1–5                                                          | **Indisponível** — "As conexões precisam das duas leituras, e a leitura das mãos não está nesta jornada." Nada de "conexões" internas do céu                                                               | Versão do céu: temas de tensões e eixos dos capítulos 1–5; a introdução diz que se baseia só no mapa                  |
| 3   | Só os capítulos 6–7                                                          | **Indisponível** — motivo equivalente, referindo os dados de nascimento                                                                                                                                    | Versão das mãos: eixos dos traços elegíveis e perguntas dos capítulos 6–7; disponível se o mínimo de 5.1 for atingido |
| 4   | Leitura das mãos parcial                                                     | Só traços nítidos e estáveis entram; os parciais vão para "o que ficou de fora". Sem tema: indisponível com o motivo da parcialidade. Com `retakeRecommended`: indisponível, com a orientação de nova foto | Usa o que houver; os temas das mãos só com traços nítidos                                                             |
| 5   | Informação insuficiente (por exemplo, céu indisponível e mãos insuficientes) | Indisponível                                                                                                                                                                                               | **Indisponível** — "Não há leitura suficiente nesta jornada para montar um guia de reflexão sem inventar temas."      |
| —   | Horário aproximado ou desconhecido                                           | O Ascendente e os demais itens incertos saem da ponte e aparecem em "o que ficou de fora"                                                                                                                  | Igual                                                                                                                 |
| —   | Leitura das mãos simulada (ambiente interno)                                 | Disponível, com aviso de parte: "baseado em observação simulada"                                                                                                                                           | Igual                                                                                                                 |

### 5.1 Mínimo do capítulo 9

O capítulo 9 só é publicado com pelo menos **3 itens de reflexão antes do
fechamento**, vindos de pelo menos **2 capítulos com conteúdo**. Abaixo
disso, ele fica indisponível com o motivo. **Nunca há uma falsa conexão
entre céu e mãos quando uma das fontes está ausente:** o capítulo 9 de um
lado só não usa as palavras "conexão", "as duas leituras" nem "céu e mãos".

---

## 6. Exemplos (construídos só com dados de teste do projeto)

> **EXEMPLO — não é a leitura de ninguém.** Céu: fixture
> `interpretation/__fixtures__/example-report.sao-paulo-1990.json` (horário
> exato). Mãos: fixture `clearHand` de
> `palm-reading/analysis/__fixtures__/observations.ts`. As frases-ponte e
> as perguntas de eixo são [PROPOSTA].

### 6.1 Itens elegíveis do exemplo

- **Céu (com etiqueta e determinados):**
  - Sol em Touro (cap. 1): cautela e estabilidade;
  - Ascendente em Virgem (cap. 1): cautela;
  - Lua em Sagitário (cap. 2): mudança, expansiva e autonomia;
  - Mercúrio em Touro (cap. 3): cautela e estabilidade;
  - Vênus em Áries (cap. 4): impulso e autonomia;
  - Marte em Peixes (cap. 4): proximidade;
  - Saturno em Capricórnio (cap. 5): cautela e reservada;
  - Júpiter em Câncer (cap. 5): proximidade e reservada.

  A ênfase em Terra fica fora pela regra de homonímia.

- **Mãos (nítidas e na lista):**
  - linha do coração longa: expansiva;
  - linha do coração curvando-se para cima: expansiva;
  - linha da cabeça unida à da vida: cautela.

  Ficam de fora:
  - palma quadrada, comprimento da linha da cabeça e arco amplo, por
    instabilidade;
  - dedos curtos e mão de Terra, que são proporções;
  - inclinação da cabeça e destino, que não têm polo.

### 6.2 Capítulo 8 resultante

**Ritmo: impulso e cautela** — _aproximação com contraponto_

- No céu: Sol em Touro (cap. 1), Mercúrio em Touro (cap. 3), Saturno em
  Capricórnio (cap. 5).
- Nas mãos: linha da cabeça começando unida à da vida (cap. 7).
- No céu, o outro lado: Vênus em Áries (cap. 4).
- Frase-ponte [PROPOSTA]: "As duas leituras usam a imagem de um ritmo
  cuidadoso, de avaliar antes de seguir. O mapa também traz um lado mais
  impulsivo: as duas imagens convivem, sem que uma anule a outra."

**Expressão: expansiva e reservada** — _aproximação com contraponto_

- No céu: Lua em Sagitário (cap. 2).
- Nas mãos: linha do coração longa; linha do coração curvando-se para cima
  (cap. 7).
- No céu, o outro lado: Saturno em Capricórnio, Júpiter em Câncer (cap. 5).
- Frase-ponte [PROPOSTA]: "Nas duas tradições aparece a imagem de uma
  expressão afetiva mais aberta. No mapa, ela divide espaço com imagens de
  reserva — duas facetas descritas lado a lado."

O eixo `vinculo` **não vira tema**: o céu tem os dois polos, mas a mão não
tem nenhum traço elegível nesse eixo.

**O que ficou de fora:** "O formato da palma, o comprimento da linha da
cabeça e o arco da linha da vida não entram nas conexões: variaram entre
análises da mesma foto. O comprimento dos dedos e a combinação de palma e
dedos são proporções estimadas a olho."

**Diferença (ilustração com o mesmo céu):** se a fixture de mão tivesse a
linha da cabeça **separada** da linha da vida (variação usada nos testes da
03C), surgiria o polo `vinculo:autonomia`. Ele se aproximaria de Lua em
Sagitário e Vênus em Áries, com o contraponto de Marte em Peixes e Júpiter
em Câncer. Com esse céu, que tem os dois polos nos três eixos, uma
**diferença pura** não ocorre. Ela ocorre quando o mapa só tem o polo oposto,
e os testes da implementação devem montar esse caso a partir das fixtures
aproximada e desconhecida.

### 6.3 Capítulo 9 resultante

1. **Ritmo — capítulos 1, 3, 5 e 7.** [PROPOSTA] "Em que situações você
   prefere avaliar antes de agir, e em quais agir logo funciona melhor para
   você?"
2. **Expressão — capítulos 2, 5 e 7.** [PROPOSTA] "Com quem ou em que
   momentos você se expressa com mais abertura, e quando prefere se
   resguardar?"
3. **Vínculo — capítulo 4** (tensão narrativa do motor: Vênus em Áries ×
   Marte em Peixes). Pergunta retomada **literalmente** do capítulo 4: "Que
   equilíbrio entre proximidade e espaço próprio parece bom para você hoje?"
4. _Retomada do capítulo 1:_ "Qual dessas descrições combina menos com a sua
   experiência, e por quê?"
5. **Prática** [PROPOSTA]: "Durante uma semana, anote um momento em que você
   agiu de imediato e outro em que preferiu esperar. Depois, compare com o
   que os capítulos citados descrevem — inclusive no que não combina."
6. **Fechamento** [PROPOSTA]: "Qual destas leituras você quer observar com
   mais atenção nas próximas semanas — e qual você prefere deixar de lado?"

### 6.4 Variações do mesmo exemplo

- **Fixture `partialHand`:**
  - o traçado do coração é parcial, então fica de fora;
  - restam a linha do coração longa e o início unido;
  - os dois temas se mantêm, com menos referências, e a parcialidade aparece
    em "o que ficou de fora".
- **Fixture `linesMissing`:** sem traço elegível. O capítulo 8 fica
  indisponível (cenário 4), e o capítulo 9 segue com os temas do céu (as
  tensões e os eixos).
- **Fixture `library-report.unknown.json`:** o Ascendente sai, porque não
  existe nesse caso, e o motor já registra a limitação. Os demais signos
  seguem elegíveis.

---

## 7. Contratos e extensões necessárias (proposta técnica)

Tudo determinístico, sem rede nova e sem IA.

1. **Ponte do céu** (servidor, junto de `toClientReport`):
   ```ts
   type BridgeRef = {
     ref: string; // id do item, ex. "identidade:body-sign:sun"
     chapter: number; // 1–7
     label: string; // "Sol em Touro" (só nomes da biblioteca)
     poles: ToneTag[]; // vazio = não elegível
   };
   type SkyBridge = {
     version: string;
     items: BridgeRef[]; // só elegíveis (3.2)
     excluded: { label: string; reason: "uncertain" }[];
     tensions: { axis: string; chapters: number[] }[];
   };
   ```
   A ponte não leva data, hora, local, graus, `factIds` nem a origem (IA ou
   biblioteca). O rótulo "Sol em Touro" já aparece no capítulo 1.
2. **Ponte das mãos** (servidor, junto de `toClientPalmResult`): no mesmo
   formato, com `excluded.reason` igual a `"partial"`, `"unreliable"`,
   `"proportion"` ou `"not_visible"`. Leva também `simulated` e
   `retakeRecommended`. A ponte não leva evidência, imagem nem recibo.
3. **Tabela de polos das mãos** (`PALM_BRIDGE_POLES`) e lista de traços
   elegíveis, junto da biblioteca de quiromancia, com nova versão e teste que
   confere a citação da tabela 2.2 no texto `symbolic`.
4. **Memória da jornada:** `toJourneySky` e `toJourneyHands` copiam a ponte
   pela mesma lista de campos permitidos. O descarte é o mesmo (sair,
   recarregar, fechar).
5. **Módulo novo** `src/features/report/journey-chapters/`, com funções
   puras executadas **no navegador** a partir da memória da jornada:
   - `connections.ts` (capítulo 8);
   - `reflection.ts` (capítulo 9);
   - `library.ts` (textos autorais aprovados);
   - `validate.ts`.
     Sem ação de servidor: nada novo sai do aparelho.
6. **Relatório integrado:**
   - os capítulos 8–9 deixam de ser `pending` e passam a `content` ou
     `unavailable` (com motivo);
   - `ChapterArticleData.sections[]` ganha `heading?` e `refs?` (3.5);
   - o contador vai até "9 de 9";
   - o aviso "Não é o relatório completo" muda só quando os nove estiverem
     disponíveis.

---

## 8. Regras de qualidade verificáveis

| Regra                      | Critério (teste automático, salvo indicação)                                                                                                                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rastreabilidade**        | Todo tema tem ≥ 1 referência de cada lado; toda referência existe na ponte entregue, com `determined` e o polo do tema                                                                                                                                |
| **Fidelidade**             | Todo texto dos capítulos 8–9 é (a) uma frase da biblioteca aprovada, (b) um rótulo da ponte ou (c) uma pergunta copiada literalmente; igualdade de strings                                                                                            |
| **Sem invenção**           | Pontos, signos, casas e traços citados ⊆ referências do tema (reusar `POINT_RE`, `SIGN_RE` e a lógica de `CROSS_REFERENCE`); nenhum traço fora da tabela 2.2; nenhum eixo sem os dois lados no capítulo 8                                             |
| **Segurança editorial**    | Biblioteca sem `FORBIDDEN_PATTERNS`, `SENSITIVE_PATTERNS` ou o vocabulário proibido das mãos; `presumedGender` vazio; lista nova do capítulo 8: confirma, comprova, prova, reforça, evidência, correlação, "não é coincidência", elementos e "mão de" |
| **Diferenças visíveis**    | Se a ponte tem uma diferença, ela está entre os temas; todo contraponto do céu é citado                                                                                                                                                               |
| **Repetição**              | Nenhuma frase simbólica dos capítulos 1–7 no 8 ou no 9; perguntas retomadas ≤ 2 e marcadas; um tema por eixo; sem perguntas duplicadas (normalização da `REPETITION`)                                                                                 |
| **Limitações**             | "O que ficou de fora" presente sempre que houver exclusão; aviso fixo do capítulo 8; nota de simulação quando `simulated`                                                                                                                             |
| **Cenários**               | Matriz de testes: 3 céus (exato, aproximado e desconhecido) × mãos (clara, parcial, insuficiente, linhas ausentes e ausente) × céu ausente; o estado esperado segue a seção 5                                                                         |
| **Determinismo**           | A mesma entrada produz a mesma saída (snapshot por cenário)                                                                                                                                                                                           |
| **Clareza e naturalidade** | Limites: introdução ≤ 400 caracteres, tema ≤ 450 e capítulo 8 ≤ 1.800; **revisão humana** com roteiro (seção 9)                                                                                                                                       |
| **Privacidade**            | A ponte e os capítulos 8–9 não contêm data, hora, local, graus, evidência nem identificador de imagem; nenhum `fetch` novo; inventário de logs sem mudança                                                                                            |

---

## 9. Proposta de validação editorial

1. **Antes do código:** aprovação desta especificação e da biblioteca
   [PROPOSTA]:
   - a tabela 2.2;
   - até 24 frases-ponte;
   - 3 sínteses;
   - 8 perguntas de eixo;
   - 5 práticas;
   - fechamento e nota final.

   As frases-ponte e as perguntas serão entregues numa tabela completa para
   revisão. Os exemplos da seção 6 mostram o registro.

2. **Na implementação:** testes da seção 8 e geração de **12 combinações**
   da matriz em Markdown, só a partir de fixtures.
3. **Revisão humana** das 12 combinações com um roteiro de sim ou não:
   - alguma frase sugere que uma tradição confirma a outra?
   - alguma diferença foi suavizada?
   - algum traço parcial ou instável sustenta um tema?
   - o texto soa natural e não repetitivo?
   - as perguntas convidam a pensar, sem induzir a resposta?

   Critério de aceite: zero "sim" nos itens de segurança e nenhuma
   combinação reprovada por repetição.

4. **Registro** do resultado em `docs/`, como nas fases anteriores.

---

## 10. Recomendação sobre IA

**Recomendo não usar IA nos capítulos 8 e 9.** Um processo determinístico
com as bibliotecas existentes é suficiente.

- **O trabalho é seleção, não redação.** Escolher eixos, referências e
  perguntas é uma regra explícita e testável, que um modelo faria de forma
  menos previsível.
- **O risco principal é exatamente o que a IA tende a produzir:** costuras
  como "isso reforça" ou "não por acaso". Detectar por léxico uma afirmação
  de correlação entre tradições é frágil, muito mais que os padrões de
  certeza já usados.
- **Ganho pequeno.** As frases-ponte são curtas e fixas; a naturalidade pode
  ser resolvida na revisão editorial das ~24 frases.
- **Custo e privacidade.** Zero custo, nenhum envio novo de dados e nenhuma
  dependência de um provedor para fechar o relatório.

**Quando reconsiderar:** só se a revisão humana (seção 9) reprovar a
naturalidade. Nesse caso, a IA poderia **reescrever apenas a frase-ponte**,
com as referências fixadas pelo sistema, o validador da seção 8 e
alternativa determinística. Isso exigiria avaliação paga autorizada e com
teto.

---

## 11. Decisões para aprovação

| #   | Decisão                                                                                                    | Recomendação                                             |
| --- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| D1  | Vocabulário comum = os 4 eixos de `ToneTag` existentes, sem taxonomia nova                                 | Aprovar                                                  |
| D2  | Tabela de polos das mãos (2.2), fundamentada em citação literal da biblioteca                              | Aprovar após revisão                                     |
| D3  | Comprimento dos dedos (proporção com ressalva permanente) na ponte?                                        | **Não** (conservador)                                    |
| D4  | Palma, comprimento da cabeça, arco da vida e tipo de mão fora da ponte até o experimento de repetibilidade | Aprovar                                                  |
| D5  | Regra de homonímia dos elementos                                                                           | Aprovar                                                  |
| D6  | Capítulo 8: até 3 temas, um por eixo; diferenças obrigatórias; sem perguntas                               | Aprovar                                                  |
| D7  | Capítulo 9: perguntas de eixo e práticas **autorais novas** (curtas, aprovadas) + até 2 retomadas literais | Aprovar (só retomadas repetiria o fim dos capítulos 1–7) |
| D8  | Mínimos: capítulo 8 ≥ 1 tema; capítulo 9 ≥ 3 itens de 2 capítulos                                          | Aprovar                                                  |
| D9  | Cálculo no navegador, a partir da ponte na memória da jornada (seção 7)                                    | Aprovar                                                  |
| D10 | Sem IA nos capítulos 8–9                                                                                   | Aprovar                                                  |

Com estas decisões aprovadas, a implementação (04E, ou a etapa que você
definir) começaria pela biblioteca autoral completa, para revisão, antes do
código dos capítulos.
