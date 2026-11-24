# Fase 04D — Biblioteca consolidada dos capítulos 8 e 9

Estado: **biblioteca aprovada com correções finais pontuais**, aplicadas
neste documento (revisão final: seção 5 e seção 7). Não houve código do produto,
chamada paga, mudança nos motores nem deploy.

Este é o **documento de referência único** para a revisão dos textos
literais, das correspondências e das regras dos capítulos 8 e 9. Ele
consolida e substitui, para efeito de revisão, os documentos anteriores da
04D:

- `fase-04d-especificacao-capitulos-8-9.md` (`5033f86`);
- `fase-04d-revisao-biblioteca.md` (`96353c1`);
- `fase-04d-ajuste-selecao.md` (`e6c291d`).

Os três continuam no repositório como **histórico das decisões**. Em caso
de divergência, vale este documento.

Os textos das seções 3 e 4 e os exemplos da seção 6 foram gerados a partir
de **uma única fonte de dados**, a biblioteca usada na verificação. O que se
lê aqui é exatamente o que a verificação testou.

## 0. Decisões

| #   | Decisão                                                                     | Estado                                                 |
| --- | --------------------------------------------------------------------------- | ------------------------------------------------------ |
| D1  | Os quatro eixos existentes (`ToneTag`)                                      | Aprovada                                               |
| D3  | Comprimento dos dedos fora das conexões                                     | Aprovada                                               |
| D4  | Traços instáveis na 03F.2 fora até revalidação                              | Aprovada                                               |
| D5  | Elementos e tipos de mão nunca relacionados pelo nome                       | Aprovada                                               |
| D6  | Até 3 temas no capítulo 8, com aproximações e diferenças                    | Aprovada                                               |
| D9  | Montagem no navegador, sem novos envios                                     | Aprovada                                               |
| D10 | Sem IA                                                                      | Aprovada                                               |
| E1  | Linha da cabeça separada sem polo                                           | Aprovada                                               |
| E2  | Capítulo 9 só com as mãos indisponível sem conteúdo suficiente (provisório) | Aprovada                                               |
| E4  | Perguntas inéditas do capítulo 9                                            | Aprovada                                               |
| F1  | Tabela de assuntos                                                          | Aprovada                                               |
| F2  | Contraponto só dentro do mesmo assunto                                      | Aprovada                                               |
| F3  | Critério de destaque isolado rejeitado                                      | Aprovada                                               |
| F4  | Alterações conceituais dos três textos                                      | Aprovada; **textos exatos na seção 5**                 |
| F5  | Redução da cobertura                                                        | Aprovada                                               |
| F6  | Testes para os casos ausentes                                               | Aprovada; **executados (seção 7)**                     |
| E6  | Capítulo 9: "dois lados" só com tensão fundamentada no mesmo assunto        | Aprovada; **um polo corrigido na revisão final (1.3)** |
| E5  | Biblioteca editorial                                                        | Aprovada com as correções finais (seção 5)             |

---

## 1. Regras de seleção

### 1.1 Elegibilidade

- **Mãos:** só os 5 valores com polo da tabela 2.2, com visibilidade
  `clear` e leitura sem pedido de nova foto. Traço parcial, não visível,
  instável (D4), de proporção (D3) ou sem polo nunca sustenta tema.
- **Céu:**
  - itens de signo de Sol, Lua, Mercúrio, Vênus, Marte, Júpiter e Saturno e
    o Ascendente, com `certainty: "determined"` e polo dado pelo motor
    (tabela 2.3);
  - posições incertas por causa do horário ficam fora;
  - Meio do Céu, corpos lentos, elementos, casas, aspectos, cúspides, regente
    e retrogradação também ficam fora.

### 1.2 Capítulo 8

1. **Assunto comum (F1).** Para cada eixo com traço elegível das mãos, os
   referentes do céu são só as posições elegíveis **do mesmo assunto**
   (tabela 2.4) que têm polo no eixo:
   - linha do coração ↔ Lua e Vênus;
   - início da linha da cabeça ↔ Marte.
2. **Classificação**, só com esses referentes:
   - **Aproximação:** o céu tem o polo das mãos e não tem o oposto.
   - **Aproximação com contraponto:** o céu tem os dois polos, sempre dentro
     do mesmo assunto (F2).
   - **Diferença:** o céu só tem o polo oposto.
   - **Duas imagens nas mãos:** as mãos têm os dois polos.
3. **Sem referente do mesmo assunto no eixo, não há tema.** Sem nenhum tema,
   vale U6.
4. No máximo 3 temas, nunca forçados; diferenças sempre mostradas; ordem
   fixa dos eixos (ritmo, expressão, vínculo, foco).
5. **Consequência:** com Marte como única posição do assunto "agir", o
   ritmo **nunca** tem contraponto. A frase-ponte de ritmo com contraponto
   foi **retirada** porque não é alcançável (seção 5).

### 1.3 Capítulo 9 (revisão definitiva: temas por assunto)

**Finalidade.** O capítulo 9 é um guia de reflexão **sobre o relatório**.
Ao contrário do capítulo 8, ele **não** relaciona as tradições. Cada tema
vem de interpretações **efetivamente apresentadas** nos capítulos 1 a 7,
com os `ref` dos itens originais.

**Unidade do tema:** um **assunto** (tabela 2.6).

**Seleção** (determinística, no máximo 3 temas, nunca 2 do mesmo assunto):

1. **Temas do capítulo 8**, os únicos que juntam céu e mãos (afeto ou agir).
2. **Os demais assuntos**, cada um com **uma só tradição**: a primeira, na
   ordem do relatório, que sustente a pergunta. Sem o capítulo 8, céu e mãos
   não são juntados.
3. **Pergunta:**
   - **afeto e agir:** pergunta de eixo.
     - "Dois lados" quando as interpretações do assunto têm os dois polos do
       eixo (por exemplo, Lua × Vênus).
     - "Um polo" quando têm o mesmo.
     - Só contam eixos que o assunto trata (2.5). Sem polo neles (por
       exemplo, Marte em Peixes), o assunto é **excluído**.
   - **identidade e pensamento:** a pergunta do assunto (4.2).
4. **Prioridade:**
   1. capítulo 8;
   2. tensão;
   3. um polo;
   4. pergunta geral do assunto.

   Dentro de cada nível, vale a ordem do relatório. Assim, as perguntas que
   dependem da leitura da pessoa vêm antes das gerais.

**Não entram:**

- interpretações incertas pelo horário;
- traços das mãos parciais, não visíveis, instáveis (D4), de proporção (D3)
  ou sem polo nem assunto (por exemplo, a cabeça separada, E1);
- a linha do destino;
- leitura das mãos com pedido de nova foto;
- Saturno e Júpiter (capítulo 5): as perguntas propostas nunca seriam
  usadas nas fixtures e foram retiradas (5.3);
- casas, aspectos, cúspides e corpos lentos.

**Mínimo mantido: 2 temas distintos.** Abaixo disso, vale V1 ou V2. Cada
tema precisa de **pelo menos uma** interpretação apresentada do seu
assunto. A regra anterior de 2 referências por tema de um polo servia para
evitar temas montados com polos de signo espalhados entre assuntos. Com o
tema ancorado no assunto, ela deixa de ser necessária (seção 8, decisão 1).

**Prática opcional:** a do eixo do primeiro tema que tem eixo. Nenhuma
prática nova foi criada.

**Rastreabilidade:** cada tema guarda os `ref`, a tradição, o assunto, a
base e a chave da pergunta.

### 1.4 Formatos montados pelo sistema

Capítulo 8, por tema:

```
**{título do eixo}** · {selo}
Nas mãos: {referências agrupadas por capítulo}.
No céu: {referências}.
No céu, o outro lado: {referências}.        ← só com contraponto
{frase-ponte}
```

Depois dos temas vêm a síntese e os limites, nesta ordem:

1. R0;
2. R-parcial;
3. R-conf;
4. R-hora;
5. R-escopo;
6. R-simulada.

Capítulo 9, por tema:

```
{n}. **{título do eixo ou do assunto}** — a partir de: {interpretações, agrupadas por capítulo}.
   {pergunta}
```

Depois dos temas vêm "Prática opcional.", "Para fechar." e "Nota.".

Referências:

- **céu:** "{corpo} em {signo} (cap. N)";
- **mãos:** rótulo curto da tabela 2.2.

As referências do mesmo capítulo são agrupadas: "linha do coração longa;
linha do coração curvada para cima (cap. 7)".

---

## 2. Correspondências

### 2.1 Definição dos polos (critério editorial, não vai ao cliente)

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

Uma associação vale quando o **objeto** da leitura e a **direção**
coincidem com o critério.

### 2.2 Mãos — todas as características e valores

Fonte: `PALM_LIBRARY[...].symbolic` e `HAND_TYPES[...].symbolic`, biblioteca
`03f2.1`. As citações são literais, e a verificação conferiu as 24.

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

Rótulos curtos das referências (descritivos, sem interpretação):

| Valor | Polo | Rótulo |
| ----- | ---- | ------ |

| `heart.length:short` | `expressao:reservada` | linha do coração curta |
| `heart.length:long` | `expressao:expansiva` | linha do coração longa |
| `heart.shape:straight` | `expressao:reservada` | linha do coração de traçado reto |
| `heart.shape:curved` | `expressao:expansiva` | linha do coração curvada para cima |
| `head.start:joined_life` | `ritmo:cautela` | linha da cabeça começando unida à da vida |

**Resultado:** só 5 valores têm polo:

- **expressão:** os dois polos, pela linha do coração;
- **ritmo:** só `cautela`, pelo início da linha da cabeça unido à da vida.

Vínculo, foco e `ritmo:impulso` não têm nenhum traço das mãos.

### 2.3 Céu — polos por signo (biblioteca 02E, só reutilizada)

| Signo  | Polos                  | Signo       | Polos                         |
| ------ | ---------------------- | ----------- | ----------------------------- |
| Áries  | impulso, autonomia     | Libra       | proximidade                   |
| Touro  | cautela, estabilidade  | Escorpião   | reservada, estabilidade       |
| Gêmeos | mudança, expansiva     | Sagitário   | mudança, expansiva, autonomia |
| Câncer | proximidade, reservada | Capricórnio | cautela, reservada            |
| Leão   | expansiva              | Aquário     | autonomia, mudança            |
| Virgem | cautela                | Peixes      | proximidade                   |

### 2.4 Assuntos (F1, aprovada)

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

Assuntos dos traços das mãos, pelo texto aprovado:

- **linha do coração → afeto:** "afeto mais reservado", "afeto expansivo",
  "lidar com os afetos", "expressão afetiva";
- **início da linha da cabeça → agir:** "avaliar bem antes de se lançar".

### 2.5 Eixos que cada assunto trata

Usada **só no capítulo 9**, para escolher a pergunta de eixo de afeto e de
agir.

| Assunto | Eixos              | Fundamento (texto aprovado)                                                                                                       |
| ------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| afeto   | expressão, vínculo | Linha do coração → expressão (tabela 2.2); Vênus: "o afeto, o prazer e **a forma de se vincular**"; Lua: "**buscar acolhimento**" |
| agir    | ritmo              | Início da linha da cabeça → ritmo (tabela 2.2); Marte: "a iniciativa, o desejo e **a maneira de agir**"                           |
| demais  | —                  | As funções de Sol, Mercúrio, Júpiter, Saturno e Ascendente não tratam de nenhum eixo de forma direta                              |

O eixo **foco** não é tratado por nenhum assunto. Por isso, as perguntas de
foco ficam inativas (5.4).

### 2.6 Assuntos do capítulo 9 [NOVO, PARA APROVAÇÃO]

Cada assunto vem da função aprovada do corpo (`BODY_MEANINGS`, 02E) ou do
texto aprovado do traço (03C).

| Interpretação                                   | Assunto    | Fundamento                                                                                                                    |
| ----------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Sol, Ascendente (signo)                         | identidade | Sol: "o núcleo de identidade…"; o Ascendente acompanha o Sol no núcleo do capítulo 1 (`ChapterDef.core`)                      |
| Lua, Vênus (signo); linha do coração            | afeto      | Tabelas 2.2 e 2.4 (F1, aprovada)                                                                                              |
| Marte (signo); início da linha da cabeça        | agir       | Tabelas 2.2 e 2.4 (F1, aprovada)                                                                                              |
| Mercúrio (signo); inclinação da linha da cabeça | pensamento | Mercúrio: "o modo de pensar, aprender e se comunicar"; inclinação: "raciocínio prático e lógico" / "pensamento mais criativo" |

O mesmo assunto nos dois lados (por exemplo, pensamento) **não** forma tema
conjunto: só o capítulo 8 relaciona as tradições, e ele só cobre afeto e
agir. Rótulos novos das mãos para o capítulo 9, descritivos:

- "linha da cabeça de traçado mais reto";
- "linha da cabeça descendo em direção ao pulso".

---

## 3. Textos literais — capítulo 8

### 3.1 Interface

| Elemento | Texto |
| -------- | ----- |

| Título do eixo ritmo | Ritmo: impulso e cautela |
| Título do eixo expressão | Expressão: abertura e reserva |
| Título do eixo vínculo | Vínculo: autonomia e proximidade |
| Título do eixo foco | Foco: mudança e estabilidade |
| Selo aproximação | Aproximação |
| Selo aproximação com contraponto | Aproximação com contraponto |
| Selo diferença | Diferença |
| Selo duas imagens nas mãos | Duas imagens nas mãos |
| Linhas de referência | Nas mãos: … / No céu: … / No céu, o outro lado: … |
| Rótulos de fechamento | Síntese. / Limites. |

Os títulos de vínculo e foco só aparecem no capítulo 9.

### 3.2 Introdução

> Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, trata-se de uma semelhança de linguagem, não de uma constatação sobre você; quando apontam para lados diferentes, a diferença fica à vista.

### 3.3 Frases-ponte

Cada frase é usada **só** quando as fontes estruturadas exigidas existem.
As duas fontes são sempre citadas no bloco do tema.

| Chave | Fontes exigidas | Texto |
| ----- | --------------- | ----- |

| `ritmo:cautela:A` | mãos `ritmo:cautela` (cabeça unida); Marte com `cautela` | Aqui as duas leituras usam uma imagem parecida: um ritmo cuidadoso, de avaliar antes de seguir. |
| `ritmo:cautela:D` | mãos `ritmo:cautela`; Marte com `impulso` | Aqui as leituras apontam para lados diferentes: a quiromancia associa este traço à cautela, e as posições citadas do mapa são associadas a uma ação mais imediata. As duas descrições ficam registradas como estão, sem uma conciliação forçada. |
| `expressao:expansiva:A` | mãos `expansiva`; Lua e/ou Vênus com `expansiva` e nenhuma das duas com `reservada` | As duas leituras usam a imagem de uma expressão afetiva mais aberta. |
| `expressao:expansiva:AC` | mãos `expansiva`; uma de Lua/Vênus com `expansiva` **e** a outra com `reservada` | Nas duas tradições aparece a imagem de uma expressão afetiva mais aberta. No mapa, ela divide espaço com imagens de reserva: são facetas descritas lado a lado, não uma conta que precise fechar. |
| `expressao:expansiva:D` | mãos `expansiva`; Lua/Vênus só com `reservada` | Aqui as leituras seguem caminhos diferentes: a quiromancia associa estes traços a uma expressão mais aberta, e as posições citadas do mapa, a uma expressão mais reservada. A diferença fica à vista, sem conciliação. |
| `expressao:reservada:A` | mãos `reservada`; Lua e/ou Vênus com `reservada` e nenhuma com `expansiva` | As duas leituras usam a imagem de uma expressão afetiva mais reservada, que se revela aos poucos. |
| `expressao:reservada:AC` | mãos `reservada`; uma de Lua/Vênus com `reservada` **e** a outra com `expansiva` | Nas duas tradições aparece a imagem de uma expressão afetiva mais reservada. O mapa também traz imagens de abertura: as duas convivem na leitura, sem que uma corrija a outra. |
| `expressao:reservada:D` | mãos `reservada`; Lua/Vênus só com `expansiva` | Aqui as leituras apontam para lados diferentes: a quiromancia associa estes traços a uma expressão mais reservada, e as posições citadas do mapa, a uma expressão mais aberta. As duas descrições ficam como estão. |
| `expressao:F` | mãos com `expansiva` **e** `reservada` (dois traços do coração); Lua ou Vênus com algum polo de expressão | Nas mãos, a própria linha do coração traz duas imagens: uma de abertura e outra de reserva. Por isso, aqui não se aponta aproximação nem diferença; as imagens do mapa aparecem ao lado, só para comparação. |

### 3.4 Sínteses (uma por capítulo)

| Padrão de relações | Texto |
| ------------------ | ----- |

| Só aproximações (com ou sem contraponto) | As aproximações acima mostram onde as duas tradições usam palavras parecidas. Elas servem como ponto de partida para observar a sua experiência, não como conclusão. |
| Só diferenças | Nos temas comparados, as duas tradições apontam para lados diferentes. Isso não é um erro de nenhuma delas: são sistemas simbólicos distintos, e cada um pode ser confrontado com o que você vive. |
| Aproximações e diferenças | Há pontos em que as duas tradições usam imagens parecidas e pontos em que seguem caminhos diferentes. Os dois casos valem, no mesmo peso, como material de reflexão. |
| Há tema de duas imagens nas mãos | As imagens comparadas aqui convivem dentro de cada leitura e entre elas. Servem como material de reflexão, não como conclusão. |

### 3.5 Ressalvas (limites)

| Código | Quando | Texto |
| ------ | ------ | ----- |

| R0 | Sempre que há conteúdo | Semelhanças entre tradições simbólicas não comprovam traços de personalidade, e diferenças entre elas não indicam erro de nenhuma das leituras. |
| R-parcial (um traço) | Traço com polo ficou parcial | {Lista} ficou só parcialmente visível na foto e por isso não sustenta nenhuma comparação. |
| R-parcial (vários) | idem | {Lista} ficaram só parcialmente visíveis na foto e por isso não sustentam nenhuma comparação. |
| R-conf (um traço) | Traço observado excluído por D3/D4 | {Lista} não entra nestas comparações: é uma característica que ainda não pode ser classificada com segurança a partir de uma foto. |
| R-conf (vários) | idem | {Lista} não entram nestas comparações: são características que ainda não podem ser classificadas com segurança a partir de uma foto. |
| R-hora (uma posição) | Lua, Vênus ou Marte incertos pelo horário | {Lista} depende do horário de nascimento informado e não entra nestas comparações. |
| R-hora (várias) | idem | {Lista} dependem do horário de nascimento informado e não entram nestas comparações. |
| R-escopo | Sempre que há conteúdo | Os demais traços e posições tratam de outros temas e por isso não são comparados neste capítulo. |
| R-simulada | Leitura das mãos simulada (ambiente interno) | Esta comparação usa uma leitura das mãos simulada, do ambiente interno de testes. |

Não existe U4 só com "observado sem correspondência". O traçado da linha
do coração sempre tem polo quando é classificado com nitidez, então pelo
menos um traço comparável fica não classificado sempre que não há tema.

`{Lista}` é preenchida pelo sistema:

- **mãos:** `labelList` sobre os rótulos de `FEATURE_LABELS`, por exemplo
  "O formato da palma, o comprimento dos dedos, o comprimento da linha da
  cabeça e o arco da linha da vida";
- **céu:** "a posição da Lua", "a posição de Vênus", "a posição de Marte".

### 3.6 Indisponibilidade

| Código | Quando | Texto |
| ------ | ------ | ----- |

| U1 | Céu disponível, mãos ausentes | As conexões dependem das duas leituras, e a leitura das mãos não está nesta jornada. Nenhuma conexão foi criada só a partir do mapa. |
| U2 | Mãos disponíveis, céu ausente | As conexões dependem das duas leituras, e os capítulos do mapa natal não estão nesta jornada. Nenhuma conexão foi criada só a partir das mãos. |
| U3 | Nenhuma das duas | As conexões dependem das duas leituras, e nenhuma delas está disponível nesta jornada. |
| U4 | Nenhum dos três traços comparáveis pôde ser classificado (parcial, não visível, indeterminado ou não identificado), sem pedido de nova foto | Os traços das mãos que podem ser comparados — o comprimento e o traçado da linha do coração e o início da linha da cabeça — não puderam ser classificados com segurança nesta leitura. Por isso, nenhuma conexão foi criada. |
| U5 | Leitura das mãos com pedido de nova foto | A leitura das mãos pediu uma nova foto. Sem uma observação nítida, nenhuma conexão foi criada. |
| U6 | Traços elegíveis, mas nenhuma posição do mesmo assunto com polo no eixo | As posições do mapa ligadas aos mesmos temas dos traços nítidos das mãos — o afeto e o modo de agir — não apontam para nenhum dos lados desses traços. Por isso, não há o que comparar, e nenhuma conexão foi criada para preencher o capítulo. |
| U4-misto (um observado sem correspondência; vários não classificados) | Algum traço comparável foi observado com nitidez, mas numa categoria sem polo (ex.: coração médio, cabeça separada), e os demais não foram classificados | {Lista1} foi observado, mas sem uma categoria que corresponda aos temas comparados, e {lista2} não puderam ser classificados com segurança nesta leitura. Por isso, nenhuma conexão foi criada. |
| U4-misto (vários observados sem correspondência; um não classificado) | Algum traço comparável foi observado com nitidez, mas numa categoria sem polo (ex.: coração médio, cabeça separada), e os demais não foram classificados | {Lista1} foram observados, mas sem uma categoria que corresponda aos temas comparados, e {lista2} não pôde ser classificado com segurança nesta leitura. Por isso, nenhuma conexão foi criada. |

---

## 4. Textos literais — capítulo 9

### 4.1 Introdução

| Variante | Texto |
| -------- | ----- |

| Vários capítulos | Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos {lista}; as respostas, e a decisão sobre o que faz sentido para você, são suas. |
| Um capítulo | Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm do capítulo {lista}; as respostas, e a decisão sobre o que faz sentido para você, são suas. |

### 4.2 Perguntas (E4, aprovadas)

| Eixo | Variante | Pergunta |
| ---- | -------- | -------- |

| Ritmo | dois lados | Quando foi a última vez que esperar antes de decidir ajudou você — e quando agir logo teria sido melhor? |
| Ritmo | um polo: cautela | Que decisões você costuma tomar com calma, e quais gostaria de tomar com menos espera? |
| Ritmo | um polo: impulso | Que escolhas você costuma fazer de imediato? Alguma delas pediria um pouco mais de tempo? |
| Expressão | dois lados | Com quem você mostra com facilidade o que sente, e com quem prefere guardar mais para si? |
| Expressão | um polo: abertura | De que formas você costuma demonstrar afeto, e quais delas parecem mais naturais para você? |
| Expressão | um polo: reserva | O que precisa acontecer para você contar a alguém o que está sentindo? |
| Vínculo | dois lados | Em quais momentos da sua semana você procura companhia, e em quais prefere ficar por conta própria? |
| Vínculo | um polo: autonomia | Que espaços de independência são importantes para você hoje, e como você cuida deles? |
| Vínculo | um polo: proximidade | Com quem você gosta de dividir o dia a dia, e o que torna essa convivência boa? |
| Foco | dois lados | O que na sua vida você gostaria de manter como está, e o que gostaria de ver mudar? |
| Foco | um polo: mudança | Que novidade recente despertou o seu interesse, e o que ela trouxe de bom ou de difícil? |
| Foco | um polo: estabilidade | Que hábitos ou lugares trazem a você uma sensação de continuidade? |
| Identidade | pergunta do assunto **[NOVA, PARA APROVAÇÃO]** | Que atividade ou escolha do seu dia a dia parece mais com você, e por quê? |
| Pensamento | pergunta do assunto **[NOVA, PARA APROVAÇÃO]** | Como você costuma chegar a uma conclusão quando algo importante está em jogo? |

### 4.3 Práticas opcionais (uma por capítulo: a do eixo do primeiro tema)

| Eixo | Texto |
| ---- | ----- |

| Ritmo | Se quiser, observe durante alguns dias as pequenas decisões do cotidiano: quais você toma de imediato e quais deixa para depois. Não é preciso mudar nada, só notar. |
| Expressão | Se quiser, repare ao longo de uma semana em quando você fala do que sente e quando prefere guardar. Anotar uma ou duas situações já basta. |
| Vínculo | Se quiser, observe numa semana comum os momentos em que buscou companhia e os momentos em que preferiu ficar só, e como foi cada um. |
| Foco | Se quiser, faça uma lista curta do que você gostaria de manter e do que gostaria de experimentar. A lista pode mudar quando você quiser. |

### 4.4 Fechamento

| Elemento       | Texto                                                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pergunta final | Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?                                                      |
| Nota           | Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa. |
| Rótulos        | Prática opcional. / Para fechar. / Nota.                                                                                                                                            |

### 4.5 Indisponibilidade

| Código | Quando                 | Texto                                                                                                                                                                                  |
| ------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1     | Nenhum tema sustentado | Não há temas suficientes nesta jornada para montar um guia de reflexão sem inventar conteúdo. O guia precisa de pelo menos dois temas sustentados pelos capítulos anteriores.          |
| V2     | Só um tema sustentado  | Os capítulos disponíveis sustentam só um tema com segurança, e o guia precisa de pelo menos dois. Para não preencher o espaço com temas inventados, ele não foi montado nesta jornada. |

---

## 5. Alterações em relação aos textos registrados

### 5.0 Revisão definitiva do capítulo 9 (esta entrega)

| Mudança                              | Detalhe                                                                                                                                                                                |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Regra de seleção                     | Temas por **assunto da interpretação apresentada** (1.3 e 2.6), não por polo de signo em qualquer posição; sem juntar tradições fora do capítulo 8                                     |
| Perguntas novas **[PARA APROVAÇÃO]** | Identidade: "Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?" · Pensamento: "Como você costuma chegar a uma conclusão quando algo importante está em jogo?" |
| Perguntas propostas e retiradas      | Estrutura (Saturno) e expansão (Júpiter): nunca seriam usadas nas fixtures, porque as vagas são preenchidas antes (5.3)                                                                |
| Rótulos novos das mãos               | "linha da cabeça de traçado mais reto"; "linha da cabeça descendo em direção ao pulso" (inclinação da cabeça, só no capítulo 9)                                                        |
| Regra retirada                       | 2 referências por tema de um polo (seção 8, decisão 1)                                                                                                                                 |
| Sem mudança                          | Capítulo 8, correspondências, as 12 perguntas de eixo, as práticas, os mínimos (2 temas), R-conf, U4 e as ressalvas da revisão anterior                                                |

### 5.1 Correções desta revisão final

| Texto                                        | Antes (`1b4c7ea`)                                                                                                                                                                                           | Agora                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-conf (vários)                              | {Lista} não entram nestas comparações: são traços que variaram entre análises da mesma foto ou proporções estimadas a olho.                                                                                 | {Lista} não entram nestas comparações: são características que ainda não podem ser classificadas com segurança a partir de uma foto.                                                                                                                                                                                                                                                             |
| R-conf (um)                                  | {Lista} não entra nestas comparações: é um traço que variou entre análises da mesma foto ou uma proporção estimada a olho.                                                                                  | {Lista} não entra nestas comparações: é uma característica que ainda não pode ser classificada com segurança a partir de uma foto.                                                                                                                                                                                                                                                               |
| U4                                           | Os traços das mãos que podem ser comparados — o comprimento e o traçado da linha do coração e o início da linha da cabeça — não ficaram nítidos o suficiente na foto. Por isso, nenhuma conexão foi criada. | Os traços das mãos que podem ser comparados — o comprimento e o traçado da linha do coração e o início da linha da cabeça — não puderam ser classificados com segurança nesta leitura. Por isso, nenhuma conexão foi criada.                                                                                                                                                                     |
| U4-misto (novo)                              | —                                                                                                                                                                                                           | {Lista1} foi observado, mas sem uma categoria que corresponda aos temas comparados, e {lista2} não puderam ser classificados com segurança nesta leitura. Por isso, nenhuma conexão foi criada. / {Lista1} foram observados, mas sem uma categoria que corresponda aos temas comparados, e {lista2} não pôde ser classificado com segurança nesta leitura. Por isso, nenhuma conexão foi criada. |
| Frase-ponte ritmo, aproximação               | Aqui as duas leituras usam uma imagem parecida: um ritmo cuidadoso, de avaliar antes de seguir. É uma semelhança entre a linguagem da quiromancia e a da astrologia, não uma medida de como você age.       | Aqui as duas leituras usam uma imagem parecida: um ritmo cuidadoso, de avaliar antes de seguir.                                                                                                                                                                                                                                                                                                  |
| Frase-ponte expressão aberta, aproximação    | As duas leituras usam a imagem de uma expressão afetiva mais aberta. A semelhança está na linguagem das duas tradições; o que ela descreve na sua vida, só você pode avaliar.                               | As duas leituras usam a imagem de uma expressão afetiva mais aberta.                                                                                                                                                                                                                                                                                                                             |
| Frase-ponte expressão reservada, aproximação | As duas leituras usam a imagem de uma expressão afetiva mais reservada, que se revela aos poucos. É uma semelhança de linguagem entre duas tradições, não uma constatação sobre você.                       | As duas leituras usam a imagem de uma expressão afetiva mais reservada, que se revela aos poucos.                                                                                                                                                                                                                                                                                                |

Por que cada mudança:

- **R-conf.** A causa é uma limitação conhecida da classificação visual
  dessas características, não algo observado na foto da pessoa.
- **U4.** Separa duas causas:
  - nenhum traço comparável pôde ser classificado (U4);
  - algum traço foi observado com nitidez, mas numa categoria sem
    correspondência (U4-misto).

  "Não puderam ser classificados com segurança" cobre os traços parciais,
  não visíveis, indeterminados ou não identificados, sem atribuir a causa à
  captura quando ela não foi a causa.

- **Frases-ponte de aproximação.** A frase final de cada uma repetia a
  ressalva da introdução, a da síntese e R0. Num capítulo com dois temas,
  a mesma ideia chegava a aparecer cinco vezes. O caráter não científico
  continua explícito em **três** pontos de cada capítulo: a introdução, a
  síntese e R0.

**Mantidos sem mudança:**

- todas as perguntas e as práticas restantes;
- as correspondências do capítulo 8;
- o rótulo "Prática opcional.";
- R0, R-parcial, R-hora, R-escopo, U1–U3, U5, U6 e V1–V2.

R-parcial fala de visibilidade parcial **na foto**, que é a causa real desse
caso.

### 5.2 Alterações da F4 (aprovadas)

| Código   | Antes (`96353c1`)                                                                                                                                                        | Agora                                                                                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-escopo | Os demais traços e posições não usam os eixos comparados aqui e por isso não aparecem neste capítulo.                                                                    | Os demais traços e posições tratam de outros temas e por isso não são comparados neste capítulo.                                                                                                                                                |
| U6       | Os traços nítidos das mãos e as posições do mapa não usam nenhum eixo em comum. Por isso, não há o que comparar, e nenhuma conexão foi criada para preencher o capítulo. | As posições do mapa ligadas aos mesmos temas dos traços nítidos das mãos — o afeto e o modo de agir — não apontam para nenhum dos lados desses traços. Por isso, não há o que comparar, e nenhuma conexão foi criada para preencher o capítulo. |
| R-hora   | Condição: "posição elegível incerta por causa do horário (aproximado)"                                                                                                   | Condição: "Lua, Vênus ou Marte incertos por causa do horário"; texto igual, com forma singular e plural                                                                                                                                         |

### 5.3 Retirados

| Texto                                                                                                                                                                                                                                     | Motivo                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Prática genérica: "Se quiser, volte a um dos capítulos daqui a algumas semanas e veja se a leitura parece diferente. Mudar de opinião sobre ela também faz parte."                                                                        | Inalcançável: sempre há um primeiro tema (revisão final) |
| Pergunta de estrutura (proposta nesta revisão): "Que limite ou compromisso tem ajudado você a construir algo, e qual deles pesa mais do que deveria?"                                                                                     | Não seria usada nas fixtures (5.0)                       |
| Pergunta de expansão (proposta nesta revisão): "Onde você tem buscado crescer ou encontrar sentido ultimamente, e o que tem alimentado essa busca?"                                                                                       | Não seria usada nas fixtures (5.0)                       |
| Frase-ponte ritmo com contraponto: "As duas leituras usam a imagem de um ritmo cuidadoso, de avaliar antes de seguir. O mapa, porém, também traz uma imagem de ação mais imediata. As duas ficam lado a lado, sem que uma anule a outra." | Inalcançável: Marte é a única posição do assunto "agir"  |
| R-sem-hora                                                                                                                                                                                                                                | O Ascendente não entra nas comparações                   |
| Anexo A (vínculo)                                                                                                                                                                                                                         | E1 recusada                                              |

### 5.4 Textos preservados, mas inalcançáveis com as regras atuais

Pela instrução de preservar perguntas e práticas, os textos abaixo ficam na
biblioteca **inativos**. A verificação confere que nenhum deles é usado.

- **as três perguntas de foco e a prática de foco:** nenhum assunto trata o
  foco (2.5).

A pergunta de ritmo com impulso voltou a ser alcançável, com Marte em Áries
como tema de agir. Perguntas aprovadas e alcançáveis, mas que não
apareceram nas fixtures: vinculo:autonomia.

Ver a decisão 2 da seção 8.

### 5.5 Formas de concordância (sem conteúdo novo)

- R-parcial, R-conf e R-hora em singular e plural;
- U4-misto nas duas combinações possíveis;
- introdução do capítulo 9 com um capítulo.

A verificação confere que **só** os textos de 5.1 diferem do registro.

## 6. Exemplos completos

> **EXEMPLOS FICTÍCIOS — não são a leitura de ninguém.** Foram gerados com
> os motores reais, sem rede e sem IA, a partir de:
>
> - **fixtures do projeto:** `C-…` e `M-…`, as mesmas da matriz de 84;
> - **fixtures construídas para esta verificação** (marcadas com
>   **[construída]**), para as variantes que não apareceram nas 84
>   combinações.
>
> Os textos são exatamente os da biblioteca acima. Os identificadores
> `ref` mostram a rastreabilidade até os itens dos motores.

### 6.1 Capítulo 8 com aproximação

Céu: `C-val2`. Mãos: `M-clara`.

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

> Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, trata-se de uma semelhança de linguagem, não de uma constatação sobre você; quando apontam para lados diferentes, a diferença fica à vista.
>
> **Expressão: abertura e reserva** · Aproximação
> Nas mãos: linha do coração longa; linha do coração curvada para cima (cap. 7).
> No céu: Lua em Leão (cap. 2); Vênus em Gêmeos (cap. 4).
> As duas leituras usam a imagem de uma expressão afetiva mais aberta.
>
> _Síntese._ As aproximações acima mostram onde as duas tradições usam palavras parecidas. Elas servem como ponto de partida para observar a sua experiência, não como conclusão.
>
> _Limites._
>
> - Semelhanças entre tradições simbólicas não comprovam traços de personalidade, e diferenças entre elas não indicam erro de nenhuma das leituras.
> - O formato da palma, o comprimento dos dedos, o comprimento da linha da cabeça e o arco da linha da vida não entram nestas comparações: são características que ainda não podem ser classificadas com segurança a partir de uma foto.
> - Os demais traços e posições tratam de outros temas e por isso não são comparados neste capítulo.

**Capítulo 9 — Seu guia pessoal de reflexão**

> Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos 1, 2, 4 e 7; as respostas, e a decisão sobre o que faz sentido para você, são suas.
>
> 1. **Expressão: abertura e reserva** — a partir de: Lua em Leão (cap. 2); Vênus em Gêmeos (cap. 4); linha do coração longa; linha do coração curvada para cima (cap. 7).
>    De que formas você costuma demonstrar afeto, e quais delas parecem mais naturais para você?
> 2. **Ritmo: impulso e cautela** — a partir de: linha da cabeça começando unida à da vida (cap. 7).
>    Que decisões você costuma tomar com calma, e quais gostaria de tomar com menos espera?
> 3. **Identidade** — a partir de: Sol em Câncer (cap. 1).
>    Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?
>
> _Prática opcional._ Se quiser, repare ao longo de uma semana em quando você fala do que sente e quando prefere guardar. Anotar uma ou duas situações já basta.
>
> _Para fechar._ Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?
>
> _Nota._ Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.

<details><summary>Rastreabilidade</summary>

- Cap. 8 · Expressão · chave `expressao:expansiva:A`: `linhas:heart.length:long`, `linhas:heart.shape:curved`, `emocional:body-sign:moon`, `relacionamentos:body-sign:venus`
- Cap. 9 · Expressão: abertura e reserva · assunto `afeto` · base `c8` · tradição ambas · pergunta `expressao:expansiva`: `linhas:heart.length:long`, `linhas:heart.shape:curved`, `emocional:body-sign:moon`, `relacionamentos:body-sign:venus`
- Cap. 9 · Ritmo: impulso e cautela · assunto `agir` · base `um-polo` · tradição mãos · pergunta `ritmo:cautela`: `linhas:head.start:joined_life`
- Cap. 9 · Identidade · assunto `identidade` · base `assunto` · tradição céu · pergunta `identidade`: `identidade:body-sign:sun`

</details>

### 6.2 Capítulo 8 com aproximação com contraponto (Lua × Vênus)

Céu: `K-contraponto` **[construída]** (Lua em Leão, Vênus em Capricórnio, Marte em Touro). Mãos: `M-clara`.

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

> Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, trata-se de uma semelhança de linguagem, não de uma constatação sobre você; quando apontam para lados diferentes, a diferença fica à vista.
>
> **Ritmo: impulso e cautela** · Aproximação
> Nas mãos: linha da cabeça começando unida à da vida (cap. 7).
> No céu: Marte em Touro (cap. 4).
> Aqui as duas leituras usam uma imagem parecida: um ritmo cuidadoso, de avaliar antes de seguir.
>
> **Expressão: abertura e reserva** · Aproximação com contraponto
> Nas mãos: linha do coração longa; linha do coração curvada para cima (cap. 7).
> No céu: Lua em Leão (cap. 2).
> No céu, o outro lado: Vênus em Capricórnio (cap. 4).
> Nas duas tradições aparece a imagem de uma expressão afetiva mais aberta. No mapa, ela divide espaço com imagens de reserva: são facetas descritas lado a lado, não uma conta que precise fechar.
>
> _Síntese._ As aproximações acima mostram onde as duas tradições usam palavras parecidas. Elas servem como ponto de partida para observar a sua experiência, não como conclusão.
>
> _Limites._
>
> - Semelhanças entre tradições simbólicas não comprovam traços de personalidade, e diferenças entre elas não indicam erro de nenhuma das leituras.
> - O formato da palma, o comprimento dos dedos, o comprimento da linha da cabeça e o arco da linha da vida não entram nestas comparações: são características que ainda não podem ser classificadas com segurança a partir de uma foto.
> - Os demais traços e posições tratam de outros temas e por isso não são comparados neste capítulo.

**Capítulo 9 — Seu guia pessoal de reflexão**

> Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos 1, 2, 4 e 7; as respostas, e a decisão sobre o que faz sentido para você, são suas.
>
> 1. **Ritmo: impulso e cautela** — a partir de: Marte em Touro (cap. 4); linha da cabeça começando unida à da vida (cap. 7).
>    Que decisões você costuma tomar com calma, e quais gostaria de tomar com menos espera?
> 2. **Expressão: abertura e reserva** — a partir de: Lua em Leão (cap. 2); Vênus em Capricórnio (cap. 4); linha do coração longa; linha do coração curvada para cima (cap. 7).
>    Com quem você mostra com facilidade o que sente, e com quem prefere guardar mais para si?
> 3. **Identidade** — a partir de: Sol em Capricórnio; Ascendente em Peixes (cap. 1).
>    Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?
>
> _Prática opcional._ Se quiser, observe durante alguns dias as pequenas decisões do cotidiano: quais você toma de imediato e quais deixa para depois. Não é preciso mudar nada, só notar.
>
> _Para fechar._ Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?
>
> _Nota._ Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.

<details><summary>Rastreabilidade</summary>

- Cap. 8 · Ritmo · chave `ritmo:cautela:A`: `linhas:head.start:joined_life`, `relacionamentos:body-sign:mars`
- Cap. 8 · Expressão · chave `expressao:expansiva:AC`: `linhas:heart.length:long`, `linhas:heart.shape:curved`, `emocional:body-sign:moon`, `relacionamentos:body-sign:venus` (outro lado)
- Cap. 9 · Ritmo: impulso e cautela · assunto `agir` · base `c8` · tradição ambas · pergunta `ritmo:cautela`: `linhas:head.start:joined_life`, `relacionamentos:body-sign:mars`
- Cap. 9 · Expressão: abertura e reserva · assunto `afeto` · base `c8` · tradição ambas · pergunta `expressao:two`: `linhas:heart.length:long`, `linhas:heart.shape:curved`, `emocional:body-sign:moon`, `relacionamentos:body-sign:venus`
- Cap. 9 · Identidade · assunto `identidade` · base `assunto` · tradição céu · pergunta `identidade`: `identidade:body-sign:sun`, `identidade:angle-sign:asc`

</details>

### 6.3 Capítulo 8 com diferença

Céu: `C-demo2`. Mãos: `M-clara`.

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

> Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, trata-se de uma semelhança de linguagem, não de uma constatação sobre você; quando apontam para lados diferentes, a diferença fica à vista.
>
> **Expressão: abertura e reserva** · Diferença
> Nas mãos: linha do coração longa; linha do coração curvada para cima (cap. 7).
> No céu: Vênus em Câncer (cap. 4).
> Aqui as leituras seguem caminhos diferentes: a quiromancia associa estes traços a uma expressão mais aberta, e as posições citadas do mapa, a uma expressão mais reservada. A diferença fica à vista, sem conciliação.
>
> _Síntese._ Nos temas comparados, as duas tradições apontam para lados diferentes. Isso não é um erro de nenhuma delas: são sistemas simbólicos distintos, e cada um pode ser confrontado com o que você vive.
>
> _Limites._
>
> - Semelhanças entre tradições simbólicas não comprovam traços de personalidade, e diferenças entre elas não indicam erro de nenhuma das leituras.
> - O formato da palma, o comprimento dos dedos, o comprimento da linha da cabeça e o arco da linha da vida não entram nestas comparações: são características que ainda não podem ser classificadas com segurança a partir de uma foto.
> - Os demais traços e posições tratam de outros temas e por isso não são comparados neste capítulo.

**Capítulo 9 — Seu guia pessoal de reflexão**

> Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos 1, 4 e 7; as respostas, e a decisão sobre o que faz sentido para você, são suas.
>
> 1. **Expressão: abertura e reserva** — a partir de: Vênus em Câncer (cap. 4); linha do coração longa; linha do coração curvada para cima (cap. 7).
>    Com quem você mostra com facilidade o que sente, e com quem prefere guardar mais para si?
> 2. **Ritmo: impulso e cautela** — a partir de: linha da cabeça começando unida à da vida (cap. 7).
>    Que decisões você costuma tomar com calma, e quais gostaria de tomar com menos espera?
> 3. **Identidade** — a partir de: Sol em Câncer; Ascendente em Virgem (cap. 1).
>    Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?
>
> _Prática opcional._ Se quiser, repare ao longo de uma semana em quando você fala do que sente e quando prefere guardar. Anotar uma ou duas situações já basta.
>
> _Para fechar._ Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?
>
> _Nota._ Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.

<details><summary>Rastreabilidade</summary>

- Cap. 8 · Expressão · chave `expressao:expansiva:D`: `linhas:heart.length:long`, `linhas:heart.shape:curved`, `relacionamentos:body-sign:venus`
- Cap. 9 · Expressão: abertura e reserva · assunto `afeto` · base `c8` · tradição ambas · pergunta `expressao:two`: `linhas:heart.length:long`, `linhas:heart.shape:curved`, `relacionamentos:body-sign:venus`
- Cap. 9 · Ritmo: impulso e cautela · assunto `agir` · base `um-polo` · tradição mãos · pergunta `ritmo:cautela`: `linhas:head.start:joined_life`
- Cap. 9 · Identidade · assunto `identidade` · base `assunto` · tradição céu · pergunta `identidade`: `identidade:body-sign:sun`, `identidade:angle-sign:asc`

</details>

### 6.4 Capítulo 8 com diferença no ritmo e na expressão (só diferenças)

Céu: `K-ritmo-diferença` **[construída]** (Lua em Câncer, Vênus em Touro, Marte em Áries). Mãos: `M-clara`.

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

> Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, trata-se de uma semelhança de linguagem, não de uma constatação sobre você; quando apontam para lados diferentes, a diferença fica à vista.
>
> **Ritmo: impulso e cautela** · Diferença
> Nas mãos: linha da cabeça começando unida à da vida (cap. 7).
> No céu: Marte em Áries (cap. 4).
> Aqui as leituras apontam para lados diferentes: a quiromancia associa este traço à cautela, e as posições citadas do mapa são associadas a uma ação mais imediata. As duas descrições ficam registradas como estão, sem uma conciliação forçada.
>
> **Expressão: abertura e reserva** · Diferença
> Nas mãos: linha do coração longa; linha do coração curvada para cima (cap. 7).
> No céu: Lua em Câncer (cap. 2).
> Aqui as leituras seguem caminhos diferentes: a quiromancia associa estes traços a uma expressão mais aberta, e as posições citadas do mapa, a uma expressão mais reservada. A diferença fica à vista, sem conciliação.
>
> _Síntese._ Nos temas comparados, as duas tradições apontam para lados diferentes. Isso não é um erro de nenhuma delas: são sistemas simbólicos distintos, e cada um pode ser confrontado com o que você vive.
>
> _Limites._
>
> - Semelhanças entre tradições simbólicas não comprovam traços de personalidade, e diferenças entre elas não indicam erro de nenhuma das leituras.
> - O formato da palma, o comprimento dos dedos, o comprimento da linha da cabeça e o arco da linha da vida não entram nestas comparações: são características que ainda não podem ser classificadas com segurança a partir de uma foto.
> - Os demais traços e posições tratam de outros temas e por isso não são comparados neste capítulo.

**Capítulo 9 — Seu guia pessoal de reflexão**

> Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos 1, 2, 4 e 7; as respostas, e a decisão sobre o que faz sentido para você, são suas.
>
> 1. **Ritmo: impulso e cautela** — a partir de: Marte em Áries (cap. 4); linha da cabeça começando unida à da vida (cap. 7).
>    Quando foi a última vez que esperar antes de decidir ajudou você — e quando agir logo teria sido melhor?
> 2. **Expressão: abertura e reserva** — a partir de: Lua em Câncer (cap. 2); linha do coração longa; linha do coração curvada para cima (cap. 7).
>    Com quem você mostra com facilidade o que sente, e com quem prefere guardar mais para si?
> 3. **Identidade** — a partir de: Sol em Touro; Ascendente em Leão (cap. 1).
>    Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?
>
> _Prática opcional._ Se quiser, observe durante alguns dias as pequenas decisões do cotidiano: quais você toma de imediato e quais deixa para depois. Não é preciso mudar nada, só notar.
>
> _Para fechar._ Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?
>
> _Nota._ Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.

<details><summary>Rastreabilidade</summary>

- Cap. 8 · Ritmo · chave `ritmo:cautela:D`: `linhas:head.start:joined_life`, `relacionamentos:body-sign:mars`
- Cap. 8 · Expressão · chave `expressao:expansiva:D`: `linhas:heart.length:long`, `linhas:heart.shape:curved`, `emocional:body-sign:moon`
- Cap. 9 · Ritmo: impulso e cautela · assunto `agir` · base `c8` · tradição ambas · pergunta `ritmo:two`: `linhas:head.start:joined_life`, `relacionamentos:body-sign:mars`
- Cap. 9 · Expressão: abertura e reserva · assunto `afeto` · base `c8` · tradição ambas · pergunta `expressao:two`: `linhas:heart.length:long`, `linhas:heart.shape:curved`, `emocional:body-sign:moon`
- Cap. 9 · Identidade · assunto `identidade` · base `assunto` · tradição céu · pergunta `identidade`: `identidade:body-sign:sun`, `identidade:angle-sign:asc`

</details>

### 6.5 Capítulo 8 com duas imagens nas mãos

Céu: `C-ref exato`. Mãos: `M-duas-imagens` **[construída]** (coração curto (reserva) e curvado (abertura)).

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

> Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, trata-se de uma semelhança de linguagem, não de uma constatação sobre você; quando apontam para lados diferentes, a diferença fica à vista.
>
> **Expressão: abertura e reserva** · Duas imagens nas mãos
> Nas mãos: linha do coração curta; linha do coração curvada para cima (cap. 7).
> No céu: Lua em Sagitário (cap. 2).
> Nas mãos, a própria linha do coração traz duas imagens: uma de abertura e outra de reserva. Por isso, aqui não se aponta aproximação nem diferença; as imagens do mapa aparecem ao lado, só para comparação.
>
> _Síntese._ As imagens comparadas aqui convivem dentro de cada leitura e entre elas. Servem como material de reflexão, não como conclusão.
>
> _Limites._
>
> - Semelhanças entre tradições simbólicas não comprovam traços de personalidade, e diferenças entre elas não indicam erro de nenhuma das leituras.
> - O formato da palma, o comprimento dos dedos, o comprimento da linha da cabeça e o arco da linha da vida não entram nestas comparações: são características que ainda não podem ser classificadas com segurança a partir de uma foto.
> - Os demais traços e posições tratam de outros temas e por isso não são comparados neste capítulo.

**Capítulo 9 — Seu guia pessoal de reflexão**

> Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos 1, 2 e 7; as respostas, e a decisão sobre o que faz sentido para você, são suas.
>
> 1. **Expressão: abertura e reserva** — a partir de: Lua em Sagitário (cap. 2); linha do coração curta; linha do coração curvada para cima (cap. 7).
>    Com quem você mostra com facilidade o que sente, e com quem prefere guardar mais para si?
> 2. **Ritmo: impulso e cautela** — a partir de: linha da cabeça começando unida à da vida (cap. 7).
>    Que decisões você costuma tomar com calma, e quais gostaria de tomar com menos espera?
> 3. **Identidade** — a partir de: Sol em Touro; Ascendente em Virgem (cap. 1).
>    Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?
>
> _Prática opcional._ Se quiser, repare ao longo de uma semana em quando você fala do que sente e quando prefere guardar. Anotar uma ou duas situações já basta.
>
> _Para fechar._ Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?
>
> _Nota._ Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.

<details><summary>Rastreabilidade</summary>

- Cap. 8 · Expressão · chave `expressao:F`: `linhas:heart.length:short`, `linhas:heart.shape:curved`, `emocional:body-sign:moon`
- Cap. 9 · Expressão: abertura e reserva · assunto `afeto` · base `c8` · tradição ambas · pergunta `expressao:two`: `linhas:heart.length:short`, `linhas:heart.shape:curved`, `emocional:body-sign:moon`
- Cap. 9 · Ritmo: impulso e cautela · assunto `agir` · base `um-polo` · tradição mãos · pergunta `ritmo:cautela`: `linhas:head.start:joined_life`
- Cap. 9 · Identidade · assunto `identidade` · base `assunto` · tradição céu · pergunta `identidade`: `identidade:body-sign:sun`, `identidade:angle-sign:asc`

</details>

### 6.6 Leitura parcial e posição incerta pelo horário

Céu: `K-lua-incerta` **[construída]** (horário desconhecido: Lua incerta, Vênus em Capricórnio). Mãos: `M-parcial`.

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

> Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, trata-se de uma semelhança de linguagem, não de uma constatação sobre você; quando apontam para lados diferentes, a diferença fica à vista.
>
> **Ritmo: impulso e cautela** · Aproximação
> Nas mãos: linha da cabeça começando unida à da vida (cap. 7).
> No céu: Marte em Touro (cap. 4).
> Aqui as duas leituras usam uma imagem parecida: um ritmo cuidadoso, de avaliar antes de seguir.
>
> **Expressão: abertura e reserva** · Diferença
> Nas mãos: linha do coração longa (cap. 7).
> No céu: Vênus em Capricórnio (cap. 4).
> Aqui as leituras seguem caminhos diferentes: a quiromancia associa estes traços a uma expressão mais aberta, e as posições citadas do mapa, a uma expressão mais reservada. A diferença fica à vista, sem conciliação.
>
> _Síntese._ Há pontos em que as duas tradições usam imagens parecidas e pontos em que seguem caminhos diferentes. Os dois casos valem, no mesmo peso, como material de reflexão.
>
> _Limites._
>
> - Semelhanças entre tradições simbólicas não comprovam traços de personalidade, e diferenças entre elas não indicam erro de nenhuma das leituras.
> - O traçado da linha do coração ficou só parcialmente visível na foto e por isso não sustenta nenhuma comparação.
> - O formato da palma, o comprimento da linha da cabeça e o arco da linha da vida não entram nestas comparações: são características que ainda não podem ser classificadas com segurança a partir de uma foto.
> - A posição da Lua depende do horário de nascimento informado e não entra nestas comparações.
> - Os demais traços e posições tratam de outros temas e por isso não são comparados neste capítulo.

**Capítulo 9 — Seu guia pessoal de reflexão**

> Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos 1, 4 e 7; as respostas, e a decisão sobre o que faz sentido para você, são suas.
>
> 1. **Ritmo: impulso e cautela** — a partir de: Marte em Touro (cap. 4); linha da cabeça começando unida à da vida (cap. 7).
>    Que decisões você costuma tomar com calma, e quais gostaria de tomar com menos espera?
> 2. **Expressão: abertura e reserva** — a partir de: Vênus em Capricórnio (cap. 4); linha do coração longa (cap. 7).
>    Com quem você mostra com facilidade o que sente, e com quem prefere guardar mais para si?
> 3. **Identidade** — a partir de: Sol em Capricórnio (cap. 1).
>    Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?
>
> _Prática opcional._ Se quiser, observe durante alguns dias as pequenas decisões do cotidiano: quais você toma de imediato e quais deixa para depois. Não é preciso mudar nada, só notar.
>
> _Para fechar._ Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?
>
> _Nota._ Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.

<details><summary>Rastreabilidade</summary>

- Cap. 8 · Ritmo · chave `ritmo:cautela:A`: `linhas:head.start:joined_life`, `relacionamentos:body-sign:mars`
- Cap. 8 · Expressão · chave `expressao:expansiva:D`: `linhas:heart.length:long`, `relacionamentos:body-sign:venus`
- Cap. 9 · Ritmo: impulso e cautela · assunto `agir` · base `c8` · tradição ambas · pergunta `ritmo:cautela`: `linhas:head.start:joined_life`, `relacionamentos:body-sign:mars`
- Cap. 9 · Expressão: abertura e reserva · assunto `afeto` · base `c8` · tradição ambas · pergunta `expressao:two`: `linhas:heart.length:long`, `relacionamentos:body-sign:venus`
- Cap. 9 · Identidade · assunto `identidade` · base `assunto` · tradição céu · pergunta `identidade`: `identidade:body-sign:sun`

</details>

### 6.7 Duas fontes: um tema do capítulo 8, um só das mãos e um só do céu

Céu: `C-ref exato`. Mãos: `M-clara`.

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

> Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, trata-se de uma semelhança de linguagem, não de uma constatação sobre você; quando apontam para lados diferentes, a diferença fica à vista.
>
> **Expressão: abertura e reserva** · Aproximação
> Nas mãos: linha do coração longa; linha do coração curvada para cima (cap. 7).
> No céu: Lua em Sagitário (cap. 2).
> As duas leituras usam a imagem de uma expressão afetiva mais aberta.
>
> _Síntese._ As aproximações acima mostram onde as duas tradições usam palavras parecidas. Elas servem como ponto de partida para observar a sua experiência, não como conclusão.
>
> _Limites._
>
> - Semelhanças entre tradições simbólicas não comprovam traços de personalidade, e diferenças entre elas não indicam erro de nenhuma das leituras.
> - O formato da palma, o comprimento dos dedos, o comprimento da linha da cabeça e o arco da linha da vida não entram nestas comparações: são características que ainda não podem ser classificadas com segurança a partir de uma foto.
> - Os demais traços e posições tratam de outros temas e por isso não são comparados neste capítulo.

**Capítulo 9 — Seu guia pessoal de reflexão**

> Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos 1, 2 e 7; as respostas, e a decisão sobre o que faz sentido para você, são suas.
>
> 1. **Expressão: abertura e reserva** — a partir de: Lua em Sagitário (cap. 2); linha do coração longa; linha do coração curvada para cima (cap. 7).
>    De que formas você costuma demonstrar afeto, e quais delas parecem mais naturais para você?
> 2. **Ritmo: impulso e cautela** — a partir de: linha da cabeça começando unida à da vida (cap. 7).
>    Que decisões você costuma tomar com calma, e quais gostaria de tomar com menos espera?
> 3. **Identidade** — a partir de: Sol em Touro; Ascendente em Virgem (cap. 1).
>    Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?
>
> _Prática opcional._ Se quiser, repare ao longo de uma semana em quando você fala do que sente e quando prefere guardar. Anotar uma ou duas situações já basta.
>
> _Para fechar._ Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?
>
> _Nota._ Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.

<details><summary>Rastreabilidade</summary>

- Cap. 8 · Expressão · chave `expressao:expansiva:A`: `linhas:heart.length:long`, `linhas:heart.shape:curved`, `emocional:body-sign:moon`
- Cap. 9 · Expressão: abertura e reserva · assunto `afeto` · base `c8` · tradição ambas · pergunta `expressao:expansiva`: `linhas:heart.length:long`, `linhas:heart.shape:curved`, `emocional:body-sign:moon`
- Cap. 9 · Ritmo: impulso e cautela · assunto `agir` · base `um-polo` · tradição mãos · pergunta `ritmo:cautela`: `linhas:head.start:joined_life`
- Cap. 9 · Identidade · assunto `identidade` · base `assunto` · tradição céu · pergunta `identidade`: `identidade:body-sign:sun`, `identidade:angle-sign:asc`

</details>

### 6.8 Duas fontes sem capítulo 8 (nova foto): capítulo 9 só com o céu

Céu: `C-val1`. Mãos: `M-insuf.`.

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

> [indisponível — U5] A leitura das mãos pediu uma nova foto. Sem uma observação nítida, nenhuma conexão foi criada.

**Capítulo 9 — Seu guia pessoal de reflexão**

> Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos 1, 2 e 4; as respostas, e a decisão sobre o que faz sentido para você, são suas.
>
> 1. **Vínculo: autonomia e proximidade** — a partir de: Lua em Peixes (cap. 2); Vênus em Sagitário (cap. 4).
>    Em quais momentos da sua semana você procura companhia, e em quais prefere ficar por conta própria?
> 2. **Ritmo: impulso e cautela** — a partir de: Marte em Capricórnio (cap. 4).
>    Que decisões você costuma tomar com calma, e quais gostaria de tomar com menos espera?
> 3. **Identidade** — a partir de: Sol em Escorpião; Ascendente em Sagitário (cap. 1).
>    Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?
>
> _Prática opcional._ Se quiser, observe numa semana comum os momentos em que buscou companhia e os momentos em que preferiu ficar só, e como foi cada um.
>
> _Para fechar._ Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?
>
> _Nota._ Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.

<details><summary>Rastreabilidade</summary>

- Cap. 9 · Vínculo: autonomia e proximidade · assunto `afeto` · base `tensao` · tradição céu · pergunta `vinculo:two`: `emocional:body-sign:moon`, `relacionamentos:body-sign:venus`
- Cap. 9 · Ritmo: impulso e cautela · assunto `agir` · base `um-polo` · tradição céu · pergunta `ritmo:cautela`: `relacionamentos:body-sign:mars`
- Cap. 9 · Identidade · assunto `identidade` · base `assunto` · tradição céu · pergunta `identidade`: `identidade:body-sign:sun`, `identidade:angle-sign:asc`

</details>

### 6.9 Só astrologia: tensão Lua × Vênus no vínculo

Céu: `C-val1`. Mãos: sem mãos.

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

> [indisponível — U1] As conexões dependem das duas leituras, e a leitura das mãos não está nesta jornada. Nenhuma conexão foi criada só a partir do mapa.

**Capítulo 9 — Seu guia pessoal de reflexão**

> Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos 1, 2 e 4; as respostas, e a decisão sobre o que faz sentido para você, são suas.
>
> 1. **Vínculo: autonomia e proximidade** — a partir de: Lua em Peixes (cap. 2); Vênus em Sagitário (cap. 4).
>    Em quais momentos da sua semana você procura companhia, e em quais prefere ficar por conta própria?
> 2. **Ritmo: impulso e cautela** — a partir de: Marte em Capricórnio (cap. 4).
>    Que decisões você costuma tomar com calma, e quais gostaria de tomar com menos espera?
> 3. **Identidade** — a partir de: Sol em Escorpião; Ascendente em Sagitário (cap. 1).
>    Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?
>
> _Prática opcional._ Se quiser, observe numa semana comum os momentos em que buscou companhia e os momentos em que preferiu ficar só, e como foi cada um.
>
> _Para fechar._ Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?
>
> _Nota._ Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.

<details><summary>Rastreabilidade</summary>

- Cap. 9 · Vínculo: autonomia e proximidade · assunto `afeto` · base `tensao` · tradição céu · pergunta `vinculo:two`: `emocional:body-sign:moon`, `relacionamentos:body-sign:venus`
- Cap. 9 · Ritmo: impulso e cautela · assunto `agir` · base `um-polo` · tradição céu · pergunta `ritmo:cautela`: `relacionamentos:body-sign:mars`
- Cap. 9 · Identidade · assunto `identidade` · base `assunto` · tradição céu · pergunta `identidade`: `identidade:body-sign:sun`, `identidade:angle-sign:asc`

</details>

### 6.9b Só astrologia: temas de um polo e de assunto

Céu: `C-demo2`. Mãos: sem mãos.

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

> [indisponível — U1] As conexões dependem das duas leituras, e a leitura das mãos não está nesta jornada. Nenhuma conexão foi criada só a partir do mapa.

**Capítulo 9 — Seu guia pessoal de reflexão**

> Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos 1, 3 e 4; as respostas, e a decisão sobre o que faz sentido para você, são suas.
>
> 1. **Expressão: abertura e reserva** — a partir de: Vênus em Câncer (cap. 4).
>    O que precisa acontecer para você contar a alguém o que está sentindo?
> 2. **Identidade** — a partir de: Sol em Câncer; Ascendente em Virgem (cap. 1).
>    Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?
> 3. **Pensamento** — a partir de: Mercúrio em Gêmeos (cap. 3).
>    Como você costuma chegar a uma conclusão quando algo importante está em jogo?
>
> _Prática opcional._ Se quiser, repare ao longo de uma semana em quando você fala do que sente e quando prefere guardar. Anotar uma ou duas situações já basta.
>
> _Para fechar._ Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?
>
> _Nota._ Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.

<details><summary>Rastreabilidade</summary>

- Cap. 9 · Expressão: abertura e reserva · assunto `afeto` · base `um-polo` · tradição céu · pergunta `expressao:reservada`: `relacionamentos:body-sign:venus`
- Cap. 9 · Identidade · assunto `identidade` · base `assunto` · tradição céu · pergunta `identidade`: `identidade:body-sign:sun`, `identidade:angle-sign:asc`
- Cap. 9 · Pensamento · assunto `pensamento` · base `assunto` · tradição céu · pergunta `pensamento`: `mente:body-sign:mercury`

</details>

### 6.10 Nenhum traço comparável classificado (U4)

Céu: `C-ref exato`. Mãos: `M-sem-classificação` **[construída]** (coração e início da cabeça não classificados; demais traços observados).

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

> [indisponível — U4] Os traços das mãos que podem ser comparados — o comprimento e o traçado da linha do coração e o início da linha da cabeça — não puderam ser classificados com segurança nesta leitura. Por isso, nenhuma conexão foi criada.

**Capítulo 9 — Seu guia pessoal de reflexão**

> Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos 1, 2 e 3; as respostas, e a decisão sobre o que faz sentido para você, são suas.
>
> 1. **Expressão: abertura e reserva** — a partir de: Lua em Sagitário (cap. 2).
>    De que formas você costuma demonstrar afeto, e quais delas parecem mais naturais para você?
> 2. **Identidade** — a partir de: Sol em Touro; Ascendente em Virgem (cap. 1).
>    Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?
> 3. **Pensamento** — a partir de: Mercúrio em Touro (cap. 3).
>    Como você costuma chegar a uma conclusão quando algo importante está em jogo?
>
> _Prática opcional._ Se quiser, repare ao longo de uma semana em quando você fala do que sente e quando prefere guardar. Anotar uma ou duas situações já basta.
>
> _Para fechar._ Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?
>
> _Nota._ Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.

<details><summary>Rastreabilidade</summary>

- Cap. 9 · Expressão: abertura e reserva · assunto `afeto` · base `um-polo` · tradição céu · pergunta `expressao:expansiva`: `emocional:body-sign:moon`
- Cap. 9 · Identidade · assunto `identidade` · base `assunto` · tradição céu · pergunta `identidade`: `identidade:body-sign:sun`, `identidade:angle-sign:asc`
- Cap. 9 · Pensamento · assunto `pensamento` · base `assunto` · tradição céu · pergunta `pensamento`: `mente:body-sign:mercury`

</details>

### 6.11 Traços observados sem correspondência e um não classificado (U4-misto)

Céu: `C-ref exato`. Mãos: `M-sem-elegível` **[construída]** (coração médio, traçado indeterminado, cabeça separada).

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

> [indisponível — U4misto] O comprimento da linha do coração e o início da linha da cabeça foram observados, mas sem uma categoria que corresponda aos temas comparados, e o traçado da linha do coração não pôde ser classificado com segurança nesta leitura. Por isso, nenhuma conexão foi criada.

**Capítulo 9 — Seu guia pessoal de reflexão**

> Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos 1, 2 e 3; as respostas, e a decisão sobre o que faz sentido para você, são suas.
>
> 1. **Expressão: abertura e reserva** — a partir de: Lua em Sagitário (cap. 2).
>    De que formas você costuma demonstrar afeto, e quais delas parecem mais naturais para você?
> 2. **Identidade** — a partir de: Sol em Touro; Ascendente em Virgem (cap. 1).
>    Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?
> 3. **Pensamento** — a partir de: Mercúrio em Touro (cap. 3).
>    Como você costuma chegar a uma conclusão quando algo importante está em jogo?
>
> _Prática opcional._ Se quiser, repare ao longo de uma semana em quando você fala do que sente e quando prefere guardar. Anotar uma ou duas situações já basta.
>
> _Para fechar._ Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?
>
> _Nota._ Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.

<details><summary>Rastreabilidade</summary>

- Cap. 9 · Expressão: abertura e reserva · assunto `afeto` · base `um-polo` · tradição céu · pergunta `expressao:expansiva`: `emocional:body-sign:moon`
- Cap. 9 · Identidade · assunto `identidade` · base `assunto` · tradição céu · pergunta `identidade`: `identidade:body-sign:sun`, `identidade:angle-sign:asc`
- Cap. 9 · Pensamento · assunto `pensamento` · base `assunto` · tradição céu · pergunta `pensamento`: `mente:body-sign:mercury`

</details>

### 6.12 Só mãos, com conteúdo suficiente

Céu: sem céu. Mãos: `M-clara`.

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

> [indisponível — U2] As conexões dependem das duas leituras, e os capítulos do mapa natal não estão nesta jornada. Nenhuma conexão foi criada só a partir das mãos.

**Capítulo 9 — Seu guia pessoal de reflexão**

> Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm do capítulo 7; as respostas, e a decisão sobre o que faz sentido para você, são suas.
>
> 1. **Expressão: abertura e reserva** — a partir de: linha do coração longa; linha do coração curvada para cima (cap. 7).
>    De que formas você costuma demonstrar afeto, e quais delas parecem mais naturais para você?
> 2. **Ritmo: impulso e cautela** — a partir de: linha da cabeça começando unida à da vida (cap. 7).
>    Que decisões você costuma tomar com calma, e quais gostaria de tomar com menos espera?
> 3. **Pensamento** — a partir de: linha da cabeça descendo em direção ao pulso (cap. 7).
>    Como você costuma chegar a uma conclusão quando algo importante está em jogo?
>
> _Prática opcional._ Se quiser, repare ao longo de uma semana em quando você fala do que sente e quando prefere guardar. Anotar uma ou duas situações já basta.
>
> _Para fechar._ Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?
>
> _Nota._ Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.

<details><summary>Rastreabilidade</summary>

- Cap. 9 · Expressão: abertura e reserva · assunto `afeto` · base `um-polo` · tradição mãos · pergunta `expressao:expansiva`: `linhas:heart.length:long`, `linhas:heart.shape:curved`
- Cap. 9 · Ritmo: impulso e cautela · assunto `agir` · base `um-polo` · tradição mãos · pergunta `ritmo:cautela`: `linhas:head.start:joined_life`
- Cap. 9 · Pensamento · assunto `pensamento` · base `assunto` · tradição mãos · pergunta `pensamento`: `linhas:head.slope:sloping`

</details>

### 6.13 Só mãos com leitura parcial

Céu: sem céu. Mãos: `M-parcial`.

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

> [indisponível — U2] As conexões dependem das duas leituras, e os capítulos do mapa natal não estão nesta jornada. Nenhuma conexão foi criada só a partir das mãos.

**Capítulo 9 — Seu guia pessoal de reflexão**

> Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm do capítulo 7; as respostas, e a decisão sobre o que faz sentido para você, são suas.
>
> 1. **Expressão: abertura e reserva** — a partir de: linha do coração longa (cap. 7).
>    De que formas você costuma demonstrar afeto, e quais delas parecem mais naturais para você?
> 2. **Ritmo: impulso e cautela** — a partir de: linha da cabeça começando unida à da vida (cap. 7).
>    Que decisões você costuma tomar com calma, e quais gostaria de tomar com menos espera?
>
> _Prática opcional._ Se quiser, repare ao longo de uma semana em quando você fala do que sente e quando prefere guardar. Anotar uma ou duas situações já basta.
>
> _Para fechar._ Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?
>
> _Nota._ Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.

<details><summary>Rastreabilidade</summary>

- Cap. 9 · Expressão: abertura e reserva · assunto `afeto` · base `um-polo` · tradição mãos · pergunta `expressao:expansiva`: `linhas:heart.length:long`
- Cap. 9 · Ritmo: impulso e cautela · assunto `agir` · base `um-polo` · tradição mãos · pergunta `ritmo:cautela`: `linhas:head.start:joined_life`

</details>

### 6.14 Só mãos com um tema só (V2)

Céu: sem céu. Mãos: `M-sem-elegível` **[construída]** (coração médio, traçado indeterminado, cabeça separada).

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

> [indisponível — U2] As conexões dependem das duas leituras, e os capítulos do mapa natal não estão nesta jornada. Nenhuma conexão foi criada só a partir das mãos.

**Capítulo 9 — Seu guia pessoal de reflexão**

> [indisponível — V2] Os capítulos disponíveis sustentam só um tema com segurança, e o guia precisa de pelo menos dois. Para não preencher o espaço com temas inventados, ele não foi montado nesta jornada.

<details><summary>Rastreabilidade</summary>

</details>

### 6.15 Sem conteúdo suficiente (V1)

Céu: sem céu. Mãos: `M-insuf.`.

**Capítulo 8 — Conexões simbólicas entre céu e mãos**

> [indisponível — U2] As conexões dependem das duas leituras, e os capítulos do mapa natal não estão nesta jornada. Nenhuma conexão foi criada só a partir das mãos.

**Capítulo 9 — Seu guia pessoal de reflexão**

> [indisponível — V1] Não há temas suficientes nesta jornada para montar um guia de reflexão sem inventar conteúdo. O guia precisa de pelo menos dois temas sustentados pelos capítulos anteriores.

<details><summary>Rastreabilidade</summary>

</details>

---

## 7. Verificação final (gratuita, sem rede, sem IA)

### 7.1 Método

Script descartável, **fora do repositório**, executado no Vitest do projeto
com os motores reais. Os arquivos estão em
`/tmp/claude-0/-home-user-astrologia-app/3fe5797d-c926-5a7d-8184-2d2b94c85308/scratchpad/v04d/`:

- `lib04d.ts`: a biblioteca;
- `rules04d.ts`: as regras e a montagem;
- `verify.test.ts`: as verificações.

Foram rodadas **{len(rows)} combinações**, com {len(V['skies'])} situações do céu e {len(V['palms'])} das mãos:

- as **84 do conjunto anterior**: 12 céus × 7 mãos, incluindo "sem céu" e
  "sem mãos";
- **{len(cons)} com fixtures construídas para esta verificação**;
- e **6 casos adversariais** (7.3), montados direto na ponte de dados, que
  tentam usar referências de assuntos incompatíveis.

Fixtures construídas:

| Fixture | Como foi obtida | Para qual variante |
| ------- | --------------- | ------------------ |

| `K-contraponto` | Mapa calculado pelo motor para uma data fictícia (02/01/1991, 12:00, local de teste): Lua em Leão, Vênus em Capricórnio, Marte em Touro | contraponto no mesmo assunto; tensão Lua × Vênus no cap. 9 |
| `K-ritmo-diferença` | Data fictícia (06/05/1992, 12:00): Lua em Câncer, Vênus em Touro, Marte em Áries | diferença no ritmo; capítulo só com diferenças |
| `K-lua-incerta` | A mesma data de K-contraponto com horário desconhecido: Lua incerta, Vênus em Capricórnio | R-hora; posição incerta fora da comparação |
| `M-duas-imagens` | `clearHand` com a linha do coração curta (o traçado continua curvado) | duas imagens nas mãos; tensão nas mãos |
| `M-reservada` | `clearHand` com a linha do coração curta e reta | variantes com o polo de reserva nas mãos |
| `M-sem-elegível` | `clearHand` com o coração médio, o traçado indeterminado e a cabeça separada | U4-misto: traços observados sem correspondência e um não classificado |
| `M-sem-classificação` | `clearHand` com o comprimento do coração pouco visível, o traçado indeterminado e o início da cabeça não identificado; os demais traços observados | U4: nenhum traço comparável classificado, sem pedido de nova foto |

As datas fictícias foram encontradas por varredura de datas no próprio
motor, buscando a configuração necessária. **Nenhum fato astrológico nem
observação das mãos foi escrito à mão.** As variações de mão passam pelo
validador da 03C como qualquer observação.

### 7.2 Verificações e resultado

**Resultado: 0 falhas em 165 combinações e nos 6 casos adversariais.**

| Verificação                         | O que é conferido em cada combinação                                                                                                                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Capítulo 8: variantes               | Toda variante usada tem texto na biblioteca; aproximação, contraponto, diferença e duas imagens ocorrem (7.5)                                                                                                           |
| Capítulo 9: tema único e tensão     | Toda pergunta existe; "dois lados" só com os dois polos entre as fontes; tensão só dentro do mesmo assunto; um polo com pelo menos 2 referências                                                                        |
| Elegibilidade temática (capítulo 9) | **Toda** referência de **todo** tema é do **assunto do tema** (2.6); nos temas de eixo, tem polo naquele eixo; fora do capítulo 8, um tema nunca junta as duas tradições; mãos com pedido de nova foto nunca são usadas |
| Causa real da indisponibilidade     | U4 só quando nenhum traço comparável foi classificado; U4-misto só quando algum foi observado sem correspondência; nenhum texto afirma variação entre análises da foto da pessoa                                        |
| Sem contraponto artificial          | No capítulo 8, toda referência do céu (inclusive o outro lado) é do mesmo assunto do traço e tem o polo esperado                                                                                                        |
| Uma fonte só                        | O capítulo 8 fica sempre indisponível (U1, U2 ou U3); o capítulo 9 não usa vocabulário de conexão                                                                                                                       |
| Indisponibilidade e repetição       | Capítulo 9 com 2 ou 3 temas, sem assunto nem pergunta repetidos; abaixo disso, V1 ou V2                                                                                                                                 |
| Rastreabilidade                     | Toda referência citada existe na ponte entregue, com o `ref` do item original                                                                                                                                           |
| Segurança editorial                 | Todo texto renderizado passa nos padrões do projeto (02F e 03C), sem gênero presumido; no capítulo 8, sem "confirma", "reforça", elementos e similares; no capítulo 9, sem "conexão" e similares                        |
| Privacidade                         | Nenhum texto renderizado contém data, hora, local, identificador de lugar ou graus                                                                                                                                      |
| Repetição                           | Nenhuma frase repetida dentro do mesmo capítulo; perguntas sem semelhança com as 12 perguntas dos capítulos 1–7                                                                                                         |
| Determinismo                        | A mesma entrada gera a mesma saída                                                                                                                                                                                      |
| Fidelidade da biblioteca            | Todo texto literal é **exatamente igual** a um texto citado no registro (`96353c1` com `e6c291d`), salvo os alterados de propósito (5.0 e 5.1); qualquer outra diferença falha a verificação                            |

Textos da biblioteca: 55, sendo 45 literais e 10 modelos com lista. Literais divergentes do registro: **6**.

### 7.3 Casos adversariais (referências de assuntos incompatíveis)

| Caso | Tentativa                                                                                      | Resultado                                                                                                                                                  | Esperado |
| ---- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| X1   | Vínculo só com Sol, Mercúrio e Júpiter (exemplo da revisão), sem mãos                          | cap. 8: U1 · cap. 9: identidade/identidade[Sol em Câncer]; pensamento/pensamento[Mercúrio em Câncer]                                                       | ✔        |
| X2   | Expressão das mãos contra Marte em Leão (assunto agir), sem Lua nem Vênus                      | cap. 8: U6 · cap. 9: V2                                                                                                                                    | ✔        |
| X3   | Ritmo das mãos contra Vênus em Áries (assunto afeto) e Ascendente/Saturno com cautela          | cap. 8: U6 · cap. 9: afeto/autonomia[Vênus em Áries]; agir/cautela[linha da cabeça começando unida à da vida]; identidade/identidade[Ascendente em Virgem] | ✔        |
| X4   | Reserva só em Sol, Mercúrio, Júpiter e Saturno; expressão sem Lua/Vênus                        | cap. 8: U1 · cap. 9: identidade/identidade[Sol em Câncer]; pensamento/pensamento[Mercúrio em Câncer]                                                       | ✔        |
| X5   | Controle: Lua em Leão × Vênus em Capricórnio, sem mãos (tensão no mesmo assunto)               | cap. 8: U1 · cap. 9: afeto/two[Lua em Leão, Vênus em Capricórnio]; identidade/identidade[Sol em Câncer]; pensamento/pensamento[Mercúrio em Câncer]         | ✔        |
| X6   | Controle: coração aberto × Lua em Leão, com Marte em Leão presente (Marte não pode ser citado) | cap. 8: expressao/A[Lua em Leão] · cap. 9: V2                                                                                                              | ✔        |

### 7.4 Conjunto anterior (84 combinações de fixtures do projeto)

- **Capítulo 8:** 29 disponíveis; entre os 66 casos com as duas fontes, **29**.
  - Temas: Expressão · aproximação: 18; Expressão · diferença: 9; Ritmo · aproximação: 4.
  - Indisponíveis: U1: 11; U2: 6; U3: 1; U5: 33; U6: 4.
- **Capítulo 9:** 80 disponíveis.
  - Temas: afeto (cap. 8, ambas): 27; afeto (tensão, céu): 8; afeto (um polo, céu): 42; afeto (um polo, mãos): 3; agir (cap. 8, ambas): 4; agir (um polo, céu): 10; agir (um polo, mãos): 20; identidade (assunto, céu): 77; pensamento (assunto, céu): 45; pensamento (assunto, mãos): 2.
  - Indisponíveis: V1: 4.
  - Exclusões registradas: sem polo nos eixos que o assunto trata: 63; a outra tradição não foi juntada (sem conexão do cap. 8): 46; fora do limite de 3 temas: 32.
  - Temas por capítulo 9 disponível: 2 temas: 2; 3 temas: 78.

### 7.5 Fixtures construídas (81 combinações)

**Esta cobertura é das fixtures construídas para exercitar as variantes. Ela não estima com que frequência cada variante ocorre em pessoas reais.**

- **Capítulo 8:** 35 disponíveis; entre os 74 casos com as duas fontes, **35**.
  - Temas: Expressão · aproximação: 5; Expressão · aproximação com contraponto: 4; Expressão · diferença: 12; Expressão · duas imagens nas mãos: 12; Ritmo · aproximação: 12; Ritmo · diferença: 4.
  - Indisponíveis: U1: 3; U2: 4; U4: 14; U4misto: 14; U5: 9; U6: 2.
- **Capítulo 9:** 79 disponíveis.
  - Temas: afeto (cap. 8, ambas): 33; afeto (tensão, céu): 10; afeto (tensão, mãos): 1; afeto (um polo, céu): 34; afeto (um polo, mãos): 1; agir (cap. 8, ambas): 16; agir (um polo, céu): 25; agir (um polo, mãos): 20; identidade (assunto, céu): 77; pensamento (assunto, céu): 18; pensamento (assunto, mãos): 2.
  - Indisponíveis: V2: 2.
  - Exclusões registradas: a outra tradição não foi juntada (sem conexão do cap. 8): 84; fora do limite de 3 temas: 59; sem polo nos eixos que o assunto trata: 36.
  - Temas por capítulo 9 disponível: 3 temas: 79.

### 7.6 Comparação no conjunto anterior (84 combinações)

| Categoria  | Casos | Cap. 8 | Cap. 9 — `1b4c7ea` (polo de signo em qualquer posição) | Cap. 9 — `6879415` (compatibilidade estrita) | **Cap. 9 — proposta** |
| ---------- | ----- | ------ | ------------------------------------------------------ | -------------------------------------------- | --------------------- |
| Céu e mãos | 66    | 29     | 66                                                     | 22                                           | **66**                |
| Só céu     | 11    | 0      | 11                                                     | 0                                            | **11**                |
| Só mãos    | 6     | 0      | 0                                                      | 0                                            | **3**                 |
| Nenhuma    | 1     | 0      | 0                                                      | 0                                            | **0**                 |
| **Total**  | 84    | 29     | 77                                                     | 22                                           | **80**                |

Subconjunto de leitura das mãos parcial (36 combinações, distribuídas nas categorias acima): capítulo 9 disponível em 35.

**Procedência dos temas do capítulo 9 (conjunto anterior):**

| Assunto · base · tradição               | Temas |
| --------------------------------------- | ----- |
| identidade · pergunta do assunto · céu  | 77    |
| pensamento · pergunta do assunto · céu  | 45    |
| afeto · um polo · céu                   | 42    |
| afeto · capítulo 8 (céu e mãos)         | 27    |
| agir · um polo · mãos                   | 20    |
| agir · um polo · céu                    | 10    |
| afeto · tensão · céu                    | 8     |
| agir · capítulo 8 (céu e mãos)          | 4     |
| afeto · um polo · mãos                  | 3     |
| pensamento · pergunta do assunto · mãos | 2     |

### 7.7 Leitura dos resultados

- **Capítulo 8: sem mudança.** São 29 disponíveis entre os 66 casos com as
  duas fontes.
- **Capítulo 9: 80 de 84, sem meta de cobertura e sem mudar o mínimo.** A
  melhora vem de usar as interpretações que o relatório já apresenta,
  cada uma pelo seu próprio assunto.
  - Os 4 indisponíveis são os casos só com mãos que pedem nova foto (3) e o
    caso sem nenhuma fonte (V1).
  - Com só as mãos, o capítulo 9 aparece quando a leitura sustenta dois
    assuntos, por exemplo afeto (linha do coração) e agir (início da
    cabeça). Isso inclui a leitura parcial.
- **Fidelidade.**
  - Nenhum tema usa uma posição fora do seu assunto: vínculo nunca vem de
    Sol, Mercúrio ou Júpiter, e ritmo nunca vem de Vênus.
  - Fora do capítulo 8, nenhum tema junta céu e mãos: 22 casos de pensamento
    e 18 de agir tinham as duas tradições, e só uma foi usada.
  - Os casos adversariais confirmam isso (7.3).
- **Exclusões registradas:**
  - assuntos sem polo nos eixos que tratam, por exemplo Marte em Peixes no
    ritmo;
  - assuntos acima do limite de 3 temas;
  - a outra tradição não juntada.

  As contagens estão em 7.4 e 7.5.

- **Diferenciação.** Há 12 combinações distintas de perguntas nas 80. A
  pergunta de identidade aparece em quase todo relatório com céu, porque o
  Sol está sempre presente; ela fica por último, depois das perguntas que
  dependem da leitura. Pensamento entra quando sobra vaga.
- **Não se extrapola para usuários reais.** As fixtures são poucas e não
  aleatórias: 4 dos 11 mapas são o mesmo nascimento.

---

## 8. Decisões para a aprovação

1. **Mínimo por tema.** A regra "2 referências por tema de um polo" fica
   retirada, e cada tema passa a precisar de pelo menos uma interpretação
   apresentada do seu assunto. O mínimo de **2 temas distintos** continua.
   - Por quê: aquela regra protegia contra temas montados com polos de signo
     espalhados entre assuntos, e a seleção por assunto já elimina esse
     risco.
   - Se a regra fosse mantida, o capítulo 9 ficaria praticamente restrito
     aos casos com o capítulo 8.
2. **Duas perguntas novas** (4.2), para identidade e pensamento. São as
   únicas necessárias para cobrir os capítulos 1 e 3, que não têm pergunta
   de eixo compatível.
3. **Tabela 2.6** (assuntos do capítulo 9). O ponto a conferir é o
   agrupamento de Sol e Ascendente em "identidade".
4. **Capítulo 5 sem tema próprio.** Saturno e Júpiter não geram tema: as
   perguntas propostas nunca seriam usadas e foram retiradas. Se você
   quiser o capítulo 5 representado, a alternativa é reservar uma vaga para
   ele, o que tiraria pensamento ou identidade. **Recomendação: não
   reservar.**

Com essas aprovações, a biblioteca está pronta para a implementação dos
capítulos 8 e 9, com estes testes incorporados ao repositório como
regressão.
