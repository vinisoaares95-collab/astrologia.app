# Fase 04D — Ajuste final da seleção editorial (capítulo 8)

Estado: **proposta para aprovação editorial definitiva.** Não houve código
do produto, chamada paga, mudança nos motores nem deploy.

Este documento complementa:

- `docs/fase-04d-especificacao-capitulos-8-9.md` (`5033f86`);
- `docs/fase-04d-revisao-biblioteca.md` (`96353c1`).

## 0. Decisões registradas

- **E1:** a linha da cabeça separada **não** recebe polo. Mantido.
- **E2:** o capítulo 9 com só a leitura das mãos e sem conteúdo suficiente
  fica indisponível, provisoriamente. Mantido.
- **E4:** as perguntas inéditas do capítulo 9 estão aprovadas. Nenhuma foi
  alterada.
- **E3:** revisado neste documento.
- **E5:** aguarda a aprovação final.

---

## 1. Diagnóstico: por que 42 de 51 temas tinham contraponto

**Causa confirmada.** A regra anterior considerava **qualquer** posição
elegível do mapa que tivesse um polo no eixo, sem perguntar **do que** essa
posição trata.

Na tabela das mãos (seção 1.1 da revisão), uma associação só vale quando o
**objeto** e a direção coincidem. No lado do céu, esse critério não era
aplicado: o polo vem do signo (`SIGN_MEANINGS[signo].tags`), que é o mesmo
para qualquer corpo naquele signo. Assim, "Saturno em Capricórnio" contava
como imagem de expressão afetiva reservada, embora a função tradicional de
Saturno seja "a estrutura, os limites e o amadurecimento".

Medição com os mesmos dados (84 combinações, 51 temas da regra anterior):

| Medida                                                   | Regra anterior     |
| -------------------------------------------------------- | ------------------ |
| Referências do céu citadas nos temas                     | 169 (3,3 por tema) |
| … cujo corpo trata do **mesmo objeto** do traço das mãos | **31 (18%)**       |
| Contrapontos citados                                     | 72                 |
| … do mesmo objeto do traço das mãos                      | **3 (4%)**         |

A abundância é estrutural: 6 dos 12 signos têm um polo de expressão, e o
mapa tem até 8 posições elegíveis. Com tantas posições, os dois polos quase
sempre aparecem, sem que isso diga algo sobre o traço comparado.

### 1.1 Tentativa com o critério de destaque já existente (rejeitada)

Primeiro testei o critério de relevância mais direto do motor: o **item que
abre cada capítulo**, que é o de maior `score` (`chapters.ts`) e o primeiro
na ordem de apresentação. Com só esses destaques, as aproximações com
contraponto passam de **42 para 40**. O problema não é o destaque: os
destaques são Sol, Lua, Mercúrio, Vênus e Saturno, e continuam cobrindo os
dois polos pelos mesmos motivos. Por isso, essa regra não é recomendada.

---

## 2. Regra proposta: comparar só posições do mesmo tema

### 2.1 Fundamento

Aplicar ao céu **o mesmo critério já aprovado para as mãos**. Uma posição só
entra na comparação de um traço quando a **função tradicional do corpo**
(`BODY_MEANINGS[corpo].function`, biblioteca 02E, citada literalmente) trata
do mesmo objeto da leitura do traço. Não há pesos novos nem mudança no motor
astrológico: os polos continuam sendo os do motor, e a regra só decide
**quais** posições são comparáveis.

| Posição    | Função aprovada (citação literal)                            | Objeto       | Comparada com                                                         |
| ---------- | ------------------------------------------------------------ | ------------ | --------------------------------------------------------------------- |
| Lua        | "as necessidades emocionais e a forma de buscar acolhimento" | afeto        | linha do coração (comprimento e traçado)                              |
| Vênus      | "o afeto, o prazer e a forma de se vincular"                 | afeto        | linha do coração (comprimento e traçado)                              |
| Marte      | "a iniciativa, o desejo e a maneira de agir"                 | modo de agir | início da linha da cabeça                                             |
| Sol        | "o núcleo de identidade e a vontade de se expressar"         | identidade   | — a expressão de si não é a expressão **afetiva** da linha do coração |
| Mercúrio   | "o modo de pensar, aprender e se comunicar"                  | pensamento   | — o traço da cabeça fala do **momento de agir**, não do pensar        |
| Júpiter    | "a expansão, a confiança e a busca de sentido"               | expansão     | —                                                                     |
| Saturno    | "a estrutura, os limites e o amadurecimento"                 | estrutura    | —                                                                     |
| Ascendente | "a forma de se apresentar" (`POINT_THEMES`)                  | apresentação | —                                                                     |

O objeto de cada traço das mãos sai do próprio texto aprovado (tabela 1.2
da revisão):

- coração: "afeto mais reservado", "afeto expansivo", "lidar com os
  afetos", "expressão afetiva";
- cabeça unida: "avaliar bem antes de se lançar".

### 2.2 Regra

1. Para cada eixo com traço elegível das mãos, os **referentes do céu** são
   só as posições elegíveis do mesmo objeto (2.1) que têm um polo nesse
   eixo.
2. A classificação (aproximação, aproximação com contraponto, diferença ou
   duas imagens nas mãos) usa **só esses referentes**:
   - um contraponto só aparece quando outra posição do **mesmo objeto**
     aponta para o polo oposto, por exemplo Lua e Vênus em lados opostos da
     expressão;
   - não se procuram polos opostos em posições de outros temas.
3. Sem nenhum referente do mesmo objeto no eixo, **não há tema**. Se nenhum
   eixo tiver tema, vale U6, com o texto revisto.
4. Continuam valendo: no máximo 3 temas, nenhum tema forçado e diferenças
   sempre mostradas.

**Contrapontos relevantes não são escondidos.** Uma posição de outro tema
nunca foi um contraponto do traço comparado: Saturno não descreve afeto, e
Vênus não descreve o momento de agir. Quando duas posições do mesmo tema
divergem, o contraponto aparece.

### 2.3 Ajustes necessários na biblioteca

Dos 53 textos, **só 3 mudaram e 1 foi retirado**. Isso já está aplicado em
`fase-04d-revisao-biblioteca.md`, seções 2.5 e 2.6.

| Código     | Mudança                                                                                                                                                                                                                                           | Motivo                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| R-escopo   | "Os demais traços e posições tratam de outros temas e por isso não são comparados neste capítulo."                                                                                                                                                | O texto antigo dizia que as outras posições "não usam os eixos", o que deixou de ser verdade |
| U6         | "As posições do mapa ligadas aos mesmos temas dos traços nítidos das mãos — o afeto e o modo de agir — não apontam para nenhum dos lados desses traços. Por isso, não há o que comparar, e nenhuma conexão foi criada para preencher o capítulo." | Idem                                                                                         |
| R-hora     | Mesmo texto; a condição passa a ser "Lua, Vênus ou Marte incertos por causa do horário"                                                                                                                                                           | Só as posições comparáveis importam                                                          |
| R-sem-hora | **Retirada**                                                                                                                                                                                                                                      | O Ascendente não entra mais nas comparações                                                  |

Pré-verificação repetida: **52 textos, 0 falhas**, e 24 de 24 citações
literais.

O capítulo 9 não muda nos textos (E4) nem na regra de seleção, salvo como
consequência dos temas do capítulo 8. Veja 5.

### 2.4 Efeito no contrato

A ponte do céu já leva `point` e `poles` (seção 6.1 da revisão). A tabela
de objetos (2.1) entra junto da tabela de polos das mãos, versionada, com um
teste que confere as citações de `BODY_MEANINGS`. Nenhum metadado novo é
transportado.

---

## 3. Comparação com os mesmos dados

| Medida (84 combinações)                                    | Regra anterior                                                                         | Destaque (1.1) | **Proposta (mesmo tema)**                                    |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------ |
| Capítulo 8 disponível (66 com as duas fontes)              | 33 (50%)                                                                               | 33 (50%)       | **29 (44%)**                                                 |
| Temas                                                      | 51                                                                                     | 51             | **31**                                                       |
| Aproximação                                                | 6                                                                                      | 6              | **22**                                                       |
| Aproximação com contraponto                                | **42**                                                                                 | 40             | **0**                                                        |
| Diferença                                                  | 3                                                                                      | 5              | **9**                                                        |
| Referências do céu por tema                                | 3,3                                                                                    | —              | **1,1**                                                      |
| Referências do céu do mesmo tema do traço                  | 18%                                                                                    | —              | **100%**                                                     |
| Combinações de variantes distintas (`clearHand` × 11 céus) | 4, sendo 5 dos 11 capítulos idênticos na estrutura (ritmo e expressão com contraponto) | —              | **4** entre os 10 disponíveis, a mais comum repetida 5 vezes |
| Capítulo 9 disponível                                      | 77                                                                                     | 77             | **77**                                                       |

### Leitura dos números

- **Relevância.** Toda referência citada passa a tratar do mesmo tema do
  traço. Antes, eram 18%.
- **Diferenciação.** As diferenças **triplicam**, de 3 para 9. Seis delas
  estavam **mascaradas** como "aproximação com contraponto". Exemplo C, a
  seguir: a regra anterior citava Mercúrio e Marte como aproximação da
  linha do coração e deixava Vênus, a única posição sobre afeto, como
  contraponto.
- **Contraponto.** Desaparece com estes dados porque, nos 11 mapas, Lua e
  Vênus nunca apontam para lados opostos da expressão. A variante continua
  necessária: ela ocorre quando, por exemplo, uma está em Leão e a outra em
  Câncer, e os testes da implementação vão montar esse caso.
- **Cobertura.** A cobertura **cai** de 33 para 29, sem nenhum ajuste para
  compensar. As 4 perdas são casos honestos de U6 em que nenhuma posição de
  afeto ou de ação tem o eixo do traço: uma combinação de `C-demo3` e três
  de `C-demo5`.

---

## 4. Três capítulos 8 completos (regra proposta), comparados com a regra anterior

> **EXEMPLOS FICTÍCIOS — não são a leitura de ninguém.** São montados pela
> simulação com os motores reais e as fixtures do projeto, com os textos da
> biblioteca proposta. A legenda dos identificadores está no anexo.

### Exemplo A — Aproximação simples (`C-val2`, horário aproximado × `M-clara`)

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia
usaram nos capítulos anteriores. São tradições simbólicas independentes:
quando usam imagens parecidas, trata-se de uma semelhança de linguagem, não
de uma constatação sobre você; quando apontam para lados diferentes, a
diferença fica à vista.

**Expressão: abertura e reserva** · Aproximação
Nas mãos: linha do coração longa; linha do coração curvada para cima
(cap. 7).
No céu: Lua em Leão (cap. 2); Vênus em Gêmeos (cap. 4).
As duas leituras usam a imagem de uma expressão afetiva mais aberta. A
semelhança está na linguagem das duas tradições; o que ela descreve na sua
vida, só você pode avaliar.

_Síntese._ As aproximações acima mostram onde as duas tradições usam
palavras parecidas. Elas servem como ponto de partida para observar a sua
experiência, não como conclusão.

_Limites._

- Semelhanças entre tradições simbólicas não comprovam traços de
  personalidade, e diferenças entre elas não indicam erro de nenhuma das
  leituras.
- O formato da palma, o comprimento dos dedos, o comprimento da linha da
  cabeça e o arco da linha da vida não entram nestas comparações: são traços
  que variaram entre análises da mesma foto ou proporções estimadas a olho.
- Os demais traços e posições tratam de outros temas e por isso não são
  comparados neste capítulo.

Não há tema de ritmo: Marte em Sagitário não tem polo nesse eixo. O
capítulo fica com um tema só, sem preenchimento.

**Regra anterior, mesmos dados:** Expressão · aproximação com contraponto.

- No céu: Lua em Leão, Vênus em Gêmeos e Saturno em Gêmeos.
- Outro lado: Sol em Câncer e Mercúrio em Câncer.
- Duas das três referências de aproximação e os dois contrapontos não
  tratam de afeto.

### Exemplo B — Aproximação com contraponto (`C-ref`, horário exato × `M-clara`)

Com a regra proposta, **nenhuma das 84 combinações** produz contraponto. Por
isso, este exemplo mostra o caso que a regra anterior classificava como
contraponto e o que ele se torna. Não foi fabricado nenhum dado para gerar
um contraponto.

**Regra anterior: dois temas com contraponto.**

- Ritmo · aproximação com contraponto:
  - nas mãos: linha da cabeça começando unida à da vida (cap. 7);
  - no céu: Sol em Touro (cap. 1); Mercúrio em Touro (cap. 3); Saturno em
    Capricórnio (cap. 5);
  - no céu, o outro lado: Vênus em Áries (cap. 4).
- Expressão · aproximação com contraponto:
  - nas mãos: linha do coração longa; linha do coração curvada para cima
    (cap. 7);
  - no céu: Lua em Sagitário (cap. 2);
  - no céu, o outro lado: Saturno em Capricórnio; Júpiter em Câncer
    (cap. 5).

**Regra proposta, mesmos dados: um tema.**

**Expressão: abertura e reserva** · Aproximação
Nas mãos: linha do coração longa; linha do coração curvada para cima
(cap. 7).
No céu: Lua em Sagitário (cap. 2).
As duas leituras usam a imagem de uma expressão afetiva mais aberta. A
semelhança está na linguagem das duas tradições; o que ela descreve na sua
vida, só você pode avaliar.

A síntese e os limites são iguais aos do exemplo A.

Por que cada referência saiu:

| Referência da regra anterior      | Função tradicional                | Motivo                                                               |
| --------------------------------- | --------------------------------- | -------------------------------------------------------------------- |
| Sol, Mercúrio e Saturno (cautela) | identidade, pensamento, estrutura | Não tratam do **modo de agir** do traço da cabeça                    |
| Vênus em Áries (impulso)          | afeto                             | Trata de afeto, não do modo de agir                                  |
| Saturno, Júpiter (reserva)        | estrutura, expansão               | Não tratam de **afeto**                                              |
| Marte em Peixes                   | modo de agir                      | É do tema certo, mas Peixes não tem polo de ritmo: sem tema de ritmo |

**Quando o contraponto aparece:** quando Lua e Vênus têm polos opostos de
expressão, por exemplo Lua em Câncer e Vênus em Leão. O bloco então traz
"No céu: Vênus em Leão (cap. 4). No céu, o outro lado: Lua em Câncer
(cap. 2)", com a frase-ponte de contraponto já aprovada. Nenhum dos 11 mapas
de teste tem essa combinação.

### Exemplo C — Diferença entre os polos (`C-demo2`, horário exato × `M-clara`)

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

_(Introdução igual à do exemplo A.)_

**Expressão: abertura e reserva** · Diferença
Nas mãos: linha do coração longa; linha do coração curvada para cima
(cap. 7).
No céu: Vênus em Câncer (cap. 4).
Aqui as leituras seguem caminhos diferentes: a quiromancia associa estes
traços a uma expressão mais aberta, e as posições citadas do mapa, a uma
expressão mais reservada. A diferença fica à vista, sem conciliação.

_Síntese._ Nos temas comparados, as duas tradições apontam para lados
diferentes. Isso não é um erro de nenhuma delas: são sistemas simbólicos
distintos, e cada um pode ser confrontado com o que você vive.

_Limites:_ os mesmos três do exemplo A.

A Lua em Peixes não tem polo de expressão, e Marte em Leão não tem polo de
ritmo. Por isso, não há outros temas.

**Regra anterior, mesmos dados:**

- Ritmo · aproximação, com Ascendente em Virgem, Saturno em Virgem e Júpiter
  em Capricórnio. Nenhum deles trata do modo de agir.
- Expressão · aproximação com contraponto:
  - no céu: Mercúrio em Gêmeos (pensamento) e Marte em Leão (ação);
  - outro lado: Sol em Câncer e Vênus em Câncer.

A única posição sobre afeto, Vênus, aparecia como contraponto, e a
divergência real ficava escondida sob uma "aproximação".

---

## 5. Cobertura

### 5.1 Categorias exclusivas (somam 84)

| Categoria                                            | Combinações | Cap. 8 disponível | Cap. 9 disponível |
| ---------------------------------------------------- | ----------- | ----------------- | ----------------- |
| C1. Duas fontes, mãos com traço elegível             | 33          | **29**; 4 por U6  | 33                |
| C2. Duas fontes, mãos sem traço elegível (nova foto) | 33          | 0 (33 por U5)     | 33 (só céu)       |
| C3. Só céu                                           | 11          | 0 (U1)            | 11                |
| C4. Só mãos                                          | 6           | 0 (U2)            | 0 (V2: 2; V1: 4)  |
| C5. Nenhuma fonte                                    | 1           | 0 (U3)            | 0 (V1)            |
| **Total**                                            | **84**      | **29**            | **77**            |

**Capítulo 8 entre os casos com as duas fontes (C1 + C2 = 66):** 29
disponíveis (44%). Na regra anterior eram 33 (50%).

Por mãos, nos 66 casos com as duas fontes:

| Mãos                                  | Disponível | Motivo das indisponibilidades |
| ------------------------------------- | ---------- | ----------------------------- |
| `M-clara`                             | 10 de 11   | U6: 1                         |
| `M-parcial`                           | 10 de 11   | U6: 1                         |
| `M-separada`                          | 9 de 11    | U6: 2                         |
| `M-insuf.`, `M-sem-linhas`, `M-dorso` | 0 de 33    | U5                            |

### 5.2 Subconjuntos (atravessam as categorias; não somam com elas)

| Subconjunto                                                                                          | Combinações | Distribuição                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Leitura das mãos parcial** (estado `partial` do motor): `M-parcial`, `M-separada` e `M-sem-linhas` | 36          | C1: 22 (19 com o capítulo 8, 3 por U6); C2: 11 (`M-sem-linhas`, U5); C4: 3                                                                    |
| … dos quais com **traço excluído por parcialidade** (`M-parcial`: traçado do coração)                | 12          | C1: 11; C4: 1                                                                                                                                 |
| **Leitura insuficiente** (`M-insuf.`, `M-dorso`)                                                     | 24          | C2: 22; C4: 2                                                                                                                                 |
| **Horário aproximado** (`C-ref aprox.`, `C-val2`, `C-demo4`)                                         | 21          | Nenhum efeito no capítulo 8 com estes dados: Lua, Vênus e Marte não ficaram incertos                                                          |
| **Horário desconhecido** (`C-ref desc.`, `C-val3`, `C-demo5`)                                        | 21          | `C-demo5`: a Lua fica incerta e sai e, como Vênus e Marte em Libra não têm polo nesses eixos, as 3 combinações com traço elegível ficam em U6 |

`M-separada` é parcial porque a linha da vida não aparece nessa variação da
03C. Por isso entra nos dois recortes.

---

## 6. Capítulo 9

A regra de seleção do capítulo 9 **não foi alterada**: E4 está aprovada, e
o pedido desta etapa era o capítulo 8.

Os temas vindos do capítulo 8 passam a usar a variante "um polo" quando o
tema é uma aproximação. Com isso, a variante "dois lados" cai de 190 para
172 temas.

**Observação para decisão (E6).** Nos temas de um lado só, o capítulo 9
ainda usa "dois lados" sempre que o eixo tem os dois polos entre quaisquer
posições. É o mesmo padrão estrutural do diagnóstico. Testei a alternativa
de usar "dois lados" **só quando o próprio motor marcou a tensão**
(`NarrativeTension`, no mesmo capítulo):

| Seleção do capítulo 9               | Disponível | Temas "dois lados" / "um polo" |
| ----------------------------------- | ---------- | ------------------------------ |
| Atual (mantida nesta proposta)      | 77 de 84   | 172 / 59                       |
| "Dois lados" só com tensão do motor | 50 de 84   | 54 / 67                        |

**Recomendação: manter a atual.** No capítulo 9 o tema vira **pergunta**, e
a pergunta "dois lados" pergunta pelos dois comportamentos sem afirmar que a
pessoa tem os dois. A alternativa derrubaria 27 capítulos (V2) sem ganho de
fidelidade comparável ao do capítulo 8. Se preferir a regra mais estrita,
ela já está medida.

---

## 7. Ajuste da especificação para aprovação definitiva

| #   | Item                                                                                                                    | Proposta                 |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| F1  | Seleção do céu no capítulo 8 pela tabela de objetos (2.1): coração ↔ Lua e Vênus; início da cabeça ↔ Marte              | Aprovar                  |
| F2  | Contraponto só entre posições do mesmo objeto; nenhuma busca de polos opostos em outros temas                           | Aprovar                  |
| F3  | Critério de destaque (1.1) **não** adotado                                                                              | Aprovar                  |
| F4  | Textos: R-escopo e U6 revistos, R-hora com nova condição, R-sem-hora retirada (2.3)                                     | Aprovar                  |
| F5  | Cobertura resultante: capítulo 8 em 29 dos 66 casos com as duas fontes; capítulo 9 em 77 de 84                          | Aceitar                  |
| F6  | Os testes da implementação constroem os casos sem fixture: contraponto (Lua e Vênus opostos), duas imagens nas mãos, U4 | Aprovar                  |
| E6  | Seleção do capítulo 9 de um lado só                                                                                     | Manter a atual (seção 6) |
| E5  | Aprovação final da tabela 1.2, da tabela 2.1 e dos 52 textos                                                            | Pendente da sua revisão  |

Os scripts descartáveis da simulação e da pré-verificação estão fora do
repositório, em
`/tmp/claude-0/-home-user-astrologia-app/3fe5797d-c926-5a7d-8184-2d2b94c85308/scratchpad/sim04d/`:

- `sim2.test.ts`, com as regras `atual`, `destaque` e `objeto`;
- `check.test.ts`.

---

## Anexo — Matriz das 84 combinações (regra proposta, com a anterior ao lado)

**Legenda**

- **Céu:**
  - `C-ref`: caso de referência de `test-support.ts`, nas três precisões;
  - `C-val1` a `C-val3`: `VALIDATION_CASES` (exato, aproximado e
    desconhecido);
  - `C-demo1` a `C-demo5`: `DEMO_CASES` que normalizam sem escolha (Recife
    1986, Rio Branco, Nova York, Bom Jesus e São Paulo com horário
    desconhecido).
- **Mãos:**
  - `M-clara`: `clearHand`;
  - `M-parcial`: `partialHand`;
  - `M-insuf.`: `insufficientPhoto`;
  - `M-sem-linhas`: `linesMissing`;
  - `M-dorso`: a contraditória do provedor simulado;
  - `M-separada`: a variação da 03C com a cabeça separada.
- **Categorias:** C1 a C5, conforme 5.1.
- **Motivos:** U1 a U6 (capítulo 8) e V1 e V2 (capítulo 9), conforme a
  biblioteca.
- **"Traços elegíveis":** só os que sustentam comparação. Na coluna da regra
  proposta, entre parênteses, estão as referências do céu de cada tema.

| #   | Cat. | Céu (horário)              | Mãos (estado)                      | Traços elegíveis                             | Cap. 8 — regra atual                                   | Cap. 8 — regra proposta (temas e referências do céu)                           | Cap. 8       | Cap. 9 (proposta)                                          |
| --- | ---- | -------------------------- | ---------------------------------- | -------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------ | ---------------------------------------------------------- |
| 1   | C1   | C-ref exato (exato)        | M-clara (completa)                 | coração longa, coração curvada, cabeça unida | Ritmo aprox.+contraponto; Expressão aprox.+contraponto | Expressão · aprox. (Lua em Sagitário)                                          | disponível   | 3 temas: Expressão·1 polo, Ritmo·2 lados, Vínculo·2 lados  |
| 2   | C1   | C-ref exato (exato)        | M-parcial (parcial)                | coração longa, cabeça unida                  | Ritmo aprox.+contraponto; Expressão aprox.+contraponto | Expressão · aprox. (Lua em Sagitário)                                          | disponível   | 3 temas: Expressão·1 polo, Ritmo·2 lados, Vínculo·2 lados  |
| 3   | C1   | C-ref exato (exato)        | M-separada (parcial)               | coração longa, coração curvada               | Expressão aprox.+contraponto                           | Expressão · aprox. (Lua em Sagitário)                                          | disponível   | 3 temas: Expressão·1 polo, Ritmo·2 lados, Vínculo·2 lados  |
| 4   | C1   | C-ref aprox. (aprox.)      | M-clara (completa)                 | coração longa, coração curvada, cabeça unida | Ritmo aprox.+contraponto; Expressão aprox.+contraponto | Expressão · aprox. (Lua em Sagitário)                                          | disponível   | 3 temas: Expressão·1 polo, Ritmo·2 lados, Vínculo·2 lados  |
| 5   | C1   | C-ref aprox. (aprox.)      | M-parcial (parcial)                | coração longa, cabeça unida                  | Ritmo aprox.+contraponto; Expressão aprox.+contraponto | Expressão · aprox. (Lua em Sagitário)                                          | disponível   | 3 temas: Expressão·1 polo, Ritmo·2 lados, Vínculo·2 lados  |
| 6   | C1   | C-ref aprox. (aprox.)      | M-separada (parcial)               | coração longa, coração curvada               | Expressão aprox.+contraponto                           | Expressão · aprox. (Lua em Sagitário)                                          | disponível   | 3 temas: Expressão·1 polo, Ritmo·2 lados, Vínculo·2 lados  |
| 7   | C1   | C-ref desc. (desconhecido) | M-clara (completa)                 | coração longa, coração curvada, cabeça unida | Ritmo aprox.+contraponto; Expressão aprox.+contraponto | Expressão · aprox. (Lua em Sagitário)                                          | disponível   | 3 temas: Expressão·1 polo, Ritmo·2 lados, Vínculo·2 lados  |
| 8   | C1   | C-ref desc. (desconhecido) | M-parcial (parcial)                | coração longa, cabeça unida                  | Ritmo aprox.+contraponto; Expressão aprox.+contraponto | Expressão · aprox. (Lua em Sagitário)                                          | disponível   | 3 temas: Expressão·1 polo, Ritmo·2 lados, Vínculo·2 lados  |
| 9   | C1   | C-ref desc. (desconhecido) | M-separada (parcial)               | coração longa, coração curvada               | Expressão aprox.+contraponto                           | Expressão · aprox. (Lua em Sagitário)                                          | disponível   | 3 temas: Expressão·1 polo, Ritmo·2 lados, Vínculo·2 lados  |
| 10  | C1   | C-val1 (exato)             | M-clara (completa)                 | coração longa, coração curvada, cabeça unida | Ritmo aprox.; Expressão aprox.+contraponto             | Ritmo · aprox. (Marte em Capricórnio); Expressão · aprox. (Vênus em Sagitário) | disponível   | 3 temas: Ritmo·1 polo, Expressão·1 polo, Foco·2 lados      |
| 11  | C1   | C-val1 (exato)             | M-parcial (parcial)                | coração longa, cabeça unida                  | Ritmo aprox.; Expressão aprox.+contraponto             | Ritmo · aprox. (Marte em Capricórnio); Expressão · aprox. (Vênus em Sagitário) | disponível   | 3 temas: Ritmo·1 polo, Expressão·1 polo, Foco·2 lados      |
| 12  | C1   | C-val1 (exato)             | M-separada (parcial)               | coração longa, coração curvada               | Expressão aprox.+contraponto                           | Expressão · aprox. (Vênus em Sagitário)                                        | disponível   | 3 temas: Expressão·1 polo, Foco·2 lados, Vínculo·2 lados   |
| 13  | C1   | C-val2 (aprox.)            | M-clara (completa)                 | coração longa, coração curvada, cabeça unida | Expressão aprox.+contraponto                           | Expressão · aprox. (Lua em Leão, Vênus em Gêmeos)                              | disponível   | 3 temas: Expressão·1 polo, Vínculo·2 lados, Foco·1 polo    |
| 14  | C1   | C-val2 (aprox.)            | M-parcial (parcial)                | coração longa, cabeça unida                  | Expressão aprox.+contraponto                           | Expressão · aprox. (Lua em Leão, Vênus em Gêmeos)                              | disponível   | 3 temas: Expressão·1 polo, Vínculo·2 lados, Foco·1 polo    |
| 15  | C1   | C-val2 (aprox.)            | M-separada (parcial)               | coração longa, coração curvada               | Expressão aprox.+contraponto                           | Expressão · aprox. (Lua em Leão, Vênus em Gêmeos)                              | disponível   | 3 temas: Expressão·1 polo, Vínculo·2 lados, Foco·1 polo    |
| 16  | C1   | C-val3 (desconhecido)      | M-clara (completa)                 | coração longa, coração curvada, cabeça unida | Ritmo aprox.+contraponto; Expressão diferença          | Expressão · diferença (Lua em Câncer)                                          | disponível   | 3 temas: Expressão·2 lados, Vínculo·2 lados, Ritmo·2 lados |
| 17  | C1   | C-val3 (desconhecido)      | M-parcial (parcial)                | coração longa, cabeça unida                  | Ritmo aprox.+contraponto; Expressão diferença          | Expressão · diferença (Lua em Câncer)                                          | disponível   | 3 temas: Expressão·2 lados, Vínculo·2 lados, Ritmo·2 lados |
| 18  | C1   | C-val3 (desconhecido)      | M-separada (parcial)               | coração longa, coração curvada               | Expressão diferença                                    | Expressão · diferença (Lua em Câncer)                                          | disponível   | 3 temas: Expressão·2 lados, Vínculo·2 lados, Ritmo·2 lados |
| 19  | C1   | C-demo1 (exato)            | M-clara (completa)                 | coração longa, coração curvada, cabeça unida | Ritmo aprox.+contraponto; Expressão aprox.+contraponto | Expressão · diferença (Vênus em Capricórnio)                                   | disponível   | 3 temas: Expressão·2 lados, Ritmo·2 lados, Foco·2 lados    |
| 20  | C1   | C-demo1 (exato)            | M-parcial (parcial)                | coração longa, cabeça unida                  | Ritmo aprox.+contraponto; Expressão aprox.+contraponto | Expressão · diferença (Vênus em Capricórnio)                                   | disponível   | 3 temas: Expressão·2 lados, Ritmo·2 lados, Foco·2 lados    |
| 21  | C1   | C-demo1 (exato)            | M-separada (parcial)               | coração longa, coração curvada               | Expressão aprox.+contraponto                           | Expressão · diferença (Vênus em Capricórnio)                                   | disponível   | 3 temas: Expressão·2 lados, Ritmo·2 lados, Foco·2 lados    |
| 22  | C1   | C-demo2 (exato)            | M-clara (completa)                 | coração longa, coração curvada, cabeça unida | Ritmo aprox.; Expressão aprox.+contraponto             | Expressão · diferença (Vênus em Câncer)                                        | disponível   | 3 temas: Expressão·2 lados, Ritmo·1 polo, Vínculo·1 polo   |
| 23  | C1   | C-demo2 (exato)            | M-parcial (parcial)                | coração longa, cabeça unida                  | Ritmo aprox.; Expressão aprox.+contraponto             | Expressão · diferença (Vênus em Câncer)                                        | disponível   | 3 temas: Expressão·2 lados, Ritmo·1 polo, Vínculo·1 polo   |
| 24  | C1   | C-demo2 (exato)            | M-separada (parcial)               | coração longa, coração curvada               | Expressão aprox.+contraponto                           | Expressão · diferença (Vênus em Câncer)                                        | disponível   | 3 temas: Expressão·2 lados, Vínculo·1 polo, Ritmo·1 polo   |
| 25  | C1   | C-demo3 (exato)            | M-clara (completa)                 | coração longa, coração curvada, cabeça unida | Ritmo aprox.; Expressão aprox.+contraponto             | Ritmo · aprox. (Marte em Capricórnio)                                          | disponível   | 3 temas: Ritmo·1 polo, Expressão·2 lados, Vínculo·1 polo   |
| 26  | C1   | C-demo3 (exato)            | M-parcial (parcial)                | coração longa, cabeça unida                  | Ritmo aprox.; Expressão aprox.+contraponto             | Ritmo · aprox. (Marte em Capricórnio)                                          | disponível   | 3 temas: Ritmo·1 polo, Expressão·2 lados, Vínculo·1 polo   |
| 27  | C1   | C-demo3 (exato)            | M-separada (parcial)               | coração longa, coração curvada               | Expressão aprox.+contraponto                           | —                                                                              | indisp. (U6) | 3 temas: Expressão·2 lados, Vínculo·1 polo, Foco·1 polo    |
| 28  | C1   | C-demo4 (aprox.)           | M-clara (completa)                 | coração longa, coração curvada, cabeça unida | Ritmo aprox.+contraponto; Expressão aprox.+contraponto | Expressão · aprox. (Lua em Sagitário)                                          | disponível   | 3 temas: Expressão·1 polo, Ritmo·2 lados, Vínculo·2 lados  |
| 29  | C1   | C-demo4 (aprox.)           | M-parcial (parcial)                | coração longa, cabeça unida                  | Ritmo aprox.+contraponto; Expressão aprox.+contraponto | Expressão · aprox. (Lua em Sagitário)                                          | disponível   | 3 temas: Expressão·1 polo, Ritmo·2 lados, Vínculo·2 lados  |
| 30  | C1   | C-demo4 (aprox.)           | M-separada (parcial)               | coração longa, coração curvada               | Expressão aprox.+contraponto                           | Expressão · aprox. (Lua em Sagitário)                                          | disponível   | 3 temas: Expressão·1 polo, Ritmo·2 lados, Vínculo·2 lados  |
| 31  | C1   | C-demo5 (desconhecido)     | M-clara (completa)                 | coração longa, coração curvada, cabeça unida | Expressão aprox.+contraponto                           | —                                                                              | indisp. (U6) | 3 temas: Expressão·2 lados, Vínculo·2 lados, Foco·2 lados  |
| 32  | C1   | C-demo5 (desconhecido)     | M-parcial (parcial)                | coração longa, cabeça unida                  | Expressão aprox.+contraponto                           | —                                                                              | indisp. (U6) | 3 temas: Expressão·2 lados, Vínculo·2 lados, Foco·2 lados  |
| 33  | C1   | C-demo5 (desconhecido)     | M-separada (parcial)               | coração longa, coração curvada               | Expressão aprox.+contraponto                           | —                                                                              | indisp. (U6) | 3 temas: Expressão·2 lados, Vínculo·2 lados, Foco·2 lados  |
| 34  | C2   | C-ref exato (exato)        | M-insuf. (insuficiente, nova foto) | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Ritmo·2 lados, Vínculo·2 lados, Foco·2 lados      |
| 35  | C2   | C-ref exato (exato)        | M-sem-linhas (parcial, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Ritmo·2 lados, Vínculo·2 lados, Foco·2 lados      |
| 36  | C2   | C-ref exato (exato)        | M-dorso (insuficiente, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Ritmo·2 lados, Vínculo·2 lados, Foco·2 lados      |
| 37  | C2   | C-ref aprox. (aprox.)      | M-insuf. (insuficiente, nova foto) | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Ritmo·2 lados, Vínculo·2 lados, Foco·2 lados      |
| 38  | C2   | C-ref aprox. (aprox.)      | M-sem-linhas (parcial, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Ritmo·2 lados, Vínculo·2 lados, Foco·2 lados      |
| 39  | C2   | C-ref aprox. (aprox.)      | M-dorso (insuficiente, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Ritmo·2 lados, Vínculo·2 lados, Foco·2 lados      |
| 40  | C2   | C-ref desc. (desconhecido) | M-insuf. (insuficiente, nova foto) | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Ritmo·2 lados, Vínculo·2 lados, Foco·2 lados      |
| 41  | C2   | C-ref desc. (desconhecido) | M-sem-linhas (parcial, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Ritmo·2 lados, Vínculo·2 lados, Foco·2 lados      |
| 42  | C2   | C-ref desc. (desconhecido) | M-dorso (insuficiente, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Ritmo·2 lados, Vínculo·2 lados, Foco·2 lados      |
| 43  | C2   | C-val1 (exato)             | M-insuf. (insuficiente, nova foto) | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Expressão·2 lados, Foco·2 lados, Vínculo·2 lados  |
| 44  | C2   | C-val1 (exato)             | M-sem-linhas (parcial, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Expressão·2 lados, Foco·2 lados, Vínculo·2 lados  |
| 45  | C2   | C-val1 (exato)             | M-dorso (insuficiente, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Expressão·2 lados, Foco·2 lados, Vínculo·2 lados  |
| 46  | C2   | C-val2 (aprox.)            | M-insuf. (insuficiente, nova foto) | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Expressão·2 lados, Vínculo·2 lados, Foco·1 polo   |
| 47  | C2   | C-val2 (aprox.)            | M-sem-linhas (parcial, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Expressão·2 lados, Vínculo·2 lados, Foco·1 polo   |
| 48  | C2   | C-val2 (aprox.)            | M-dorso (insuficiente, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Expressão·2 lados, Vínculo·2 lados, Foco·1 polo   |
| 49  | C2   | C-val3 (desconhecido)      | M-insuf. (insuficiente, nova foto) | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Vínculo·2 lados, Ritmo·2 lados, Expressão·1 polo  |
| 50  | C2   | C-val3 (desconhecido)      | M-sem-linhas (parcial, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Vínculo·2 lados, Ritmo·2 lados, Expressão·1 polo  |
| 51  | C2   | C-val3 (desconhecido)      | M-dorso (insuficiente, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Vínculo·2 lados, Ritmo·2 lados, Expressão·1 polo  |
| 52  | C2   | C-demo1 (exato)            | M-insuf. (insuficiente, nova foto) | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Ritmo·2 lados, Expressão·2 lados, Foco·2 lados    |
| 53  | C2   | C-demo1 (exato)            | M-sem-linhas (parcial, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Ritmo·2 lados, Expressão·2 lados, Foco·2 lados    |
| 54  | C2   | C-demo1 (exato)            | M-dorso (insuficiente, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Ritmo·2 lados, Expressão·2 lados, Foco·2 lados    |
| 55  | C2   | C-demo2 (exato)            | M-insuf. (insuficiente, nova foto) | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Expressão·2 lados, Vínculo·1 polo, Ritmo·1 polo   |
| 56  | C2   | C-demo2 (exato)            | M-sem-linhas (parcial, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Expressão·2 lados, Vínculo·1 polo, Ritmo·1 polo   |
| 57  | C2   | C-demo2 (exato)            | M-dorso (insuficiente, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Expressão·2 lados, Vínculo·1 polo, Ritmo·1 polo   |
| 58  | C2   | C-demo3 (exato)            | M-insuf. (insuficiente, nova foto) | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Expressão·2 lados, Vínculo·1 polo, Foco·1 polo    |
| 59  | C2   | C-demo3 (exato)            | M-sem-linhas (parcial, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Expressão·2 lados, Vínculo·1 polo, Foco·1 polo    |
| 60  | C2   | C-demo3 (exato)            | M-dorso (insuficiente, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Expressão·2 lados, Vínculo·1 polo, Foco·1 polo    |
| 61  | C2   | C-demo4 (aprox.)           | M-insuf. (insuficiente, nova foto) | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Ritmo·2 lados, Vínculo·2 lados, Foco·2 lados      |
| 62  | C2   | C-demo4 (aprox.)           | M-sem-linhas (parcial, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Ritmo·2 lados, Vínculo·2 lados, Foco·2 lados      |
| 63  | C2   | C-demo4 (aprox.)           | M-dorso (insuficiente, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Ritmo·2 lados, Vínculo·2 lados, Foco·2 lados      |
| 64  | C2   | C-demo5 (desconhecido)     | M-insuf. (insuficiente, nova foto) | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Expressão·2 lados, Vínculo·2 lados, Foco·2 lados  |
| 65  | C2   | C-demo5 (desconhecido)     | M-sem-linhas (parcial, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Expressão·2 lados, Vínculo·2 lados, Foco·2 lados  |
| 66  | C2   | C-demo5 (desconhecido)     | M-dorso (insuficiente, nova foto)  | —                                            | U5                                                     | —                                                                              | indisp. (U5) | 3 temas: Expressão·2 lados, Vínculo·2 lados, Foco·2 lados  |
| 67  | C3   | C-ref exato (exato)        | —                                  | —                                            | U1                                                     | —                                                                              | indisp. (U1) | 3 temas: Ritmo·2 lados, Vínculo·2 lados, Foco·2 lados      |
| 68  | C3   | C-ref aprox. (aprox.)      | —                                  | —                                            | U1                                                     | —                                                                              | indisp. (U1) | 3 temas: Ritmo·2 lados, Vínculo·2 lados, Foco·2 lados      |
| 69  | C3   | C-ref desc. (desconhecido) | —                                  | —                                            | U1                                                     | —                                                                              | indisp. (U1) | 3 temas: Ritmo·2 lados, Vínculo·2 lados, Foco·2 lados      |
| 70  | C3   | C-val1 (exato)             | —                                  | —                                            | U1                                                     | —                                                                              | indisp. (U1) | 3 temas: Expressão·2 lados, Foco·2 lados, Vínculo·2 lados  |
| 71  | C3   | C-val2 (aprox.)            | —                                  | —                                            | U1                                                     | —                                                                              | indisp. (U1) | 3 temas: Expressão·2 lados, Vínculo·2 lados, Foco·1 polo   |
| 72  | C3   | C-val3 (desconhecido)      | —                                  | —                                            | U1                                                     | —                                                                              | indisp. (U1) | 3 temas: Vínculo·2 lados, Ritmo·2 lados, Expressão·1 polo  |
| 73  | C3   | C-demo1 (exato)            | —                                  | —                                            | U1                                                     | —                                                                              | indisp. (U1) | 3 temas: Ritmo·2 lados, Expressão·2 lados, Foco·2 lados    |
| 74  | C3   | C-demo2 (exato)            | —                                  | —                                            | U1                                                     | —                                                                              | indisp. (U1) | 3 temas: Expressão·2 lados, Vínculo·1 polo, Ritmo·1 polo   |
| 75  | C3   | C-demo3 (exato)            | —                                  | —                                            | U1                                                     | —                                                                              | indisp. (U1) | 3 temas: Expressão·2 lados, Vínculo·1 polo, Foco·1 polo    |
| 76  | C3   | C-demo4 (aprox.)           | —                                  | —                                            | U1                                                     | —                                                                              | indisp. (U1) | 3 temas: Ritmo·2 lados, Vínculo·2 lados, Foco·2 lados      |
| 77  | C3   | C-demo5 (desconhecido)     | —                                  | —                                            | U1                                                     | —                                                                              | indisp. (U1) | 3 temas: Expressão·2 lados, Vínculo·2 lados, Foco·2 lados  |
| 78  | C4   | —                          | M-clara (completa)                 | coração longa, coração curvada, cabeça unida | U2                                                     | —                                                                              | indisp. (U2) | indisp. (V2)                                               |
| 79  | C4   | —                          | M-parcial (parcial)                | coração longa, cabeça unida                  | U2                                                     | —                                                                              | indisp. (U2) | indisp. (V1)                                               |
| 80  | C4   | —                          | M-insuf. (insuficiente, nova foto) | —                                            | U2                                                     | —                                                                              | indisp. (U2) | indisp. (V1)                                               |
| 81  | C4   | —                          | M-sem-linhas (parcial, nova foto)  | —                                            | U2                                                     | —                                                                              | indisp. (U2) | indisp. (V1)                                               |
| 82  | C4   | —                          | M-dorso (insuficiente, nova foto)  | —                                            | U2                                                     | —                                                                              | indisp. (U2) | indisp. (V1)                                               |
| 83  | C4   | —                          | M-separada (parcial)               | coração longa, coração curvada               | U2                                                     | —                                                                              | indisp. (U2) | indisp. (V2)                                               |
| 84  | C5   | —                          | —                                  | —                                            | U3                                                     | —                                                                              | indisp. (U3) | indisp. (V1)                                               |
