# Fase 04D — Revisão: correspondências e biblioteca editorial (capítulos 8 e 9)

Estado: **proposta para revisão editorial.** Nenhum código do produto foi
escrito ou alterado. Não houve chamada paga, mudança nos motores nem deploy.

Este documento revisa a especificação do commit `5033f86`
(`docs/fase-04d-especificacao-capitulos-8-9.md`). O que não for alterado
aqui continua valendo.

## 0. Decisões aprovadas e mudanças desde `5033f86`

- **Aprovadas:**
  - D1: os quatro eixos existentes;
  - D3: os dedos ficam fora;
  - D4: os traços instáveis ficam fora até revalidação;
  - D5: elementos não se ligam pelo nome;
  - D6: até três temas, com aproximações e diferenças;
  - D9: montagem no navegador;
  - D10: sem IA.
- **Em direção:** D7 e D8. Os limites são conferidos na simulação (seção 5).
- **Revisada nesta entrega:** D2. A tabela de correspondências agora é
  explícita (seção 1), sem busca por palavras.

Mudanças em relação a `5033f86`:

1. **Capítulo 9 sem perguntas retomadas.** As perguntas dos capítulos 1–7
   não são repetidas. O capítulo 9 usa só textos novos (seção 3).
2. **Tensões calculadas a partir da ponte.** O capítulo 9 identifica os
   "dois lados" de um eixo pelos mesmos itens elegíveis do capítulo 8. Não
   usa `NarrativeTension`, que inclui itens excluídos, como os de elemento.
3. **Mínimo do capítulo 9:** pelo menos **2 temas**. Um tema de um lado só
   precisa de pelo menos 2 referências elegíveis.
4. **Referências agrupadas por capítulo:** "linha do coração longa; linha do
   coração curvada para cima (cap. 7)".
5. **"Posições do mapa", nunca "elementos do mapa"**, para não confundir com
   os elementos astrológicos (D5).

---

## 1. Tabela de correspondências

### 1.1 Definição editorial dos polos

Os eixos e os polos são os da `ToneTag` (`library/base.ts`, Fase 02E). A
definição abaixo é o **critério** usado para aceitar ou recusar uma
associação. Ela não vai ao texto do cliente.

| Polo                  | Critério: a leitura tradicional descreve…                     |
| --------------------- | ------------------------------------------------------------- |
| `ritmo:impulso`       | agir de imediato, sem pausa para avaliar                      |
| `ritmo:cautela`       | uma pausa de avaliação **antes** de agir ou decidir           |
| `expressao:expansiva` | mostrar abertamente o que sente ou pensa                      |
| `expressao:reservada` | guardar, conter ou revelar aos poucos o que sente ou pensa    |
| `foco:mudanca`        | busca de novidade, movimento e variação                       |
| `foco:estabilidade`   | busca de continuidade, permanência e constância               |
| `vinculo:autonomia`   | espaço próprio e independência **nas relações com os outros** |
| `vinculo:proximidade` | busca do outro, convivência e cuidado mútuo                   |

Uma associação só é aceita quando o **objeto** da leitura (afeto, decisão,
ação ou relação) e a **direção** (abrir ou guardar, esperar ou agir)
coincidem com o critério. Coincidência de palavra sem coincidência de
objeto não basta.

### 1.2 Lado das mãos: todas as características e valores

Fonte de todos os textos: `PALM_LIBRARY[característica][valor].symbolic` e
`HAND_TYPES[tipo].symbolic` em `src/features/palm-reading/analysis/library.ts`
(versão `03f2.1`). As citações são **literais**.

Condições comuns de elegibilidade para os traços **com** polo:

- visibilidade `clear` (`certainty: "determined"`);
- leitura sem `retakeRecommended`;
- traço presente nos capítulos 6–7 entregues.

Um traço parcial (`partial`) ou não visível **nunca** recebe polo.

| #   | Característica      | Valor         | Texto aprovado (citação literal)                                                                                                                                      | Eixo      | Polo        | Justificativa editorial                                                                                                                                                                                                     | Elegibilidade                                                                        | Exclusão                                  |
| --- | ------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------- |
| 1   | `heart.length`      | `short`       | "Na tradição, uma linha do coração mais curta é associada a um afeto mais reservado, que se revela aos poucos e para quem conquista a sua confiança."                 | expressão | `reservada` | O objeto é o **afeto** e a direção é guardar ou revelar aos poucos: coincide com o critério de `reservada`                                                                                                                  | Condições comuns                                                                     | —                                         |
| 2   | `heart.length`      | `medium`      | "Uma linha do coração de comprimento médio é tradicionalmente lida como equilíbrio entre expressar o que sente e preservar o próprio espaço."                         | —         | —           | O texto descreve **equilíbrio** entre os dois polos; dar um polo distorceria a leitura                                                                                                                                      | —                                                                                    | Sem polo (equilíbrio)                     |
| 3   | `heart.length`      | `long`        | "Uma linha do coração longa costuma ser associada, na quiromancia, a um afeto expansivo e generoso, que se envolve com intensidade."                                  | expressão | `expansiva` | O objeto é o **afeto** e a direção é mostrar e se envolver: coincide com `expansiva`                                                                                                                                        | Condições comuns                                                                     | —                                         |
| 4   | `heart.shape`       | `straight`    | "Quando a linha do coração segue mais reta, a tradição a relaciona a um modo mais racional e contido de lidar com os afetos."                                         | expressão | `reservada` | O objeto é o modo de **lidar com os afetos**, e "contido" é a direção de guardar. O lado "racional" não pertence a nenhum eixo e **não** é usado                                                                            | Condições comuns                                                                     | —                                         |
| 5   | `heart.shape`       | `curved`      | "Quando a linha do coração se curva em direção aos dedos, a tradição a associa a uma expressão afetiva calorosa e aberta."                                            | expressão | `expansiva` | O texto descreve uma **expressão afetiva** "aberta", que é literalmente o objeto e a direção do polo                                                                                                                        | Condições comuns                                                                     | —                                         |
| 6   | `head.start`        | `joined_life` | "Quando a linha da cabeça começa unida à da vida, a quiromancia costuma associar isso à cautela: você pode preferir avaliar bem antes de se lançar."                  | ritmo     | `cautela`   | "Avaliar bem antes de se lançar" é a pausa de avaliação antes de agir: coincide com `cautela`                                                                                                                               | Condições comuns. O validador já anula este valor quando a linha da vida não aparece | —                                         |
| 7   | `head.start`        | `separate`    | "Quando a linha da cabeça começa separada da linha da vida, a tradição associa isso à independência e à disposição para seguir o próprio caminho."                    | —         | —           | **Sem polo por padrão.** A independência descrita é de pensamento e de percurso, não das **relações com os outros**, que é o objeto do eixo vínculo. Associar exigiria ampliar o sentido do texto. **Decisão E1** (seção 7) | —                                                                                    | Sustentação insuficiente (pendente de E1) |
| 8   | `head.slope`        | `straight`    | "Uma linha da cabeça mais reta é tradicionalmente associada a um raciocínio prático e lógico, voltado ao concreto."                                                   | —         | —           | Descreve um **estilo de raciocínio**. "Concreto" não é continuidade nem permanência, então nenhum eixo tem esse objeto                                                                                                      | —                                                                                    | Sem correspondência                       |
| 9   | `head.slope`        | `sloping`     | "Quando a linha da cabeça desce em direção ao pulso, a tradição a liga à imaginação e a um pensamento mais criativo."                                                 | —         | —           | Imaginação e criatividade não estão em nenhum eixo                                                                                                                                                                          | —                                                                                    | Sem correspondência                       |
| 10  | `fate.presence`     | `present`     | "Uma linha do destino bem marcada é associada, na tradição, à sensação de propósito e a uma direção que você constrói ao longo do caminho — não a um destino fixo."   | —         | —           | Propósito e direção não estão em nenhum eixo                                                                                                                                                                                | —                                                                                    | Sem correspondência                       |
| 11  | `hand.fingerLength` | `short`       | "Na quiromancia, dedos mais curtos em relação à palma são ligados a um modo de agir rápido e direto, mais atento ao conjunto do que aos detalhes."                    | —         | —           | O texto teria objeto e direção de ritmo, mas o traço é **proporção estimada a olho**, com ressalva permanente (`PROPORTION_CAVEAT`)                                                                                         | —                                                                                    | **Excluído (D3)**                         |
| 12  | `hand.fingerLength` | `medium`      | "Dedos de comprimento médio em relação à palma são lidos pela tradição como um equilíbrio entre impulso e reflexão."                                                  | —         | —           | Equilíbrio e, além disso, proporção                                                                                                                                                                                         | —                                                                                    | **Excluído (D3)**                         |
| 13  | `hand.fingerLength` | `long`        | "Na quiromancia, dedos longos em relação à palma costumam ser associados à atenção aos detalhes e ao gosto por pensar antes de agir."                                 | —         | —           | Mesmo caso do nº 11                                                                                                                                                                                                         | —                                                                                    | **Excluído (D3)**                         |
| 14  | `hand.palmShape`    | `square`      | "Na quiromancia, a palma de formato mais quadrado costuma ser associada a um jeito prático de estar no mundo: gosto por estrutura, constância e soluções concretas."  | —         | —           | Inverteu com a mesma foto na 03F.2; também é proporção                                                                                                                                                                      | —                                                                                    | **Excluído (D4)**                         |
| 15  | `hand.palmShape`    | `rectangular` | "Na tradição da quiromancia, a palma mais longa do que larga é associada à sensibilidade e à imaginação: você pode se guiar bastante pelo que sente e intui."         | —         | —           | Idem                                                                                                                                                                                                                        | —                                                                                    | **Excluído (D4)**                         |
| 16  | `head.length`       | `short`       | "Na tradição, a linha da cabeça mais curta é ligada a um pensamento objetivo, que prefere ir direto ao ponto."                                                        | —         | —           | Inverteu com a mesma foto na 03F.2                                                                                                                                                                                          | —                                                                                    | **Excluído (D4)**                         |
| 17  | `head.length`       | `medium`      | "Uma linha da cabeça de comprimento médio é associada pela tradição a um pensamento que equilibra praticidade e reflexão."                                            | —         | —           | Idem                                                                                                                                                                                                                        | —                                                                                    | **Excluído (D4)**                         |
| 18  | `head.length`       | `long`        | "Uma linha da cabeça longa costuma ser associada, na quiromancia, a um pensamento abrangente, que gosta de considerar muitos ângulos antes de decidir."               | —         | —           | Idem                                                                                                                                                                                                                        | —                                                                                    | **Excluído (D4)**                         |
| 19  | `life.arc`          | `wide`        | "Na quiromancia, um arco amplo da linha da vida é associado ao entusiasmo e à abertura para novas experiências."                                                      | —         | —           | Inverteu com a mesma foto na 03F.2                                                                                                                                                                                          | —                                                                                    | **Excluído (D4)**                         |
| 20  | `life.arc`          | `close`       | "Um arco mais fechado da linha da vida é tradicionalmente lido como preferência por ambientes conhecidos e por um ritmo mais cuidadoso."                              | —         | —           | Idem                                                                                                                                                                                                                        | —                                                                                    | **Excluído (D4)**                         |
| 21  | `hand.type`         | `earth`       | "Palma mais quadrada com dedos curtos compõe o que a quiromancia moderna chama de mão de Terra, associada à praticidade, à estabilidade e ao contato com o concreto." | —         | —           | Depende de palma e dedos (D3 e D4) e tem homonímia com os elementos (D5)                                                                                                                                                    | —                                                                                    | **Excluído (D3, D4, D5)**                 |
| 22  | `hand.type`         | `air`         | "Palma mais quadrada com dedos longos compõe o que a quiromancia moderna chama de mão de Ar, associada à curiosidade, à comunicação e ao gosto por ideias."           | —         | —           | Idem                                                                                                                                                                                                                        | —                                                                                    | **Excluído (D3, D4, D5)**                 |
| 23  | `hand.type`         | `fire`        | "Palma mais longa com dedos curtos compõe o que a quiromancia moderna chama de mão de Fogo, associada ao entusiasmo, à iniciativa e à energia para começar."          | —         | —           | Idem                                                                                                                                                                                                                        | —                                                                                    | **Excluído (D3, D4, D5)**                 |
| 24  | `hand.type`         | `water`       | "Palma mais longa com dedos longos compõe o que a quiromancia moderna chama de mão de Água, associada à sensibilidade, à intuição e à receptividade."                 | —         | —           | Idem                                                                                                                                                                                                                        | —                                                                                    | **Excluído (D3, D4, D5)**                 |

**Resultado:** só **5 valores** recebem polo, em dois eixos:

- **expressão**, pelos dois polos: comprimento e traçado da linha do
  coração (nºs 1, 3, 4 e 5);
- **ritmo**, só pelo polo `cautela`: início da linha da cabeça unido à da
  vida (nº 6).

Os eixos **vínculo** e **foco** não têm nenhum traço das mãos, e o polo
`ritmo:impulso` também não. É uma consequência das exclusões aprovadas, não
uma lacuna a preencher.

Rótulos curtos para as referências [PROPOSTA]. São descritivos, sem
interpretação, e derivados da frase de observação do sistema:

- nº 1: "linha do coração curta";
- nº 3: "linha do coração longa";
- nº 4: "linha do coração de traçado reto";
- nº 5: "linha do coração curvada para cima";
- nº 6: "linha da cabeça começando unida à da vida".

### 1.3 Lado do céu (já aprovado na 02E, só reutilizado)

O polo vem de `SIGN_MEANINGS[signo].tags`, aplicado pelo motor (`tagsFor`)
aos itens de signo. Nada é atribuído de novo.

| Signo  | Polos                  | Signo       | Polos                         |
| ------ | ---------------------- | ----------- | ----------------------------- |
| Áries  | impulso, autonomia     | Libra       | proximidade                   |
| Touro  | cautela, estabilidade  | Escorpião   | reservada, estabilidade       |
| Gêmeos | mudança, expansiva     | Sagitário   | mudança, expansiva, autonomia |
| Câncer | proximidade, reservada | Capricórnio | cautela, reservada            |
| Leão   | expansiva              | Aquário     | autonomia, mudança            |
| Virgem | cautela                | Peixes      | proximidade                   |

O que é elegível:

- itens `body-sign` de Sol, Lua, Mercúrio, Vênus, Marte, Júpiter e Saturno;
- o item `angle-sign` do Ascendente;
- só com `certainty: "determined"`.

O que fica fora:

- Meio do Céu (o motor não dá etiqueta);
- Urano, Netuno e Plutão (geracionais);
- itens de ênfase ou ausência de elemento (D5; um deles fala em "construir
  com as próprias mãos");
- casas, aspectos, cúspides, regente e retrogradação (sem etiqueta);
- posições incertas por causa do horário.

---

## 2. Biblioteca do capítulo 8 [PROPOSTA]

### 2.1 Introdução (fixa)

> Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, trata-se de uma semelhança de linguagem, não de uma constatação sobre você; quando apontam para lados diferentes, a diferença fica à vista.

### 2.2 Formato de cada tema (montado pelo sistema)

```
{Título do eixo} · {Selo}
Nas mãos: {referências das mãos, agrupadas por capítulo}.
No céu: {referências do céu}.
No céu, o outro lado: {referências do polo oposto}.   ← só "com contraponto"
{Frase-ponte}
```

Títulos dos eixos:

- "Ritmo: impulso e cautela";
- "Expressão: abertura e reserva";
- "Vínculo: autonomia e proximidade" e "Foco: mudança e estabilidade" só
  são usados no capítulo 9.

Selos:

- "Aproximação";
- "Aproximação com contraponto";
- "Diferença";
- "Duas imagens nas mãos".

### 2.3 Frases-ponte

Em cada linha, "Fontes exigidas" diz quais referências estruturadas (ponte do
céu e ponte das mãos) precisam existir para a variante ser usada. As duas
fontes são sempre citadas no bloco do tema.

#### Ritmo, com o polo das mãos `cautela` (nº 6)

**Aproximação**

- Fontes exigidas: mãos com `ritmo:cautela`; céu com `ritmo:cautela` e sem
  `ritmo:impulso`.

> Aqui as duas leituras usam uma imagem parecida: um ritmo cuidadoso, de avaliar antes de seguir. É uma semelhança entre a linguagem da quiromancia e a da astrologia, não uma medida de como você age.

**Aproximação com contraponto**

- Fontes exigidas: mãos com `ritmo:cautela`; céu com `ritmo:cautela` **e**
  `ritmo:impulso`.

> As duas leituras usam a imagem de um ritmo cuidadoso, de avaliar antes de seguir. O mapa, porém, também traz uma imagem de ação mais imediata. As duas ficam lado a lado, sem que uma anule a outra.

**Diferença**

- Fontes exigidas: mãos com `ritmo:cautela`; céu só com `ritmo:impulso`.

> Aqui as leituras apontam para lados diferentes: a quiromancia associa este traço à cautela, e as posições citadas do mapa são associadas a uma ação mais imediata. As duas descrições ficam registradas como estão, sem uma conciliação forçada.

#### Expressão, com o polo das mãos `expansiva` (nºs 3 e 5)

**Aproximação**

- Fontes exigidas: mãos com `expressao:expansiva`; céu com
  `expressao:expansiva` e sem `expressao:reservada`.

> As duas leituras usam a imagem de uma expressão afetiva mais aberta. A semelhança está na linguagem das duas tradições; o que ela descreve na sua vida, só você pode avaliar.

**Aproximação com contraponto**

- Fontes exigidas: mãos com `expansiva`; céu com `expansiva` **e**
  `reservada`.

> Nas duas tradições aparece a imagem de uma expressão afetiva mais aberta. No mapa, ela divide espaço com imagens de reserva: são facetas descritas lado a lado, não uma conta que precise fechar.

**Diferença**

- Fontes exigidas: mãos com `expansiva`; céu só com `reservada`.

> Aqui as leituras seguem caminhos diferentes: a quiromancia associa estes traços a uma expressão mais aberta, e as posições citadas do mapa, a uma expressão mais reservada. A diferença fica à vista, sem conciliação.

#### Expressão, com o polo das mãos `reservada` (nºs 1 e 4)

**Aproximação**

- Fontes exigidas: mãos com `expressao:reservada`; céu com `reservada` e
  sem `expansiva`.

> As duas leituras usam a imagem de uma expressão afetiva mais reservada, que se revela aos poucos. É uma semelhança de linguagem entre duas tradições, não uma constatação sobre você.

**Aproximação com contraponto**

- Fontes exigidas: mãos com `reservada`; céu com `reservada` **e**
  `expansiva`.

> Nas duas tradições aparece a imagem de uma expressão afetiva mais reservada. O mapa também traz imagens de abertura: as duas convivem na leitura, sem que uma corrija a outra.

**Diferença**

- Fontes exigidas: mãos com `reservada`; céu só com `expansiva`.

> Aqui as leituras apontam para lados diferentes: a quiromancia associa estes traços a uma expressão mais reservada, e as posições citadas do mapa, a uma expressão mais aberta. As duas descrições ficam como estão.

#### Expressão, com os dois polos nas mãos (por exemplo, nºs 1 e 5)

**Duas imagens nas mãos**

- Fontes exigidas: mãos com `expansiva` **e** `reservada`; céu com pelo
  menos um dos dois polos.

> Nas mãos, a própria linha do coração traz duas imagens: uma de abertura e outra de reserva. Por isso, aqui não se aponta aproximação nem diferença; as imagens do mapa aparecem ao lado, só para comparação.

As variantes não escritas são intencionais, porque nenhuma característica
elegível sustenta esses polos:

- ritmo com `impulso` nas mãos;
- vínculo;
- foco.

Se E1 for aprovada, o vínculo com `autonomia` ganha as três variantes do
anexo A.

### 2.4 Sínteses (uma por capítulo, conforme as relações presentes)

| Padrão                                   | Texto                                                                                                                                                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Só aproximações (com ou sem contraponto) | > As aproximações acima mostram onde as duas tradições usam palavras parecidas. Elas servem como ponto de partida para observar a sua experiência, não como conclusão.                               |
| Só diferenças                            | > Nos temas comparados, as duas tradições apontam para lados diferentes. Isso não é um erro de nenhuma delas: são sistemas simbólicos distintos, e cada um pode ser confrontado com o que você vive. |
| Aproximações e diferenças                | > Há pontos em que as duas tradições usam imagens parecidas e pontos em que seguem caminhos diferentes. Os dois casos valem, no mesmo peso, como material de reflexão.                               |
| Com "duas imagens nas mãos"              | > As imagens comparadas aqui convivem dentro de cada leitura e entre elas. Servem como material de reflexão, não como conclusão.                                                                     |

### 2.5 Ressalvas (limitações do capítulo 8, montadas pelo sistema)

| Código      | Quando                                                     | Texto                                                                                                                                             |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| R0 (sempre) | Capítulo com conteúdo                                      | > Semelhanças entre tradições simbólicas não comprovam traços de personalidade, e diferenças entre elas não indicam erro de nenhuma das leituras. |
| R-conf      | Algum traço observado foi excluído por D3 ou D4            | > {Lista} não {entra/entram} nestas comparações: são traços que variaram entre análises da mesma foto ou proporções estimadas a olho.             |
| R-parcial   | Algum traço com polo ficou parcial                         | > {Lista} {ficou/ficaram} só parcialmente {visível/visíveis} na foto e por isso não {sustenta/sustentam} nenhuma comparação.                      |
| R-hora      | Posição elegível incerta por causa do horário (aproximado) | > {Lista} {depende/dependem} do horário de nascimento informado e não {entra/entram} nestas comparações.                                          |
| R-sem-hora  | Horário desconhecido                                       | > Sem o horário de nascimento, o Ascendente não faz parte desta leitura nem destas comparações.                                                   |
| R-escopo    | Capítulo com conteúdo                                      | > Os demais traços e posições não usam os eixos comparados aqui e por isso não aparecem neste capítulo.                                           |
| R-simulada  | Leitura das mãos simulada (ambiente interno)               | > Esta comparação usa uma leitura das mãos simulada, do ambiente interno de testes.                                                               |

As listas usam os rótulos de `FEATURE_LABELS` e a função de agrupamento
`labelList`, que já existe. Para o céu, usam o artigo e o nome de
`BODY_MEANINGS` ("a Lua", "o Ascendente").

### 2.6 Indisponibilidade

| Código | Quando                                                        | Texto                                                                                                                                                                                                         |
| ------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U1     | Céu disponível, mãos ausentes                                 | > As conexões dependem das duas leituras, e a leitura das mãos não está nesta jornada. Nenhuma conexão foi criada só a partir do mapa.                                                                        |
| U2     | Mãos disponíveis, céu ausente                                 | > As conexões dependem das duas leituras, e os capítulos do mapa natal não estão nesta jornada. Nenhuma conexão foi criada só a partir das mãos.                                                              |
| U3     | Nenhuma das duas                                              | > As conexões dependem das duas leituras, e nenhuma delas está disponível nesta jornada.                                                                                                                      |
| U4     | Mãos sem traço elegível e sem pedido de nova foto             | > Os traços das mãos que podem ser comparados — o comprimento e o traçado da linha do coração e o início da linha da cabeça — não ficaram nítidos o suficiente na foto. Por isso, nenhuma conexão foi criada. |
| U5     | Leitura das mãos com pedido de nova foto                      | > A leitura das mãos pediu uma nova foto. Sem uma observação nítida, nenhuma conexão foi criada.                                                                                                              |
| U6     | Traços elegíveis dos dois lados, mas sem nenhum eixo em comum | > Os traços nítidos das mãos e as posições do mapa não usam nenhum eixo em comum. Por isso, não há o que comparar, e nenhuma conexão foi criada para preencher o capítulo.                                    |

---

## 3. Biblioteca do capítulo 9 [PROPOSTA]

### 3.1 Introdução (fixa, com a lista de capítulos preenchida pelo sistema)

> Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos {lista}; as respostas, e a decisão sobre o que faz sentido para você, são suas.

### 3.2 Formato de cada tema

```
{Título do eixo} — a partir {do capítulo N | dos capítulos N, M e K}.
{Pergunta do eixo}
```

A personalização está **na seleção**: quais eixos, quais capítulos e qual
variante da pergunta.

- A variante "dois lados" é usada quando o eixo tem os dois polos entre as
  referências elegíveis (aproximação com contraponto, diferença ou duas
  imagens nas mãos).
- A variante "um polo" é usada quando todas as referências do eixo estão
  no mesmo polo.

### 3.3 Perguntas dos eixos (12)

| Eixo      | Variante     | Pergunta                                                                                                   |
| --------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| Ritmo     | dois lados   | > Quando foi a última vez que esperar antes de decidir ajudou você — e quando agir logo teria sido melhor? |
| Ritmo     | cautela      | > Que decisões você costuma tomar com calma, e quais gostaria de tomar com menos espera?                   |
| Ritmo     | impulso      | > Que escolhas você costuma fazer de imediato? Alguma delas pediria um pouco mais de tempo?                |
| Expressão | dois lados   | > Com quem você mostra com facilidade o que sente, e com quem prefere guardar mais para si?                |
| Expressão | expansiva    | > De que formas você costuma demonstrar afeto, e quais delas parecem mais naturais para você?              |
| Expressão | reservada    | > O que precisa acontecer para você contar a alguém o que está sentindo?                                   |
| Vínculo   | dois lados   | > Em quais momentos da sua semana você procura companhia, e em quais prefere ficar por conta própria?      |
| Vínculo   | autonomia    | > Que espaços de independência são importantes para você hoje, e como você cuida deles?                    |
| Vínculo   | proximidade  | > Com quem você gosta de dividir o dia a dia, e o que torna essa convivência boa?                          |
| Foco      | dois lados   | > O que na sua vida você gostaria de manter como está, e o que gostaria de ver mudar?                      |
| Foco      | mudança      | > Que novidade recente despertou o seu interesse, e o que ela trouxe de bom ou de difícil?                 |
| Foco      | estabilidade | > Que hábitos ou lugares trazem a você uma sensação de continuidade?                                       |

Nenhuma delas repete ou parafraseia as 13 perguntas dos capítulos 1–7. A
pré-verificação está na seção 6.3. Todas evitam:

- a abertura "Em que situações", já usada três vezes nos capítulos 1–7;
- o termo "equilíbrio", da pergunta do capítulo 4;
- "se sentir à vontade", da pergunta do capítulo 4.

### 3.4 Práticas opcionais (uma por capítulo, a do primeiro tema)

| Eixo               | Prática                                                                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ritmo              | > Se quiser, observe durante alguns dias as pequenas decisões do cotidiano: quais você toma de imediato e quais deixa para depois. Não é preciso mudar nada, só notar. |
| Expressão          | > Se quiser, repare ao longo de uma semana em quando você fala do que sente e quando prefere guardar. Anotar uma ou duas situações já basta.                           |
| Vínculo            | > Se quiser, observe numa semana comum os momentos em que buscou companhia e os momentos em que preferiu ficar só, e como foi cada um.                                 |
| Foco               | > Se quiser, faça uma lista curta do que você gostaria de manter e do que gostaria de experimentar. A lista pode mudar quando você quiser.                             |
| Genérica (reserva) | > Se quiser, volte a um dos capítulos daqui a algumas semanas e veja se a leitura parece diferente. Mudar de opinião sobre ela também faz parte.                       |

### 3.5 Pergunta final e nota de fechamento (fixas)

> Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?

> Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.

### 3.6 Seleção, quantidade e indisponibilidade

**Seleção dos temas** (no máximo 3, um por eixo), por prioridade:

1. temas do capítulo 8, na mesma ordem;
2. eixos com os dois polos entre as referências elegíveis de um lado;
3. eixos com um só polo e pelo menos 2 referências elegíveis.

Em empate, vence o eixo apoiado por mais capítulos, depois a ordem fixa:
ritmo, expressão, vínculo, foco.

**Quantidade:** de 2 a 3 perguntas de eixo, mais 1 prática opcional e a
pergunta final. Ou seja, **de 4 a 5 itens de reflexão**, dentro da faixa de
4 a 7 da D7.

**Indisponibilidade:**

| Código | Quando                 | Texto                                                                                                                                                                                    |
| ------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1     | Nenhum tema sustentado | > Não há temas suficientes nesta jornada para montar um guia de reflexão sem inventar conteúdo. O guia precisa de pelo menos dois temas sustentados pelos capítulos anteriores.          |
| V2     | Só um tema sustentado  | > Os capítulos disponíveis sustentam só um tema com segurança, e o guia precisa de pelo menos dois. Para não preencher o espaço com temas inventados, ele não foi montado nesta jornada. |

**Regra de não conexão.** Um capítulo 9 sem capítulo 8 não usa as
expressões "conexão", "as duas leituras", "as duas tradições", "céu e mãos"
nem "aproximação". Os textos acima são neutros e servem para todos os
cenários.

---

## 4. Exemplos de capítulos 8 e 9

> **EXEMPLOS FICTÍCIOS — não são a leitura de ninguém.** Foram montados pela
> simulação (seção 5) com o motor astrológico e o motor das mãos reais,
> aplicados a fixtures do projeto:
>
> - céu: casos de `interpretation/test-support.ts`, `VALIDATION_CASES` e
>   `DEMO_CASES`;
> - mãos: `analysis/__fixtures__/observations.ts` e variações já usadas nos
>   testes da 03C.
>
> Os textos fixos são os da biblioteca proposta.

### Exemplo 1 — Relatório completo (céu `ref-sp1990-exact` × mãos `clearHand`)

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

_Introdução:_ texto 2.1.

**Ritmo: impulso e cautela** · Aproximação com contraponto
Nas mãos: linha da cabeça começando unida à da vida (cap. 7).
No céu: Sol em Touro (cap. 1); Mercúrio em Touro (cap. 3); Saturno em
Capricórnio (cap. 5).
No céu, o outro lado: Vênus em Áries (cap. 4).
As duas leituras usam a imagem de um ritmo cuidadoso, de avaliar antes de
seguir. O mapa, porém, também traz uma imagem de ação mais imediata. As
duas ficam lado a lado, sem que uma anule a outra.

**Expressão: abertura e reserva** · Aproximação com contraponto
Nas mãos: linha do coração longa; linha do coração curvada para cima (cap. 7).
No céu: Lua em Sagitário (cap. 2).
No céu, o outro lado: Saturno em Capricórnio; Júpiter em Câncer (cap. 5).
Nas duas tradições aparece a imagem de uma expressão afetiva mais aberta.
No mapa, ela divide espaço com imagens de reserva: são facetas descritas
lado a lado, não uma conta que precise fechar.

_Síntese:_ "As aproximações acima mostram onde as duas tradições usam
palavras parecidas…"

_Limitações:_

- R0.
- R-conf: "O formato da palma, o comprimento dos dedos, o comprimento da
  linha da cabeça e o arco da linha da vida não entram nestas comparações:
  são traços que variaram entre análises da mesma foto ou proporções
  estimadas a olho."
- R-escopo.

Apenas 2 temas. O eixo vínculo não foi forçado, porque nenhum traço das
mãos o sustenta.

**Capítulo 9 — Seu guia pessoal de reflexão**

_Introdução:_ "…Os temas vêm dos capítulos 1, 2, 3, 4, 5 e 7…"

1. **Ritmo: impulso e cautela** — a partir dos capítulos 1, 3, 4, 5 e 7.
   Quando foi a última vez que esperar antes de decidir ajudou você — e
   quando agir logo teria sido melhor?
2. **Expressão: abertura e reserva** — a partir dos capítulos 2, 5 e 7.
   Com quem você mostra com facilidade o que sente, e com quem prefere
   guardar mais para si?
3. **Vínculo: autonomia e proximidade** — a partir dos capítulos 2, 4 e 5.
   Em quais momentos da sua semana você procura companhia, e em quais
   prefere ficar por conta própria?

_Se quiser:_ prática de ritmo.
_Para fechar:_ pergunta final.
_Nota:_ nota de fechamento.

O tema 3 vem só do céu: o capítulo 9 não o chama de conexão.

### Exemplo 2 — Temas coincidentes (céu `demo-Rio Branco` × mãos `clearHand`)

**Capítulo 8:**

- **Ritmo** · _Aproximação_
  - Nas mãos: linha da cabeça começando unida à da vida (cap. 7).
  - No céu: Ascendente em Virgem (cap. 1); Saturno em Virgem; Júpiter em
    Capricórnio (cap. 5).
  - Frase-ponte: "Aqui as duas leituras usam uma imagem parecida: um ritmo
    cuidadoso, de avaliar antes de seguir. É uma semelhança entre a
    linguagem da quiromancia e a da astrologia, não uma medida de como você
    age."
- **Expressão** · _Aproximação com contraponto_
  - Nas mãos: linha do coração longa; curvada para cima (cap. 7).
  - No céu: Mercúrio em Gêmeos (cap. 3); Marte em Leão (cap. 4).
  - Outro lado: Sol em Câncer (cap. 1); Vênus em Câncer (cap. 4).

**Capítulo 9:**

- Ritmo, variante "cautela": "Que decisões você costuma tomar com calma, e
  quais gostaria de tomar com menos espera?";
- Expressão, variante "dois lados";
- Vínculo, variante "proximidade" (capítulos 1, 2 e 4): "Com quem você gosta
  de dividir o dia a dia, e o que torna essa convivência boa?".

### Exemplo 3 — Temas divergentes (céu `validacao-desconhecido` × mãos `clearHand`)

**Capítulo 8:**

- **Ritmo** · _Aproximação com contraponto_
  - No céu: Júpiter em Capricórnio (cap. 5).
  - Outro lado: Vênus em Áries (cap. 4).
- **Expressão** · _Diferença_
  - Nas mãos: linha do coração longa; curvada para cima (cap. 7).
  - No céu: Lua em Câncer (cap. 2); Júpiter em Capricórnio (cap. 5).
  - Frase-ponte: "Aqui as leituras seguem caminhos diferentes: a
    quiromancia associa estes traços a uma expressão mais aberta, e as
    posições citadas do mapa, a uma expressão mais reservada. A diferença
    fica à vista, sem conciliação."

**Limitações:** R0, R-sem-hora ("Sem o horário de nascimento, o Ascendente
não faz parte desta leitura nem destas comparações"), R-conf e R-escopo.

**Síntese:** "Há pontos em que as duas tradições usam imagens parecidas e
pontos em que seguem caminhos diferentes…"

### Exemplo 4 — Leitura parcial (céu `ref-sp1990-approximate` × mãos `partialHand`)

**Capítulo 8:** os mesmos dois temas do exemplo 1, com uma diferença na
Expressão: as mãos só trazem a "linha do coração longa", porque o traçado
ficou parcial e foi excluído.

**Limitações:**

- R0;
- R-parcial: "O traçado da linha do coração ficou só parcialmente visível na
  foto e por isso não sustenta nenhuma comparação.";
- R-hora: "O Ascendente depende do horário de nascimento informado e não
  entra nestas comparações.";
- R-conf;
- R-escopo.

**Capítulo 9:** igual ao exemplo 1.

### Exemplo 5 — Somente astrologia (céu `validacao-exato`, sem mãos)

**Capítulo 8:** indisponível com U1.

**Capítulo 9:** "Os temas vêm dos capítulos 1, 2, 3, 4 e 5". Três temas,
todos na variante "dois lados":

- Expressão (capítulos 1, 3, 4 e 5);
- Foco (capítulos 1, 3, 4 e 5);
- Vínculo (capítulos 1, 2 e 4).

O guia não menciona mãos nem conexões.

### Exemplo 6 — Somente leitura das mãos (sem céu × mãos `clearHand`)

**Capítulo 8:** indisponível com U2.

**Capítulo 9:** **indisponível com V2.** Só a Expressão tem 2 referências
elegíveis (as duas da linha do coração). O Ritmo tem uma só (o início da
cabeça), e os demais eixos não têm nenhuma.

### Exemplo 7 — Nenhuma conexão elegível (céu `ref-sp1990-exact` × mãos `linesMissing`)

**Capítulo 8:** indisponível com U5. As linhas não foram identificadas, e
com só palma e dedos observados a leitura pede uma nova foto. Palma e dedos
estão excluídos de qualquer forma.

**Capítulo 9:** três temas do céu: Ritmo, Vínculo e Foco.

### Exemplo 8 — Conteúdo insuficiente para o capítulo 9 (sem céu × mãos `partialHand`)

**Capítulo 8:** indisponível com U2.

**Capítulo 9:** indisponível com V1. Restam uma referência na Expressão e
uma no Ritmo, e nenhuma atinge o mínimo de 2.

---

## 5. Simulação de cobertura

### 5.1 Método

- **Script descartável, fora do repositório**, em
  `/tmp/claude-0/-home-user-astrologia-app/3fe5797d-c926-5a7d-8184-2d2b94c85308/scratchpad/sim04d/sim.test.ts`.
  Ele roda no Vitest do projeto, **sem rede e sem IA**.
- Aplica exatamente as regras deste documento sobre os motores reais:
  `buildInterpretation`, `validatePalmObservation` e
  `buildPalmInterpretation`.

**Céu** (12 situações):

- o caso de referência em 3 precisões (`test-support`);
- os 3 `VALIDATION_CASES` da 02F;
- os 5 `DEMO_CASES` que normalizam sem escolha;
- "sem céu".

Os demais demonstrativos pedem escolha ou recusam o horário.

**Mãos** (7 situações):

- `clearHand`, `partialHand`, `insufficientPhoto` e `linesMissing`;
- a contraditória do provedor simulado (dorso da mão);
- a variação da 03C com a linha da cabeça separada;
- "sem mãos".

**Total: 84 combinações.** Os critérios **não** foram ajustados depois da
simulação.

### 5.2 Resultados por cenário pedido

| Cenário                                                                        | Combinações | Capítulo 8                                                                                      | Capítulo 9                                                |
| ------------------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 1. Relatório completo (céu × mão com traço elegível: clara, parcial, separada) | 33          | **33 disponíveis**: 18 com 2 temas, 15 com 1 tema                                               | **33 disponíveis** (3 temas)                              |
| 2. Somente astrologia                                                          | 11          | 11 indisponíveis (U1)                                                                           | **11 disponíveis** (3 temas, só do céu)                   |
| 3. Somente leitura das mãos                                                    | 6           | 6 indisponíveis (U2)                                                                            | **6 indisponíveis**: 2 por V2 (só a Expressão) e 4 por V1 |
| 4a. Leitura parcial (`partialHand`)                                            | 11          | **11 disponíveis**: 9 com 2 temas, 2 com 1 tema                                                 | 11 disponíveis                                            |
| 4b. Parcial sem linhas (`linesMissing`)                                        | 11          | 11 indisponíveis (U5: nova foto)                                                                | 11 disponíveis (só céu)                                   |
| 5. Temas coincidentes                                                          | —           | 48 temas de aproximação (6 sem e 42 com contraponto), em 32 das 33 combinações com o capítulo 8 | —                                                         |
| 6. Temas divergentes                                                           | —           | **3 temas de diferença**, todos com o mesmo céu (`validacao-desconhecido`)                      | —                                                         |
| 7. Nenhuma conexão elegível (insuficiente, contraditória ou sem linhas × céu)  | 33          | 33 indisponíveis (U5)                                                                           | 33 disponíveis (só céu)                                   |
| 8. Conteúdo insuficiente para o capítulo 9                                     | 7           | 7 indisponíveis (U2 ou U3)                                                                      | **7 indisponíveis** (V1 ou V2), todos sem céu             |

**Totais:**

- capítulo 8: **33 de 84 disponíveis**, com 51 temas;
- capítulo 9: **77 de 84 disponíveis**.

**Com E1 aprovada** (a linha da cabeça separada passa a ter o polo
autonomia), muda só o cenário 1:

- 29 combinações com 2 temas, em vez de 18;
- 11 temas de vínculo;
- 5 diferenças em vez de 3.

O capítulo 9 não muda.

### 5.3 O que a simulação mostra

1. **A aproximação com contraponto domina: 42 dos 51 temas.** O mapa tem
   sete corpos elegíveis e quase sempre cobre os dois polos do eixo. É uma
   descrição honesta, mas pode soar repetitiva entre pessoas diferentes.
   **E3:** aceitar, porque é fiel aos dados. A alternativa seria só citar o
   contraponto quando ele for majoritário, o que introduz contagem e "força",
   e não recomendo.
2. **Diferenças são raras: 3 em 84, todas de um único mapa.** Isso reflete
   a amostra, já que 4 dos 11 mapas são o mesmo nascimento, e não um viés da
   regra. A regra nunca descartou uma diferença.
3. **O capítulo 9 só com as mãos nunca fica disponível.** Com as exclusões
   aprovadas, só a linha do coração sustenta um tema com 2 referências.
   **E2:** manter indisponível, sem baixar o mínimo, conforme a sua
   instrução de não aumentar a disponibilidade artificialmente.
4. **U4 e U6 não ocorreram nas fixtures.** Nas fixtures existentes, mãos
   sem traço elegível sempre vêm com pedido de nova foto (U5), e todo mapa
   tem ritmo e expressão. Os dois casos só serão cobertos por casos
   construídos nos testes da implementação.
5. **O capítulo 9 atinge o teto de 3 temas sempre que há céu**, e usa a
   variante "dois lados" em 82% dos temas. Os limites da D7 se confirmam:
   de 4 a 5 itens, nunca mais de 7.
6. **Com um único tema fundamentado, o capítulo 8 fica com 1 tema** (15 de
   33 casos completos). Não há preenchimento.

---

## 6. Proposta técnica: o que acompanha os capítulos na memória da jornada

### 6.1 Ponte do céu (gerada no servidor, junto dos capítulos 1–5)

```ts
type SkyBridge = {
  version: string; // versão da ponte + INTERPRETATION_VERSION
  items: {
    ref: string; // InterpretationItem.id, ex. "identidade:body-sign:sun"
    factId: string; // Fact.id, ex. "body-sign:sun"
    chapter: 1 | 2 | 3 | 4 | 5;
    point:
      | "sun"
      | "moon"
      | "mercury"
      | "venus"
      | "mars"
      | "jupiter"
      | "saturn"
      | "asc";
    sign: Sign; // para o rótulo "Sol em Touro"
    poles: ToneTag[]; // de SIGN_MEANINGS, como o motor já faz
  }[]; // só os elegíveis (1.3)
  excluded: {
    point:
      | "moon"
      | "asc"
      | "sun"
      | "mercury"
      | "venus"
      | "mars"
      | "jupiter"
      | "saturn";
    reason: "uncertain" | "time-unknown";
  }[];
};
```

### 6.2 Ponte das mãos (gerada no servidor, junto dos capítulos 6–7)

```ts
type HandsBridge = {
  version: string; // versão da ponte + PALM_ENGINE_VERSION + versão da tabela 1.2
  retakeRecommended: boolean;
  simulated: boolean;
  items: {
    ref: string; // PalmItem.id, ex. "linhas:heart.shape:curved"
    chapter: 6 | 7;
    feature: "heart.length" | "heart.shape" | "head.start";
    value: string;
    pole: ToneTag; // da tabela 1.2
  }[]; // só nítidos e com polo
  excluded: {
    feature: FeatureId | "hand.type";
    reason: "partial" | "unreliable" | "proportion";
  }[]; // só os observados
};
```

### 6.3 Saída dos capítulos 8 e 9 (no navegador, só em memória)

Cada tema guarda `sources: string[]`, com os `ref` da ponte que o
sustentam. Isso não é exibido, mas é conferido nos testes e permite
rastrear o tema até `InterpretationItem` e `Fact`, ou até `PalmItem` e
`PalmFact`.

Também guarda `libraryKey` (por exemplo, `c8.ritmo.cautela.AC`) para provar
que o texto veio da biblioteca.

### 6.4 O que não é transportado

- Data, hora e local de nascimento.
- Coordenadas, fuso, graus, casas e orbes.
- Foto, JPEG, URL `blob:`, hash e impressão digital.
- Recibo, token de consentimento, mão (direita ou esquerda), evidência
  visual e problemas de imagem.
- Origem do texto (IA ou biblioteca), modelo e custos.
- Itens não elegíveis. A ponte é **filtrada no servidor**: o navegador não
  recebe nada além do necessário.

A ponte segue as mesmas regras de descarte da 04B e da 04C: sair da
jornada, recarregar ou fechar apaga tudo. Nada vai para o armazenamento do
navegador, e não há nenhuma chamada nova.

### 6.5 Pré-verificação automática dos textos propostos (já executada)

Um segundo script descartável submeteu todos os textos das seções 2 e 3 e
do anexo A aos validadores existentes. Os resultados estão em 7.1 e 7.3.

---

## 7. Critérios objetivos para aprovação editorial

### 7.1 Automáticos (precisam estar 100% antes da implementação)

| #   | Critério                                                                                                                                                                      | Resultado agora              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| A1  | Toda citação da tabela 1.2 existe **literalmente** em `library.ts`                                                                                                            | ✔ 24 de 24 citações literais |
| A2  | Nenhum polo em característica excluída, parcial ou sem justificativa (tabela)                                                                                                 | ✔ (por construção)           |
| A3  | Nenhum texto proposto aciona `FORBIDDEN_PATTERNS`, `SENSITIVE_PATTERNS` ou `presumedGender`                                                                                   | ✔ 0 ocorrências em 53 textos |
| A4  | Nenhum texto do capítulo 8 contém: confirma, comprova (afirmativo), prova, reforça, evidência, correlação, "não é coincidência", "por acaso", Fogo, Terra, Ar, Água, "mão de" | ✔ 0 ocorrências em 31 textos |
| A5  | Nenhuma pergunta ou prática do capítulo 9 é igual (após normalização) a uma das 13 perguntas dos capítulos 1–7 nem começa pelas mesmas três palavras                          | ✔ nenhuma semelhança         |
| A6  | Os textos do capítulo 9 não usam "conexão", "as duas leituras", "as duas tradições", "céu e mãos" nem "aproximação"                                                           | ✔ 0 ocorrências em 22 textos |
| A7  | Limites: introdução ≤ 400 caracteres; frase-ponte ≤ 300; pergunta ≤ 160; prática ≤ 220                                                                                        | ✔ todos dentro dos limites   |

### 7.2 Revisão humana (roteiro de sim ou não, nos 8 exemplos)

1. Alguma frase sugere que uma tradição confirma a outra, ou que a
   semelhança diz algo comprovado sobre a pessoa?
2. Alguma diferença foi suavizada ou explicada?
3. Algum traço parcial, instável ou excluído sustenta um tema?
4. Alguma pergunta sugere a resposta, promete resultado ou soa como
   conselho?
5. A prática soa obrigatória?
6. O texto soa natural lido em voz alta? Há repetição incômoda entre temas?
7. A pergunta final permite discordar com o mesmo peso que concordar?

**Aceite:**

- zero "sim" nos itens 1 a 5;
- no item 6, cada observação resolvida com nova redação, aprovada antes do
  código;
- no item 7, "sim".

### 7.3 Resultado da pré-verificação automática

Execução gratuita, sem rede, com o script descartável
`/tmp/claude-0/-home-user-astrologia-app/3fe5797d-c926-5a7d-8184-2d2b94c85308/scratchpad/sim04d/check.test.ts`.
Ele extrai do próprio documento todos os textos marcados com `>` nas seções
2, 3 e no anexo A, e os submete aos padrões do projeto:

- `FORBIDDEN_PATTERNS` e `SENSITIVE_PATTERNS` (02F);
- `PALM_FORBIDDEN_TEXT_PATTERNS` e `PALM_SENSITIVE_PATTERNS` (03C);
- `presumedGender` (03F.2);
- as listas novas A4 e A6;
- a comparação com as 13 perguntas existentes;
- os limites de tamanho.

Resultados:

- **53 textos verificados** (31 do capítulo 8, incluindo o anexo A, e 22 do
  capítulo 9): **0 falhas**.
- **Citações (A1):** 24 de 24 idênticas aos textos de `library.ts`.

Uma falha encontrada na primeira execução foi corrigida antes desta
entrega. A introdução do capítulo 8 dizia "não uma confirmação de quem você
é", e a lista A4 recusa "confirma…" mesmo em negação. O texto passou a dizer
"não de uma constatação sobre você". Também foram retiradas, por cautela,
duas palavras que os padrões do projeto só aceitam quando negadas:
"comprovada" (anexo A) e "diagnóstico" (nota de fechamento).

A pré-verificação **não substitui** a revisão humana da seção 7.2.

---

## 8. Decisões pendentes

| #   | Decisão                                                                                    | Recomendação                    |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------- |
| E1  | Linha da cabeça **separada** → `vinculo:autonomia`?                                        | **Não** (objeto não relacional) |
| E2  | Capítulo 9 só com as mãos fica indisponível (mínimo de 2 temas mantido)                    | Manter                          |
| E3  | Aproximação com contraponto como caso mais comum (42 de 51 temas), sem contagem de "força" | Aceitar                         |
| E4  | Capítulo 9 sem perguntas retomadas dos capítulos 1–7                                       | Aprovar                         |
| E5  | Tabela 1.2, rótulos curtos e todos os textos [PROPOSTA] das seções 2 e 3                   | Revisão editorial               |

---

## Anexo A — Variantes de vínculo (só se E1 for aprovada)

Fontes exigidas: mãos com `head.start:separate` (`vinculo:autonomia`).

- **Aproximação:** céu com `autonomia` e sem `proximidade`.

  > As duas leituras usam a imagem de um espaço próprio valorizado. É uma semelhança de linguagem entre duas tradições, não uma constatação sobre as suas relações.

- **Aproximação com contraponto:** céu com `autonomia` **e** `proximidade`.

  > Nas duas tradições aparece a imagem de um espaço próprio valorizado. O mapa também traz imagens de busca de proximidade: as duas convivem na leitura, sem que uma anule a outra.

- **Diferença:** céu só com `proximidade`.

  > Aqui as leituras apontam para lados diferentes: a quiromancia associa este traço à independência, e as posições citadas do mapa, à busca de proximidade. As duas descrições ficam registradas como estão.
