# Fase 03C — Observações, validação e biblioteca de quiromancia

Status: **concluída** (11/11/2026). Sem integração com APIs de visão, sem
chamadas pagas, sem fotografias reais. Os capítulos 6 e 7 ainda não são
redigidos (Fase 03E) e a extração visual não existe (Fase 03D).

Código em `src/features/palm-reading/analysis/`.

## 1. Arquitetura

Quatro etapas separadas, no mesmo espírito do motor astrológico (02E):

| Etapa                      | Módulo                     | Responsabilidade                                                                       |
| -------------------------- | -------------------------- | -------------------------------------------------------------------------------------- |
| 1. Observação visual       | `contract.ts`              | Formato fechado que a extração (03D) deverá preencher. Não conhece provedor de IA      |
| 2. Validação               | `validate-observation.ts`  | Formato, consistência e rastreabilidade; rebaixa o que não tem evidência               |
| 3. Interpretação simbólica | `library.ts` + `engine.ts` | Observação validada → fatos → itens dos capítulos 6 e 7, com limitações                |
| 4. Apresentação            | (03E)                      | Reaproveitará `interpretation/ai` (geração por capítulo, validador, `presentation.ts`) |

Reaproveitamento: o tipo `Certainty` e o padrão fato → item → capítulo da
02E. Foram reusadas também as listas de linguagem proibida (`FORBIDDEN_PATTERNS`,
`SENSITIVE_PATTERNS`), que agora conferem a biblioteca. Não há acoplamento com
a Anthropic nem armazenamento: o relatório contém só a mão, as
características e os textos do sistema.

## 2. Contrato de dados (`OBSERVATION_VERSION = "03c.1"`)

```ts
type PalmObservation = {
  version: "03c.1";
  hand: "right" | "left"; // mão escolhida pela pessoa (03B)
  image: {
    quality: "adequate" | "limited" | "insufficient";
    issues: ImageIssue[];
  };
  features: { [F in FeatureId]: FeatureObservation<F> };
};

type FeatureObservation<F> =
  | {
      visibility: "clear" | "partial";
      value: FeatureValue<F>;
      evidence: string;
    }
  | {
      visibility: "not_visible";
      reason:
        | "out_of_frame"
        | "too_faint"
        | "obscured"
        | "image_quality"
        | "ambiguous";
    };
```

- Visibilidade é **categórica** (nítida, parcial, não visível). Não é
  probabilidade calibrada e não há campo numérico de confiança: qualquer
  `confidence` é recusado.
- **Não visível não tem valor nem evidência**; o contrato não permite
  preencher por suposição.
- `ImageIssue`: `too_dark`, `overexposed`, `glare`, `blurry`,
  `hand_cropped`, `hand_closed`, `angled`, `obstruction`, `back_of_hand`,
  `multiple_hands`, `not_a_hand`. Destes, `back_of_hand`, `multiple_hands`,
  `not_a_hand` e `hand_closed` impedem a leitura.
- Evidência: 20 a 160 caracteres, descrevendo **onde** a característica
  aparece na foto. É de uso interno (auditoria) e nunca vai ao cliente.

### Categorias visuais (conservadoras)

| Característica      | Categorias                | Observação                                                     |
| ------------------- | ------------------------- | -------------------------------------------------------------- |
| `hand.palmShape`    | `square`, `rectangular`   | Proporção largura × comprimento, a olho                        |
| `hand.fingerLength` | `short`, `medium`, `long` | Dedo médio em relação à palma                                  |
| `heart.length`      | `short`, `medium`, `long` | Até onde a linha chega sob os dedos                            |
| `heart.shape`       | `straight`, `curved`      | Termina reta ou curvando para os dedos                         |
| `head.length`       | `short`, `medium`, `long` | Até onde atravessa a palma                                     |
| `head.slope`        | `straight`, `sloping`     | Reta ou descendo para o pulso                                  |
| `head.start`        | `joined_life`, `separate` | Começa unida à linha da vida ou separada                       |
| `life.arc`          | `wide`, `close`           | Arco amplo ou fechado; **não há comprimento da linha da vida** |
| `fate.presence`     | `present`                 | Só a presença, e só quando nítida                              |

Fora do contrato, de propósito: medidas métricas, ângulos, montes,
linhas menores, marcas (ilhas, cruzes, estrelas), dorso da mão, unhas, pele
e qualquer atributo pessoal.

## 3. Regras do validador

Entrada `unknown` (não confiável). Três desfechos:

**Erro, que recusa a observação inteira:**

- objeto malformado, bloco ausente, característica ausente;
- campo não previsto em qualquer nível (`confidence`, `estimatedAge`,
  `skinTone`, `life.length`…);
- valor, visibilidade, motivo ou problema de imagem fora do contrato;
- versão diferente de `03c.1`;
- característica usada sem o campo `evidence`;
- mão diferente da escolhida pela pessoa;
- **conteúdo sensível na evidência**: identidade (nome, documento, tatuagem,
  impressão digital, biometria, aliança), saúde (doença, lesão, cicatriz,
  artrite, tremor…), idade, gênero, etnia ou cor da pele.

**Rebaixamento, em que a característica vira "não visível":**

- `WEAK_EVIDENCE`: evidência curta, longa, genérica ou sem referência de lugar
  (dedos, polegar, pulso, borda, sob, entre…). "Palma" e "mão" sozinhas não
  bastam;
- `INTERPRETIVE_EVIDENCE`: evidência que interpreta ("indica que…",
  personalidade, sorte, futuro, vida longa);
- `REPEATED_EVIDENCE`: a mesma evidência usada para outra característica;
- `FATE_NOT_CLEAR`: linha do destino só parcial;
- `INCONSISTENT`: "cabeça unida à vida" sem a linha da vida visível;
- `IMAGE_INSUFFICIENT`: qualidade insuficiente ou problema bloqueante (com
  aviso `QUALITY_CONTRADICTION` quando o modelo "viu" algo mesmo assim, ou
  disse "adequada" com problema bloqueante).

**Status da leitura:**

- `complete`: tudo usável, com o destino sendo opcional;
- `partial`: algumas características usáveis;
- `insufficient`: nenhuma.

O validador **não** confere se a observação corresponde à foto; essa
precisão será medida na 03F.

## 4. Motor (`engine.ts`)

- Cada característica usável vira um **fato**: valor, certeza, frase de
  observação do sistema e evidência (só auditoria).
- Cada fato vira um **item** com o texto da biblioteca.
  `partial` → `certainty: "uncertain"` + ressalva do sistema.
- **Tipo de mão** (Terra, Ar, Fogo, Água): só com palma **e** dedos usáveis
  numa das quatro combinações; dedos médios não formam tipo. O item aponta
  para os dois fatos de origem.
- **Limitações** geradas pelo sistema:
  - por característica não visível;
  - para a linha do destino: "isso não quer dizer que ela não exista";
  - para os problemas de imagem;
  - para foto insuficiente: pedido de nova foto nos dois capítulos.
- Capítulo 6 (`maos`): formato, dedos e tipo de mão. Capítulo 7 (`linhas`):
  coração, cabeça, vida e destino.

## 5. Biblioteca inicial de interpretações (`PALM_LIBRARY_VERSION = "03c.1"`)

Regras (conferidas em `library.test.ts`):

- toda leitura se apresenta como tradição ("na quiromancia", "a tradição
  associa");
- passa pelas listas de linguagem determinista e de saúde, finanças e
  decisões de relacionamento da 02F;
- passa por uma lista própria (`PALM_FORBIDDEN_TEXT_PATTERNS`): morte,
  longevidade, vida longa ou curta, filhos, gravidez, fertilidade, casamento,
  dinheiro, riqueza, saúde, acidentes, futuro;
- a linha da vida sempre termina com "uma leitura sobre o modo de viver, não
  sobre a duração da vida";
- a linha do destino só tem texto para "presente", e o texto termina com
  "não a um destino fixo";
- as frases de observação descrevem e não interpretam.

Textos atuais (gerados a partir de `library.ts`):

#### `hand.palmShape` — formato da palma

| Categoria     | Definição visual                                                                                              | Leitura simbólica (tradição)                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `square`      | A largura da palma, na base dos dedos, é parecida com o comprimento da palma (do pulso à base do dedo médio). | Na quiromancia, a palma de formato mais quadrado costuma ser associada a um jeito prático de estar no mundo: gosto por estrutura, constância e soluções concretas. |
| `rectangular` | A palma é visivelmente mais longa do que larga.                                                               | Na tradição da quiromancia, a palma mais longa do que larga é associada à sensibilidade e à imaginação: você pode se guiar bastante pelo que sente e intui.        |

#### `hand.fingerLength` — comprimento dos dedos

| Categoria | Definição visual                                                                                                              | Leitura simbólica (tradição)                                                                                                                     |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `short`   | O dedo médio mede visivelmente menos de três quartos do comprimento da palma.                                                 | Na quiromancia, dedos mais curtos em relação à palma são ligados a um modo de agir rápido e direto, mais atento ao conjunto do que aos detalhes. |
| `medium`  | O dedo médio mede entre cerca de três quartos e quase todo o comprimento da palma; nem claramente curto nem claramente longo. | Dedos de comprimento médio em relação à palma são lidos pela tradição como um equilíbrio entre impulso e reflexão.                               |
| `long`    | O dedo médio tem comprimento parecido com o da palma ou maior.                                                                | Na quiromancia, dedos longos em relação à palma costumam ser associados à atenção aos detalhes e ao gosto por pensar antes de agir.              |

#### `heart.length` — comprimento da linha do coração

| Categoria | Definição visual                                                                     | Leitura simbólica (tradição)                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `short`   | A linha do coração termina antes de chegar à área sob o dedo médio.                  | Na tradição, uma linha do coração mais curta é associada a um afeto mais reservado, que se revela aos poucos e para quem conquista a sua confiança. |
| `medium`  | A linha do coração termina na área sob o dedo médio ou entre o médio e o indicador.  | Uma linha do coração de comprimento médio é tradicionalmente lida como equilíbrio entre expressar o que sente e preservar o próprio espaço.         |
| `long`    | A linha do coração chega à área sob o dedo indicador ou à borda da palma desse lado. | Uma linha do coração longa costuma ser associada, na quiromancia, a um afeto expansivo e generoso, que se envolve com intensidade.                  |

#### `heart.shape` — traçado da linha do coração

| Categoria  | Definição visual                                                                         | Leitura simbólica (tradição)                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `straight` | A linha do coração segue quase reta, sem subir em direção aos dedos no final.            | Quando a linha do coração segue mais reta, a tradição a relaciona a um modo mais racional e contido de lidar com os afetos. |
| `curved`   | A linha do coração se curva para cima, em direção à base dos dedos, no final do traçado. | Quando a linha do coração se curva em direção aos dedos, a tradição a associa a uma expressão afetiva calorosa e aberta.    |

#### `head.length` — comprimento da linha da cabeça

| Categoria | Definição visual                                                                     | Leitura simbólica (tradição)                                                                                                                          |
| --------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `short`   | A linha da cabeça termina antes da área sob o dedo anelar.                           | Na tradição, a linha da cabeça mais curta é ligada a um pensamento objetivo, que prefere ir direto ao ponto.                                          |
| `medium`  | A linha da cabeça termina na área sob o dedo anelar.                                 | Uma linha da cabeça de comprimento médio é associada pela tradição a um pensamento que equilibra praticidade e reflexão.                              |
| `long`    | A linha da cabeça passa da área sob o dedo anelar, chegando perto da borda da palma. | Uma linha da cabeça longa costuma ser associada, na quiromancia, a um pensamento abrangente, que gosta de considerar muitos ângulos antes de decidir. |

#### `head.slope` — inclinação da linha da cabeça

| Categoria  | Definição visual                                                       | Leitura simbólica (tradição)                                                                                        |
| ---------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `straight` | A linha da cabeça atravessa a palma quase na horizontal.               | Uma linha da cabeça mais reta é tradicionalmente associada a um raciocínio prático e lógico, voltado ao concreto.   |
| `sloping`  | A linha da cabeça desce visivelmente em direção ao pulso no seu final. | Quando a linha da cabeça desce em direção ao pulso, a tradição a liga à imaginação e a um pensamento mais criativo. |

#### `head.start` — início da linha da cabeça

| Categoria     | Definição visual                                                                       | Leitura simbólica (tradição)                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `joined_life` | No início, perto do polegar, a linha da cabeça sai junto da linha da vida.             | Quando a linha da cabeça começa unida à da vida, a quiromancia costuma associar isso à cautela: você pode preferir avaliar bem antes de se lançar. |
| `separate`    | No início, perto do polegar, há um espaço visível entre a linha da cabeça e a da vida. | Quando a linha da cabeça começa separada da linha da vida, a tradição associa isso à independência e à disposição para seguir o próprio caminho.   |

#### `life.arc` — arco da linha da vida

| Categoria | Definição visual                                                                                  | Leitura simbólica (tradição)                                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wide`    | A linha da vida faz um arco amplo, avançando bem para o centro da palma antes de descer ao pulso. | Na quiromancia, um arco amplo da linha da vida é associado ao entusiasmo e à abertura para novas experiências — uma leitura sobre o modo de viver, não sobre a duração da vida.                         |
| `close`   | A linha da vida faz um arco fechado, mantendo-se próxima da base do polegar.                      | Um arco mais fechado da linha da vida é tradicionalmente lido como preferência por ambientes conhecidos e por um ritmo mais cuidadoso — uma leitura sobre o modo de viver, não sobre a duração da vida. |

#### `fate.presence` — linha do destino

| Categoria | Definição visual                                                                                  | Leitura simbólica (tradição)                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `present` | Uma linha vertical nítida sobe do meio da palma, ou da região do pulso, em direção ao dedo médio. | Uma linha do destino bem marcada é associada, na tradição, à sensação de propósito e a uma direção que você constrói ao longo do caminho — não a um destino fixo. |

#### Tipo de mão (derivado de `hand.palmShape` + `hand.fingerLength`)

| Tipo                   | Palma         | Dedos   | Leitura simbólica                                                                                                                                                   |
| ---------------------- | ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `earth` (mão de Terra) | `square`      | `short` | Palma mais quadrada com dedos curtos compõe o que a quiromancia moderna chama de mão de Terra, associada à praticidade, à estabilidade e ao contato com o concreto. |
| `air` (mão de Ar)      | `square`      | `long`  | Palma mais quadrada com dedos longos compõe o que a quiromancia moderna chama de mão de Ar, associada à curiosidade, à comunicação e ao gosto por ideias.           |
| `fire` (mão de Fogo)   | `rectangular` | `short` | Palma mais longa com dedos curtos compõe o que a quiromancia moderna chama de mão de Fogo, associada ao entusiasmo, à iniciativa e à energia para começar.          |
| `water` (mão de Água)  | `rectangular` | `long`  | Palma mais longa com dedos longos compõe o que a quiromancia moderna chama de mão de Água, associada à sensibilidade, à intuição e à receptividade.                 |

Ressalva de característica parcial: "Esta característica ficou só
parcialmente visível na foto; leia esta interpretação com reserva."

Aviso dos capítulos: "As características descritas foram observadas numa
fotografia e podem não corresponder exatamente à sua mão. Os significados vêm
da tradição simbólica da quiromancia — não são fatos científicos,
diagnósticos nem previsões."

### Referências (terminologia da tradição, não evidência científica)

A terminologia segue obras clássicas e de divulgação da quiromancia
ocidental. Essas obras documentam a **tradição**; não há evidência científica
de que linhas ou formato da mão indiquem personalidade, saúde ou
acontecimentos. Por isso o Sidera apresenta tudo como leitura simbólica.

- Cheiro (William John Warner), _Cheiro's Language of the Hand_, 1894:
  nomes e trajetos das linhas do coração, da cabeça, da vida e do destino;
  início da linha da cabeça junto ou separado da linha da vida.
- William G. Benham, _The Laws of Scientific Hand Reading_, 1900: formato da
  palma e comprimento dos dedos como leitura de temperamento. Apesar do
  título, é uma obra da tradição, não um estudo científico.
- Fred Gettings, _The Book of the Hand_, 1965: tipologia moderna de quatro
  tipos elementares (Terra, Ar, Fogo, Água) pela combinação de palma
  quadrada ou alongada com dedos curtos ou longos.
- Verbetes enciclopédicos sobre quiromancia (por exemplo, a _Encyclopaedia
  Britannica_, "palmistry"), que a descrevem como prática divinatória sem
  base científica.

As interpretações do Sidera são **paráfrases autorais e suavizadas**, não
citações. Foram omitidas as leituras tradicionais de longevidade, saúde,
casamento, filhos e riqueza. As obras não foram consultadas online nesta
sessão; as referências indicam a origem da terminologia.

## 6. Casos de teste (fictícios)

Fixtures em `analysis/__fixtures__/observations.ts`, todas escritas à mão
(nenhuma foto, nenhum modelo):

| Cenário                   | Fixture / teste                       | Resultado esperado                                                                                                                                                  |
| ------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mão claramente observável | `clearHand`                           | Completo; 3 itens no cap. 6 (com tipo Terra) e 7 no cap. 7; sem limitações                                                                                          |
| Parcialmente visível      | `partialHand` (mão esquerda, reflexo) | Parcial; item incerto com ressalva; dedos e destino só como limitação                                                                                               |
| Foto insuficiente         | `insufficientPhoto`                   | Nenhum fato nem item; pedido de nova foto nos dois capítulos                                                                                                        |
| Linhas não identificáveis | `linesMissing`                        | Cap. 6 com itens; cap. 7 vazio, com 7 limitações                                                                                                                    |
| Contraditórios            | variações de `clearHand`              | Insuficiente com traços "nítidos"; dorso, mão fechada, várias mãos ou não-mão com "adequada"; cabeça unida sem a vida; mão divergente                               |
| Não sustentados           | variações de `clearHand`              | `confidence`, `estimatedAge`, `skinTone`, `life.length`, valores inventados; não visível com valor; evidência vazia, genérica, interpretativa, repetida ou sensível |

Arquivos: `validate-observation.test.ts`, `engine.test.ts`,
`library.test.ts` (56 testes).

## 7. Limitações e riscos restantes

- **Precisão não medida.** O validador confere formato e coerência, não se a
  observação corresponde à foto. Isso será medido na 03F, com fotos de
  voluntários.
- **Heurísticas léxicas.** As listas de evidência genérica, interpretativa e
  sensível são por palavras: frases fora dos padrões podem passar ou ser
  recusadas sem necessidade. A lista de lugares exige vocabulário em
  português; a extração da 03D precisa escrever a evidência em português.
- **Categorias provisórias.** As definições visuais (por exemplo, dedo médio
  "menos de três quartos" da palma) são critérios a olho, não medidas. Podem
  precisar de ajuste depois da 03F.
- **Tipologia elementar** é da quiromancia moderna (século XX), não universal
  entre as escolas; está identificada como tal no texto.
- **A biblioteca é inicial:** um texto por categoria. A redação dos capítulos
  (03E) vai articular os itens com o mesmo validador da 02F, estendido com
  `PALM_FORBIDDEN_TEXT_PATTERNS` e com o vocabulário das linhas.
- O motor ainda não é usado por nenhuma tela nem rota.
