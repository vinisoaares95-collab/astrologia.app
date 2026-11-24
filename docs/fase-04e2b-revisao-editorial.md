# Fase 04E.2B — Revisão editorial final

Estado: **correções T1–T6 aplicadas** (seção 8), com ajustes em T5 e T6
pedidos na aprovação. As seções 0 a 7 registram a avaliação que levou às
propostas (commit `34cb9d2`). Aceite editorial final pendente (seção 8.7).

Não houve:

- mudança nos motores, nos cálculos, nas associações ou na seleção;
- chamada paga, foto real, checkout, PDF ou deploy.

**Esta é uma avaliação automatizada e editorial, não um teste com
usuários.** As frequências medem o texto produzido. Não medem como as
pessoas o leem nem como reagem a ele.

## 0. Método

1. **Leitura integral de 6 relatórios completos (capítulos 1–9),** gerados
   com os motores e as fixtures do produto (mão simulada; nenhuma IA):

   | Caso | Céu                             | Mãos        |
   | ---- | ------------------------------- | ----------- |
   | A    | Recife, horário exato           | mão clara   |
   | B    | Bom Jesus, horário aproximado   | mão parcial |
   | C    | São Paulo, horário desconhecido | mão clara   |
   | D    | Rio Branco                      | sem mãos    |
   | E    | sem céu                         | mão clara   |
   | F    | Nova York                       | mão clara   |

2. **Varredura de 2.760 mapas fictícios.**
   - Datas a cada 9 dias de 1940 a 2007, no local de teste do projeto, com
     horários variados; 1 em cada 5 com horário desconhecido.
   - Cada mapa foi combinado com 6 situações das mãos das fixtures: clara,
     parcial, duas imagens, reservada, sem mãos e pedido de nova foto.
   - Resultado: 16.560 capítulos 8 e 9 e 13.800 capítulos 1–5 (74.736
     frases de seção).
3. **Contagens automáticas:**
   - repetições literais de 3 palavras na mesma frase e no mesmo capítulo;
   - padrões de erro gramatical ("de o", "em a", "a a", "à o", espaço
     duplo, frase sem ponto final);
   - conjuntos de perguntas do capítulo 9;
   - participação de cada capítulo.
4. **Simulação de regras alternativas do capítulo 9,** feita só numa cópia
   descartável, fora do repositório.

**Gravidade:**

- **alta:** prejudica a compreensão ou contradiz uma regra do relatório;
- **média:** repetição ou ambiguidade perceptível em parte relevante dos
  relatórios;
- **baixa:** monotonia ou estilo.

**Classes:**

- **[comprovado]:** reproduzido e contado;
- **[risco]:** ambiguidade demonstrável no texto, com efeito sobre quem lê
  ainda não medido;
- **[preferência]:** escolha de estilo, não erro.

## 1. Diagnóstico editorial dos nove capítulos

| Cap. | O que é personalizado                                                                                                | O que é fixo                                                             | Diagnóstico                                                                                                                                                                                                                                                                     |
| ---- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1–5  | As seções: em média 5–6 por capítulo e cerca de 27 por relatório, que juntam posição calculada e texto da biblioteca | Introdução, síntese e as 2 perguntas de cada capítulo: iguais para todos | Conteúdo personalizado relevante (signos, casas, aspectos, regente). Português correto: nenhum dos padrões de erro apareceu nas 74.736 frases. Há repetições literais (E1, E5) e um padrão de frase monótono (E9). Introdução, síntese e perguntas são coerentes, mas genéricas |
| 6–7  | Seções observadas e a lista de características na síntese e na primeira pergunta                                     | Introdução e segunda pergunta                                            | Claro e bem delimitado (o que foi observado vem antes da leitura simbólica). A lista de características se repete na síntese e na pergunta seguinte (E6)                                                                                                                        |
| 8    | Temas, selo, referências e concordância                                                                              | Introdução, síntese (4 variantes), aviso essencial e ressalvas           | Conteúdo pessoal curto (1 tema na maioria dos casos), cercado de três textos que repetem ideias (E3)                                                                                                                                                                            |
| 9    | Temas, referências, a pergunta de cada tema e a prática                                                              | Fechamento ("Para fechar") e ressalva final                              | Estrutura clara. Uma das 3 perguntas é quase sempre a de identidade, que repete a pergunta do capítulo 1 (E2). A pergunta de pensamento é genérica para o que a sustenta (E10)                                                                                                  |

O que o leitor recebe de mais relevante:

- as seções dos capítulos 1–5 e 6–7;
- no capítulo 8, o tema comparado e as referências;
- no capítulo 9, as referências "A partir de", que ligam cada pergunta à
  sua leitura.

Os textos fixos (introduções, sínteses, ressalvas e perguntas dos capítulos
1–5) dão enquadramento e segurança, mas não informam nada sobre a pessoa.

## 2. Problemas e gravidade

| #   | Problema                                                                                                                                                                                                                      | Evidência                                                                                                                                                                                                                                                                                                       | Classe                                                             | Gravidade   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------- |
| E1  | **"busca de sentido" duas vezes na mesma frase.** Por exemplo: "Com Júpiter na casa 9, a tradição associa a expansão, a confiança e a busca de sentido às viagens, aos estudos e à busca de sentido."                         | 15,3% dos relatórios (Júpiter em Sagitário: 9,2%; Júpiter na casa 9: 6,7%). É a **única** repetição literal dentro de uma frase em todo o corpus. Causa: a expressão está na função de Júpiter, nas qualidades de Sagitário e na área da casa 9                                                                 | [comprovado]                                                       | Média       |
| E2  | **A pergunta de identidade do capítulo 9 parafraseia a do capítulo 1.** "Em que situações você se sente mais você?" (cap. 1) × "Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?" (cap. 9)          | Identidade presente em 99,2–99,3% dos capítulos 9                                                                                                                                                                                                                                                               | [comprovado]                                                       | Média       |
| E3  | **O capítulo 8 repete as mesmas ideias em três textos** (detalhes na 3.1)                                                                                                                                                     | A expressão "a diferença fica à vista" está na introdução e na frase-ponte de diferença na expressão: 31,5% dos relatórios com mão clara. "Não é erro" está na síntese de diferença e no aviso essencial: 37,2%. "Tradições independentes" e "sistemas distintos" estão na introdução e na síntese de diferença | [comprovado]                                                       | Média       |
| E4  | **"construir com as próprias mãos"** (elemento Terra, cap. 1) num relatório com leitura das mãos                                                                                                                              | 16,7% dos relatórios. No caso A, coexiste com "mão de Terra" do capítulo 6: o texto sugere uma ligação entre céu e mãos que o capítulo 8 exclui de propósito (elementos e "mão de" são vetados nas conexões)                                                                                                    | [risco]                                                            | Média-baixa |
| E5  | **Repetições no capítulo 5 e, menos, no 4.** A função de Júpiter (e a de Saturno) se repete em duas frases seguidas (signo e casa). As qualidades do mesmo signo se repetem (Júpiter em Áries e Meio do Céu em Áries)         | Função repetida: 73% dos relatórios. Qualidades repetidas no capítulo: 26% (cap. 5: 20,7%; cap. 4: 7,1%)                                                                                                                                                                                                        | [comprovado]                                                       | Baixa       |
| E6  | **Capítulos 6–7: a lista de características aparece na síntese e de novo na primeira pergunta**                                                                                                                               | Sempre que há 2 ou mais características                                                                                                                                                                                                                                                                         | [comprovado]                                                       | Baixa       |
| E7  | **A ideia "o que combina e o que não combina" aparece em 4 lugares:** 2ª pergunta do cap. 1, 2ª pergunta dos caps. 6 e 7 e "Para fechar" do cap. 9                                                                            | Todo relatório completo. São 18 perguntas no total                                                                                                                                                                                                                                                              | [comprovado]                                                       | Baixa       |
| E8  | **Pergunta de vínculo do cap. 9 × 2ª pergunta do cap. 4:** "Em quais momentos… procura companhia…" × "Que equilíbrio entre proximidade e espaço próprio…"                                                                     | Vínculo com os dois lados: 6,6%; qualquer vínculo: 24,8%                                                                                                                                                                                                                                                        | [comprovado], paráfrase parcial                                    | Baixa       |
| E9  | **Fórmula repetida "Com X em Y, a tradição associa…"**                                                                                                                                                                        | 50% das seções começam por "Com"; 42% contêm "a tradição associa"; 78% contêm "tradição"                                                                                                                                                                                                                        | [preferência]. "A tradição" é o enquadramento simbólico deliberado | Baixa       |
| E10 | **A pergunta de pensamento não responde ao que a sustenta.** Ela fala de decisão ("chegar a uma conclusão"), mas a sustenta Mercúrio em Gêmeos (curiosidade) ou a linha da cabeça "descendo em direção ao pulso" (imaginação) | Casos D e E                                                                                                                                                                                                                                                                                                     | [preferência]/relevância                                           | Baixa       |

Não encontrei erro gramatical novo.

- Padrões automáticos: 0 ocorrências em 74.736 frases.
- Leitura dos 6 relatórios: as concordâncias corrigidas na 04E.1 continuam
  corretas.

## 3. Textos atuais e propostas

Todas as propostas abaixo mudam **só texto**, sem mudar associação,
seleção ou cálculo. Cada uma exige aprovação.

### 3.1 Capítulo 8: introdução, aviso essencial e síntese (E3)

Como as três peças se sobrepõem:

| Ideia                                         | Introdução | Aviso essencial (sempre visível) | Síntese de diferença | Frase-ponte de diferença na expressão |
| --------------------------------------------- | ---------- | -------------------------------- | -------------------- | ------------------------------------- |
| Tradições independentes ou sistemas distintos | ✔          | —                                | ✔                    | —                                     |
| Semelhança não comprova nada sobre você       | ✔          | ✔                                | —                    | —                                     |
| Diferença não é erro                          | —          | ✔                                | ✔                    | —                                     |
| "a diferença fica à vista"                    | ✔          | —                                | —                    | ✔ (literal)                           |

**T1 — Introdução (recomendada).** Mantém o caráter simbólico e a distinção
entre semelhança e comprovação. Tira só a última oração, que a frase-ponte,
o selo "Diferença" e a síntese já cobrem.

| Atual (48 palavras)                                                                                                                                                                                                                                                                                                              | Proposta (36 palavras)                                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, trata-se de uma semelhança de linguagem, não de uma constatação sobre você; quando apontam para lados diferentes, a diferença fica à vista. | Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, a semelhança é de linguagem, não uma constatação sobre você. |

Efeito: some a repetição literal de "a diferença fica à vista", e a
frase-ponte não precisa mudar.

**T2 — Síntese de diferença (opcional).** O aviso essencial, logo abaixo,
já diz que diferença não indica erro.

| Atual (33 palavras)                                                                                                                                                                                | Proposta (25 palavras)                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nos temas comparados, as duas tradições apontam para lados diferentes. Isso não é um erro de nenhuma delas: são sistemas simbólicos distintos, e cada um pode ser confrontado com o que você vive. | Nos temas comparados, as duas tradições apontam para lados diferentes: são sistemas simbólicos distintos, e cada um pode ser confrontado com o que você vive. |

Não mudam:

- o aviso essencial (tem a formulação mais precisa);
- as demais sínteses;
- as ressalvas da seção expansível.

### 3.2 Capítulos 1–5

**T3 — "busca de sentido" (E1).** Muda os dois textos que recebem a função
de Júpiter. A função de Júpiter e o texto autoral de "Sol em Sagitário" não
mudam.

| Onde                                | Atual                                                  | Proposta                                                    |
| ----------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| Qualidades de Sagitário (`base.ts`) | busca de sentido, entusiasmo e amplitude de horizontes | entusiasmo, amplitude de horizontes e desejo de compreender |
| Área da casa 9 (`base.ts`)          | as viagens, os estudos e a busca de sentido            | as viagens, os estudos e a visão de mundo                   |

Efeito esperado: 0% de frases com "busca de sentido" duas vezes. A
associação tradicional continua a mesma (Sagitário: expansão do
entendimento; casa 9: estudos, viagens e filosofia de vida).

Impacto técnico:

- muda as fixtures de referência do motor de interpretação;
- muda os textos dados como contexto à geração por IA (quando habilitada),
  o que pede revisão do prompt.

**T4 — Elemento Terra (E4).**

| Atual                                                                                                                                | Proposta                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Muitos corpos em signos de Terra são associados a senso prático e constância: construir com as próprias mãos pode trazer satisfação. | Muitos corpos em signos de Terra são associados a senso prático e constância: construir algo concreto, passo a passo, pode trazer satisfação. |

Mantém a associação (praticidade, constância, construção) e tira a alusão
às mãos.

**Não proposto agora:**

- **E5 (repetições no capítulo 5):** resolver exige mudar a montagem das
  frases no motor de interpretação, por exemplo mencionar a função só na
  primeira frase do mesmo corpo. Isso está fora desta etapa e pode ser
  avaliado depois, se aprovado.
- **E9 (fórmula repetida):** a fórmula é preferência de estilo e protege o
  enquadramento simbólico.

### 3.3 Capítulos 6–7

**T5 — Síntese sem repetir a lista (E6).** A lista continua na primeira
pergunta, logo abaixo.

| Atual                                                                                                                                                                           | Proposta                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Juntas, as leituras sobre a linha do coração, a linha da cabeça, a linha da vida e a linha do destino formam um retrato simbólico para comparar com o que você reconhece em si. | Juntas, essas leituras formam um retrato simbólico para comparar com o que você reconhece em si. |

Só se aplica à versão de reserva da biblioteca (`library-draft.ts`), que é
a usada na jornada simulada. A geração por IA tem regras próprias.

### 3.4 Capítulos 1 e 9: a pergunta repetida (E2)

**T6 — Recomendada: retirar a primeira pergunta do capítulo 1.**

- Pergunta que sai: "Em que situações você se sente mais você?"
- O capítulo 1 fica com "Qual dessas descrições combina menos com a sua
  experiência, e por quê?".
- O capítulo 9 continua a fazer a pergunta de identidade, já ligada às
  posições citadas ("A partir de: Sol em …; Ascendente em …").
- Não é preciso texto novo, e a regra aprovada do capítulo 9 não muda.
- Nos ~0,8% de relatórios sem identidade no capítulo 9, o capítulo 1 fica
  com uma só pergunta, como já acontece nos capítulos 6 e 7 com uma
  característica.

As alternativas a seguir foram simuladas e **não são recomendadas**:

| Alternativa                                                              | Efeito medido (2.760 mapas)                                                           | Por que não                                                                                                    |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Identidade depois de pensamento                                          | Com mãos: pensamento em 100% dos capítulos 9, identidade em 0%, capítulo 3 em 99%     | Troca uma pergunta quase fixa por outra (pensamento, também genérica, E10). Tira o capítulo 1 da conclusão     |
| Perguntas de identidade e pensamento só para chegar ao mínimo de 2 temas | Com mãos: capítulo 9 sempre com 2 temas (afeto e agir); identidade e pensamento em 0% | Guia mais curto, sem os capítulos 1 e 3. Muda uma decisão aprovada na 04D                                      |
| Reescrever a pergunta de identidade do capítulo 9                        | —                                                                                     | Qualquer pergunta sobre identidade repete uma das duas do capítulo 1. Exigiria texto novo sem resolver a causa |

E7, E8 e E10 ficam registrados, sem proposta. São de baixa gravidade e
dependem de textos aprovados em fases anteriores.

## 4. Diversidade do capítulo 9

### 4.1 Os 12 conjuntos da 04D: fixtures ou limitação real?

**As duas coisas, por motivos diferentes.**

Na varredura de 2.760 mapas, ignorando a ordem das perguntas:

| Mãos          | Conjuntos de perguntas distintos | Identidade | Pensamento | Ritmo/cautela |
| ------------- | -------------------------------- | ---------- | ---------- | ------------- |
| Mão clara     | 15                               | 99,3%      | 0,7%       | 92,4%         |
| Mão reservada | 15                               | 99,3%      | 0,7%       | 92,4%         |
| Duas imagens  | 12                               | 99,3%      | 0,7%       | 92,4%         |
| Sem mãos      | 35                               | 99,2%      | 68,4%      | 24,7%         |
| Total         | 47                               |            |            |               |

Componentes de **estrutura**, ou seja, das regras aprovadas:

- há só 4 assuntos (afeto, agir, identidade, pensamento), 12 perguntas
  ativas e no máximo 3 temas;
- afeto quase sempre tem polo (afeto presente em 95,5% sem mãos e 100%
  com mãos);
- identidade vem do Sol, que está sempre presente, e ganha a terceira vaga
  porque vem do capítulo 1;
- por isso, com mãos, pensamento fica de fora em 99% dos casos ("fora do
  limite de 3 temas": 12.622 exclusões).

Componente das **fixtures:**

- todas as variações de mão das fixtures têm a linha da cabeça começando
  unida à da vida;
- é o único traço das mãos com polo de ritmo, e só no lado da cautela;
- por isso, com mãos, há uma pergunta de ritmo em 100% dos casos, quase
  sempre a de cautela (92,4%);
- uma mão real com a linha da cabeça separada levaria o ritmo para o céu
  (Marte) ou o tiraria do guia.

### 4.2 É um problema?

**Para quem lê, o número de conjuntos não é o problema.** Cada pessoa vê um
único relatório. Nenhuma meta numérica foi estabelecida.

O problema real e comprovado está dentro de cada relatório: a terceira
pergunta é quase sempre a de identidade, que parafraseia o capítulo 1 (E2).
A proposta T6 trata disso sem mudar a seleção.

### 4.3 Outros pontos avaliados

- **Relevância.**
  - As perguntas de afeto e de ritmo correspondem bem ao polo que as
    sustenta. Por exemplo, a linha unida dá a pergunta sobre decisões
    tomadas com calma.
  - A pergunta de pensamento é genérica (E10).
- **Diversidade temática.**
  - Os capítulos que alimentam o capítulo 9 são o 1 (99%), o 4 (79%), o 7
    (67%), o 2 (61%) e o 3 (23%), em todas as combinações da varredura.
  - O 5 e o 6 ficam em 0% (seção 5).
- **Naturalidade da conclusão.**
  - "Para fechar" e a ressalva final funcionam bem.
  - "Para fechar" repete a ideia de concordar e discordar já presente em 3
    perguntas anteriores (E7; baixa).
- **Prática opcional:** coerente com o eixo do primeiro tema em todos os
  casos lidos.

## 5. Capítulos 5 e 6 na conclusão

**Capítulo 5** (Júpiter, Saturno, Meio do Céu e corpos lentos):

- esses corpos não têm assunto no capítulo 9 (tabela 2.6);
- as perguntas de estrutura (Saturno) e de expansão (Júpiter) foram
  retiradas na 04D, porque as vagas são preenchidas antes;
- a varredura confirma: em 99% dos capítulos 9, as 3 vagas já estão
  ocupadas;
- uma vaga reservada ao capítulo 5 tiraria afeto, agir ou identidade;
- além disso, as perguntas do próprio capítulo 5 ("Que habilidade você
  exerce…", "Qual desafio recente…") já cobrem o tema.

**Capítulo 6:**

- todas as características dele estão fora das conexões, por decisões
  aprovadas: o formato da palma é instável (D4) e é proporção (D3); o
  comprimento dos dedos é proporção (D3); o tipo de mão deriva dos dois;
- incluí-lo contrariaria esses critérios visuais.

**Conclusão:** não há correspondência editorial que justifique incluir os
capítulos 5 ou 6. **Nenhuma mudança proposta.**

Observação para o futuro: se a revalidação visual (paga, só com
autorização) aprovar alguma característica do capítulo 6, a participação
dele pode ser reavaliada.

## 6. Recomendações priorizadas

| Prioridade | Proposta                                                                        | Resolve                                                        | Esforço e risco                                                                             |
| ---------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1          | **T1:** introdução do capítulo 8                                                | E3, a repetição literal e a sobreposição mais visível          | Muito baixo: um texto da biblioteca 04D (nova versão `04d.3`) e o documento consolidado     |
| 2          | **T3:** "busca de sentido"                                                      | E1, a única repetição dentro de uma frase (15% dos relatórios) | Baixo: 2 textos de `base.ts`; regenerar as fixtures de referência; revisar o contexto da IA |
| 3          | **T6:** retirar a primeira pergunta do capítulo 1                               | E2 (99% dos relatórios)                                        | Baixo: 1 texto fixo; sem mudança de regra                                                   |
| 4          | **T4:** elemento Terra                                                          | E4 (16,7%)                                                     | Muito baixo: 1 texto autoral                                                                |
| 5          | **T2:** síntese de diferença do capítulo 8                                      | Parte de E3                                                    | Muito baixo; opcional                                                                       |
| 6          | **T5:** síntese dos capítulos 6–7                                               | E6                                                             | Muito baixo: só a versão de reserva                                                         |
| —          | Repetições no capítulo 5 (E5) e a fórmula "a tradição associa" (E9)             | —                                                              | Exige mudar a montagem do motor; fica fora desta etapa                                      |
| —          | **Avaliação com leitores reais:** clareza das ressalvas, capítulo 9 e tom geral | O que esta análise não mede                                    | Fora do escopo; recomendada antes do lançamento                                             |

## 7. Critérios para encerrar a revisão editorial

A revisão editorial pode ser encerrada quando:

1. **Cada proposta (T1–T6) tiver decisão registrada:** aprovada, ajustada
   ou rejeitada, com o texto final literal.
2. **As aprovadas estiverem implementadas:**
   - com nova versão das bibliotecas afetadas;
   - com documentos consolidados atualizados;
   - com testes que conferem o texto literal.
3. **A mesma varredura de 2.760 mapas, rodada de novo, mostrar:**
   - 0 repetições literais de 3 palavras dentro de uma frase, se T3 for
     aprovada;
   - nenhuma paráfrase entre os capítulos 1 e 9, se T6 for aprovada;
   - 0 ocorrências de "próprias mãos", se T4 for aprovada;
   - 0 ocorrências dos padrões de erro gramatical.
4. **Os itens aceitos como estilo** (E5, E7, E8, E9, E10) estiverem
   registrados como aceitos, e não como pendentes.
5. **As verificações técnicas passarem:** `npm run check`, `npm run build`
   e as regressões de navegador (04A–04E.2A e D5).
6. **Os 6 relatórios do método forem relidos por inteiro por uma pessoa**
   depois das mudanças, com aceite registrado.

O teste com leitores reais **não** faz parte destes critérios. Ele continua
recomendado como etapa própria, porque esta avaliação não o substitui.

## 8. Aplicação das correções (T1–T6)

Decisões da aprovação:

- T1, T2, T3 e T4 aprovadas como propostas.
- T5 e T6 ajustadas antes de aplicar (8.2).

Ficaram iguais:

- cálculos, associações e critérios visuais;
- regras de seleção dos capítulos 8 e 9;
- privacidade, consentimento, estrutura e fluxo.

### 8.1 Textos anteriores e finais

| #   | Onde                                                                                                   | Anterior                                                                                                                                                                                                                                                                                                                         | Final                                                                                                                                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | Introdução do capítulo 8 (`journey-chapters/library.ts`)                                               | Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, trata-se de uma semelhança de linguagem, não de uma constatação sobre você; quando apontam para lados diferentes, a diferença fica à vista. | Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, a semelhança é de linguagem, não uma constatação sobre você. |
| T2  | Síntese "Só diferenças" do capítulo 8                                                                  | Nos temas comparados, as duas tradições apontam para lados diferentes. Isso não é um erro de nenhuma delas: são sistemas simbólicos distintos, e cada um pode ser confrontado com o que você vive.                                                                                                                               | Nos temas comparados, as duas tradições apontam para lados diferentes: são sistemas simbólicos distintos, e cada um pode ser confrontado com o que você vive.                                                                                     |
| T3  | Qualidades de Sagitário (`interpretation/library/base.ts`)                                             | busca de sentido, entusiasmo e amplitude de horizontes                                                                                                                                                                                                                                                                           | entusiasmo, amplitude de horizontes e desejo de compreender                                                                                                                                                                                       |
| T3  | Área da casa 9 (`interpretation/library/base.ts`)                                                      | as viagens, os estudos e a busca de sentido                                                                                                                                                                                                                                                                                      | as viagens, os estudos e a visão de mundo                                                                                                                                                                                                         |
| T4  | Elemento Terra (`interpretation/library/authored.ts`)                                                  | …construir com as próprias mãos pode trazer satisfação.                                                                                                                                                                                                                                                                          | …construir algo concreto, passo a passo, pode trazer satisfação.                                                                                                                                                                                  |
| T5  | 1ª pergunta dos capítulos 6–7 com 2 ou mais características (`palm-reading/chapters/library-draft.ts`) | Entre {lista das características}, qual leitura conversa mais com o que você vive hoje?                                                                                                                                                                                                                                          | Qual dessas leituras conversa mais com o que você vive hoje?                                                                                                                                                                                      |
| T6  | 1ª pergunta do capítulo 1 (`interpretation/ai/library-chapter.ts`)                                     | Em que situações você se sente mais você?                                                                                                                                                                                                                                                                                        | Quando alguém acaba de conhecer você, o que costuma perceber primeiro — e o que só aparece com o tempo?                                                                                                                                           |

Versões atualizadas:

| Versão                    | Antes | Depois    | Cobre                                                |
| ------------------------- | ----- | --------- | ---------------------------------------------------- |
| `INTERPRETATION_VERSION`  | 02e.1 | **02e.2** | T3, T4                                               |
| `PROMPT_VERSION`          | 02f.2 | **02f.3** | T6; só a versão de reserva mudou, o prompt é o mesmo |
| `PALM_PROMPT_VERSION`     | 03e.2 | **03e.3** | T5; só a versão de reserva mudou, o prompt é o mesmo |
| `JOURNEY_LIBRARY_VERSION` | 04d.2 | **04d.3** | T1, T2                                               |

Efeito das versões: a versão registrada dos relatórios passou de
`02e.1+02f.2` para `02e.2+02f.3` (e `…+03e.3` nas mãos).

Documentos atualizados:

- `fase-04d-biblioteca-consolidada.md`: textos literais, exemplos e nota de
  versão;
- as fixtures de referência do motor de interpretação (4 arquivos),
  regeneradas.

### 8.2 Ajustes de T5 e T6

**T5 — a síntese continua personalizada.** A proposta original tirava a
lista da síntese. A versão aplicada faz o contrário:

- a **síntese mantém a lista** das características observadas ("Juntas, as
  leituras sobre o formato da palma, o comprimento dos dedos e a combinação
  de palma e dedos formam…");
- a **primeira pergunta**, logo abaixo, passa a remeter a ela ("Qual dessas
  leituras…").

Assim nenhuma informação específica se perde: a lista continua no mesmo
capítulo, a uma linha de distância. Só a repetição sai.

O caso de uma única característica não mudou: a síntese e a pergunta já não
repetiam lista.

**T6 — o capítulo 1 continua com duas perguntas.** A pergunta nova trata de
outro aspecto da identidade: a diferença entre a primeira impressão e o que
se revela com o tempo. Ela corresponde à "forma de se colocar no mundo", da
introdução, e ao Ascendente.

Ela foi conferida contra o conteúdo real do capítulo:

- **Na varredura de 2.760 mapas:**
  - o Ascendente aparece em 80% dos capítulos 1, com textos como
    "aproximação ao mundo", "transmitir presença" e "observar o clima antes
    de se expor";
  - nos 20% sem Ascendente (horário desconhecido ou aproximado), a pergunta
    se apoia na introdução, que é igual para todos.
- **Na leitura dos casos B e C** (sem Ascendente), a pergunta continua
  pertinente. Ela não menciona astrologia nem afirma nada, e conversa com os
  textos do Sol (por exemplo, Escorpião: "a intensidade verdadeira às
  superfícies").
- **Em relação às outras perguntas,** ela não repete:
  - a de identidade do capítulo 9 ("Que atividade ou escolha do seu dia a
    dia…"): atividade × percepção alheia;
  - a segunda do próprio capítulo 1 nem o "Para fechar" do capítulo 9
    (concordar e discordar);
  - o início de nenhuma pergunta do capítulo 9: a primeira redação ("Como
    você costuma se apresentar…") começava igual à de pensamento ("Como você
    costuma chegar…"). O teste de ineditismo apontou isso, e ela foi
    reescrita.
- **Linguagem:** neutra quanto a gênero ("alguém acaba de conhecer você"),
  dentro do limite de 200 caracteres e terminando em "?".

### 8.3 Propostas preservadas sem alteração

Nenhuma proposta foi descartada. Mantidos de propósito:

- **Aviso essencial (R0) e frases-ponte do capítulo 8.** A repetição literal
  saiu pela introdução (T1), sem mexer nelas. "A diferença fica à vista, sem
  conciliação" continua só na frase-ponte.
- **Função de Júpiter** ("a expansão, a confiança e a busca de sentido") e o
  texto autoral de "Sol em Sagitário".
  - A repetição ficava nos textos que recebem essa função (qualidades de
    Sagitário e área da casa 9), e foi ali que mudou.
  - Mudar a função alteraria todas as frases de Júpiter.
- **Segunda pergunta dos capítulos 6–7** ("Em que situações você se
  reconhece nessas leituras, e em quais não?"). Agora ela fica ao lado de
  "Qual dessas leituras…": o eco "dessas/nessas" é estilo de baixa
  gravidade, aceito.

**Problemas de baixa gravidade aceitos nesta fase,** sem mudança no motor:

| #   | Problema                                                                                                             | Decisão                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| E5  | Função de Júpiter ou Saturno repetida em duas frases do capítulo 5; qualidades do mesmo signo repetidas num capítulo | Aceito. Corrigir exigiria mudar a montagem das frases no motor |
| E7  | A ideia de "combina e não combina" em 4 perguntas (caps. 1, 6, 7 e "Para fechar")                                    | Aceito                                                         |
| E8  | Vínculo do capítulo 9 × segunda pergunta do capítulo 4 (6,6%)                                                        | Aceito                                                         |
| E9  | Fórmula "Com X em Y, a tradição associa…"                                                                            | Aceito: é o enquadramento simbólico deliberado                 |
| E10 | Pergunta de pensamento genérica                                                                                      | Aceito                                                         |
| —   | Eco "dessas/nessas" nas perguntas dos capítulos 6–7                                                                  | Aceito                                                         |

### 8.4 Validação

**Varredura repetida** com o mesmo método da seção 0 (2.760 mapas × 6
situações das mãos):

| Verificação                                                              | Resultado                                                                                                                        |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| "busca de sentido" duas vezes na mesma frase                             | **0** (antes: 15,3% dos relatórios)                                                                                              |
| Qualquer repetição literal de 3 palavras de conteúdo na mesma frase      | **0** em 74.736 frases                                                                                                           |
| "próprias mãos"                                                          | **0** (antes: 16,7%)                                                                                                             |
| Padrões de erro gramatical                                               | **0**                                                                                                                            |
| Frases alteradas                                                         | 3.119 de 74.736. **Todas** diferem do texto anterior só pelas substituições aprovadas (Sagitário 1.478, casa 9 1.180, Terra 461) |
| Seleção dos capítulos 8 e 9 (temas, bases, capítulos citados, exclusões) | **Idêntica** nas 16.560 combinações                                                                                              |
| Número de seções por capítulo                                            | Idêntico: nenhuma interpretação perdida                                                                                          |
| Determinismo                                                             | Duas execuções com saída byte a byte idêntica (mesmo hash)                                                                       |

**Testes novos de fidelidade:**

- `src/features/interpretation/editorial-04e2b.test.ts`:
  - nenhuma função de corpo partilha trecho de 3 palavras com as qualidades
    dos 12 signos ou com as áreas das 12 casas (a regra geral que impede o
    E1 de voltar);
  - textos aprovados de T3 e T4; versão `02e.2`;
  - 2 perguntas por capítulo astrológico, todas distintas;
  - T6 literal e sem trechos em comum com a pergunta de identidade nem com o
    "Para fechar" do capítulo 9.
- `src/features/report/journey-chapters/library.test.ts`:
  - versão `04d.3` e os textos literais de T1 e T2;
  - a introdução sem trechos de 4 palavras em comum com as frases-ponte e
    as sínteses;
  - "erro" só no aviso essencial.
- O teste de ineditismo existente (perguntas do capítulo 9 × capítulos 1–7)
  continua passando com a pergunta nova.
- `src/features/palm-reading/chapters/chapters.test.ts`:
  - a síntese continua nomeando as características observadas;
  - a primeira pergunta é a remissiva;
  - a versão é `03e.3`.

**Rastreabilidade:** os testes de rastreabilidade existentes (ids de itens
e fatos, notas de precisão, validadores de rascunho) passam sem mudança.

A checagem automática de semelhança **não substitui a revisão humana**: os
exemplos completos do apêndice A estão aí para essa leitura.

### 8.5 Testes e build

| Verificação                     | Resultado                                               |
| ------------------------------- | ------------------------------------------------------- |
| `npm run check`                 | **1284 aprovados**, 42 ignorados (pagos e de avaliação) |
| `npm run build`                 | Aprovado                                                |
| 04A (`next start`)              | 45/45                                                   |
| 04B                             | 28/28                                                   |
| 04C com motor / sem motor       | 34/34 e 18/18                                           |
| 04D, 4 cenários                 | 36, 12, 12 e 16, todos aprovados                        |
| D5                              | 17/17                                                   |
| 04E.1                           | 36/36                                                   |
| 04E.2A, mão clara e mão parcial | 48/48 e 45/45                                           |

**Navegador: 12 execuções, 347 verificações, 0 falhas.**

### 8.6 Relatórios revisados

Os seis relatórios da seção 0 foram gerados de novo e conferidos no
contexto completo. Trechos que mudaram:

| Caso | Mudanças | Conferido                                                                                                                     |
| ---- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| A    | 9        | Capítulo 1 (casa 9, Terra, T6), capítulo 5 (Saturno em Sagitário, Júpiter na casa 9), capítulos 6–7 (T5), capítulo 8 (T1, T2) |
| B    | 4        | Capítulo 1 sem Ascendente (Terra, T6), capítulos 6–7, capítulo 8 com aproximação (T1)                                         |
| C    | 3        | Capítulo 1 com horário desconhecido (T6), capítulos 6–7                                                                       |
| D    | 3        | Sem mãos: capítulo 1 (T6) e cúspides em Sagitário; capítulo 8 indisponível sem mudança                                        |
| E    | 2        | Sem céu: só capítulos 6–7 (T5)                                                                                                |
| F    | 5        | Capítulo 1 (T6), Sagitário e casa 9, capítulos 6–7 e 8                                                                        |

Os dois exemplos completos representativos estão no apêndice A (casos
fictícios de verificação; mão simulada; sem dados pessoais). Cada trecho
alterado vem marcado com ✎ e seguido do texto anterior.

### 8.7 Pendências objetivas para o aceite final da Fase 04

1. **Aceite editorial humano** dos dois exemplos do apêndice A, em especial
   da pergunta nova do capítulo 1 (T6) e da remissão dos capítulos 6–7
   (T5). É o critério 6 da seção 7.
2. **Privacidade fora do ambiente interno** (pré-requisito de lançamento,
   registrado na 04E.1):
   - mencionar as pontes dos capítulos 8 e 9 na política;
   - registro de consentimento em produção;
   - licença AGPL do motor astrológico.
3. **Aparelhos e navegadores reais:** Safari, Firefox, iPhone e Android
   físicos e leitores de tela (VoiceOver, TalkBack).
4. **Caminho com IA (pago, só com autorização):** as correções valem para
   os textos da biblioteca e das versões de reserva.
   - Os capítulos redigidos por IA criam as próprias sínteses e perguntas.
   - Uma validação paga confirmaria que eles não trazem de volta as
     repetições.
   - Os prompts não mudaram.
5. **Revalidação visual das mãos e experimento de repetibilidade** (pagos):
   continuam pendentes. Deles depende reavaliar o capítulo 6 e a
   participação dele no capítulo 9.
6. **Teste com leitores reais:** recomendado. Não faz parte dos critérios e
   não foi feito.

## Apêndice A — Exemplos completos para a revisão editorial

Relatórios montados pelos motores do produto com casos **fictícios** de
verificação e leitura das mãos **simulada**. Nenhuma IA foi usada e não há
dados pessoais. Datas, horas e locais não aparecem no relatório, por
projeto.

As marcações entre parênteses (estado da parte, notas de precisão, seção
recolhida) mostram a estrutura que o leitor vê na tela.

### Exemplo 1 — céu com horário exato (caso fictício "Recife 1986") × mão clara simulada

#### Parte I — Seu Céu (ready)

_As posições astronômicas deste relatório são calculadas. Os significados atribuídos a elas são interpretações simbólicas da tradição da astrologia ocidental tropical — não são fatos científicos, diagnósticos nem previsões._

##### 1. Sua identidade astrológica

Este capítulo reúne os elementos do mapa que a tradição astrológica associa ao núcleo da identidade e à forma de se colocar no mundo.

Com o Sol em Capricórnio, a identidade é ligada à responsabilidade e à construção a longo prazo: você pode se realizar ao transformar metas em estruturas sólidas.

Com o Ascendente em Touro, a aproximação ao mundo é tradicionalmente calma e constante: você pode transmitir presença e confiabilidade.

✎ **[alterado na 04E.2B]** Com o Sol na casa 9, a tradição associa o núcleo de identidade e a vontade de se expressar às viagens, aos estudos e à visão de mundo.

> Antes: Com o Sol na casa 9, a tradição associa o núcleo de identidade e a vontade de se expressar às viagens, aos estudos e à busca de sentido.

Com o Ascendente em Touro, o regente tradicional do mapa é Vênus. A tradição sugere que o afeto, o prazer e a forma de se vincular — aqui em Capricórnio, na casa 8 — ganham peso especial na condução da sua trajetória.

Na tradição, o trígono entre o Sol e o Ascendente sugere que a identidade e a forma de se apresentar fluem com naturalidade, como um talento que se exerce com facilidade.

✎ **[alterado na 04E.2B]** Muitos corpos em signos de Terra são associados a senso prático e constância: construir algo concreto, passo a passo, pode trazer satisfação.

> Antes: Muitos corpos em signos de Terra são associados a senso prático e constância: construir com as próprias mãos pode trazer satisfação.

**Síntese.** Em conjunto, esses elementos descrevem facetas simbólicas da identidade; vale observar quais delas fazem sentido na sua experiência.

✎ **[alterado na 04E.2B]** **Para refletir.** Quando alguém acaba de conhecer você, o que costuma perceber primeiro — e o que só aparece com o tempo? / Qual dessas descrições combina menos com a sua experiência, e por quê?

> Antes: **Para refletir.** Em que situações você se sente mais você? / Qual dessas descrições combina menos com a sua experiência, e por quê?

##### 2. Seu mundo emocional

Aqui estão os elementos que a tradição liga às necessidades emocionais, ao acolhimento e ao modo de reagir ao que se sente.

A Lua em Áries é tradicionalmente associada a emoções rápidas e diretas: você pode precisar de espaço para reagir e de liberdade para seguir em frente.

Com a Lua na casa 11, a tradição associa as necessidades emocionais e a forma de buscar acolhimento às amizades, aos grupos e aos projetos de futuro.

Na tradição, o sextil entre a Lua e o Ascendente sugere que as emoções e a forma de se apresentar se apoiam e abrem oportunidades quando há iniciativa.

Lua em aspecto tenso com Netuno é tradicionalmente ligada à tensão entre sensibilidade e imaginação: distinguir o que você sente do que idealiza pode ajudar a integrar essas duas forças.

Com a cúspide da casa 4 (Fundo do Céu) em Leão, a tradição associa as raízes, o lar e a vida íntima a temas como criatividade, generosidade e desejo de reconhecimento.

**Síntese.** Juntos, esses temas oferecem uma leitura simbólica da vida emocional, para ser confrontada com o que você reconhece em si.

**Para refletir.** O que costuma trazer segurança emocional no seu dia a dia? / Como você percebe quando precisa de acolhimento?

##### 3. Sua mente e comunicação

Este capítulo trata do que a tradição associa ao jeito de pensar, aprender e se comunicar.

Mercúrio em Capricórnio é associado a um raciocínio estratégico e objetivo: você pode valorizar ideias que levem a resultados concretos.

Mercúrio na casa 8 é tradicionalmente ligado a uma mente que investiga: temas profundos, psicologia e o que está por trás das aparências podem atrair a sua atenção.

Na tradição, o sextil entre Mercúrio e Marte sugere que a mente e a ação se apoiam e abrem oportunidades quando há iniciativa.

Com a cúspide da casa 3 em Câncer, a tradição associa a comunicação, o aprendizado e o entorno próximo a temas como cuidado, memória afetiva e proteção.

**Síntese.** Em conjunto, esses elementos sugerem um estilo de pensar e se comunicar que você pode reconhecer, ajustar ou questionar.

**Para refletir.** Em que contextos você aprende com mais prazer? / Como você prefere organizar uma ideia antes de compartilhá-la?

##### 4. Seus relacionamentos e vínculos

Aqui aparecem os elementos que a tradição relaciona aos afetos, ao desejo e à forma de construir vínculos.

Vênus em Capricórnio é tradicionalmente ligada ao afeto que se prova com o tempo: compromisso e confiabilidade podem pesar nas suas escolhas.

Com Marte em Escorpião, a tradição associa a iniciativa, o desejo e a maneira de agir a temas como intensidade, profundidade e entrega.

Com a cúspide da casa 7 (Descendente) em Escorpião, a tradição associa as parcerias e os encontros com o outro a temas como intensidade, profundidade e entrega.

Com Vênus na casa 8, a tradição associa o afeto, o prazer e a forma de se vincular à intimidade, aos recursos compartilhados e às transformações.

Na tradição, a conjunção entre o Sol e Vênus sugere que a identidade e os afetos se fundem e atuam em conjunto, para o bem e para o desafio.

Na tradição, a quadratura entre Marte e Júpiter sugere que a ação e a expansão geram atrito, um desafio que costuma impulsionar crescimento.

**Síntese.** Juntos, esses temas compõem uma leitura simbólica dos vínculos, como ponto de partida para reflexão e não como regra.

**Para refletir.** O que faz você se sentir à vontade em um vínculo? / Que equilíbrio entre proximidade e espaço próprio parece bom para você hoje?

##### 5. Seus talentos e desafios

Este capítulo reúne o que a tradição associa a recursos que podem ser cultivados e a desafios que pedem amadurecimento.

✎ **[alterado na 04E.2B]** Com Saturno em Sagitário, a tradição associa a estrutura, os limites e o amadurecimento a temas como entusiasmo, amplitude de horizontes e desejo de compreender.

> Antes: Com Saturno em Sagitário, a tradição associa a estrutura, os limites e o amadurecimento a temas como busca de sentido, entusiasmo e amplitude de horizontes.

Com Júpiter em Aquário, a tradição associa a expansão, a confiança e a busca de sentido a temas como originalidade, senso coletivo e independência.

✎ **[alterado na 04E.2B]** Com Júpiter na casa 9, a tradição associa a expansão, a confiança e a busca de sentido às viagens, aos estudos e à visão de mundo.

> Antes: Com Júpiter na casa 9, a tradição associa a expansão, a confiança e a busca de sentido às viagens, aos estudos e à busca de sentido.

Com Saturno na casa 7, a tradição associa a estrutura, os limites e o amadurecimento às parcerias e aos encontros com o outro.

Com o Meio do Céu em Aquário, a tradição associa a vocação e a imagem pública a temas como originalidade, senso coletivo e independência.

Na tradição, o sextil entre Júpiter e Urano sugere que a expansão e a liberdade se apoiam e abrem oportunidades quando há iniciativa.

**Síntese.** Em conjunto, talentos e desafios aparecem aqui como possibilidades simbólicas, que ganham forma com escolhas e experiência.

**Para refletir.** Que habilidade você exerce com naturalidade e poderia valorizar mais? / Qual desafio recente trouxe aprendizado inesperado?

#### Parte II — Suas Mãos (ready)

_As características descritas foram observadas numa fotografia e podem não corresponder exatamente à sua mão. Os significados vêm da tradição simbólica da quiromancia — não são fatos científicos, diagnósticos nem previsões. A linha da vida, em particular, é lida como um retrato do modo de viver._

> Leitura simulada: nenhuma inteligência artificial observou uma foto real.

##### 6. As características das suas mãos

Este capítulo parte do formato da sua mão, como ele apareceu na foto, e do que a tradição da quiromancia associa a ele.

- Observado: Palma de formato mais quadrado: a largura é parecida com o comprimento.

Na quiromancia, a palma de formato mais quadrado costuma ser associada a um jeito prático de estar no mundo: gosto por estrutura, constância e soluções concretas.

- Observado: Dedos curtos em relação ao comprimento da palma.

Na quiromancia, dedos mais curtos em relação à palma são ligados a um modo de agir rápido e direto, mais atento ao conjunto do que aos detalhes.

- Observado: Combinação de palma e dedos que a quiromancia moderna chama de mão de Terra.

Palma mais quadrada com dedos curtos compõe o que a quiromancia moderna chama de mão de Terra, associada à praticidade, à estabilidade e ao contato com o concreto.

**Síntese.** Juntas, as leituras sobre o formato da palma, o comprimento dos dedos e a combinação de palma e dedos formam um retrato simbólico para comparar com o que você reconhece em si.

✎ **[alterado na 04E.2B]** **Para refletir.** Qual dessas leituras conversa mais com o que você vive hoje? / Em que situações você se reconhece nessas leituras, e em quais não?

> Antes: **Para refletir.** Entre o formato da palma, o comprimento dos dedos e a combinação de palma e dedos, qual leitura conversa mais com o que você vive hoje? / Em que situações você se reconhece nessas leituras, e em quais não?

**Limites.**

- O formato da palma e o comprimento dos dedos são proporções estimadas a olho na foto; ângulo, perspectiva e enquadramento podem alterá-las.

##### 7. As linhas da sua palma

Aqui estão as linhas da palma que puderam ser observadas na foto e as leituras simbólicas que a tradição da quiromancia faz delas.

- Observado: Linha do coração longa, chegando à área sob o dedo indicador.

Uma linha do coração longa costuma ser associada, na quiromancia, a um afeto expansivo e generoso, que se envolve com intensidade.

- Observado: Linha do coração curvando-se para cima, em direção aos dedos.

Quando a linha do coração se curva em direção aos dedos, a tradição a associa a uma expressão afetiva calorosa e aberta.

- Observado: Linha da cabeça de comprimento médio, chegando à área sob o dedo anelar.

Uma linha da cabeça de comprimento médio é associada pela tradição a um pensamento que equilibra praticidade e reflexão.

- Observado: Linha da cabeça descendo em direção ao pulso.

Quando a linha da cabeça desce em direção ao pulso, a tradição a liga à imaginação e a um pensamento mais criativo.

- Observado: Linha da cabeça começando unida à linha da vida.

Quando a linha da cabeça começa unida à da vida, a quiromancia costuma associar isso à cautela: você pode preferir avaliar bem antes de se lançar.

- Observado: Linha da vida em arco amplo, avançando para o centro da palma.

Na quiromancia, um arco amplo da linha da vida é associado ao entusiasmo e à abertura para novas experiências.

- Observado: Linha do destino nítida, subindo em direção ao dedo médio.

Uma linha do destino bem marcada é associada, na tradição, à sensação de propósito e a uma direção que você constrói ao longo do caminho — não a um destino fixo.

**Síntese.** Juntas, as leituras sobre a linha do coração, a linha da cabeça, a linha da vida e a linha do destino formam um retrato simbólico para comparar com o que você reconhece em si.

✎ **[alterado na 04E.2B]** **Para refletir.** Qual dessas leituras conversa mais com o que você vive hoje? / Em que situações você se reconhece nessas leituras, e em quais não?

> Antes: **Para refletir.** Entre a linha do coração, a linha da cabeça, a linha da vida e a linha do destino, qual leitura conversa mais com o que você vive hoje? / Em que situações você se reconhece nessas leituras, e em quais não?

#### Parte III — Sua Jornada (ready)

##### 8. Conexões simbólicas entre céu e mãos

✎ **[alterado na 04E.2B]** Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, a semelhança é de linguagem, não uma constatação sobre você.

> Antes: Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, trata-se de uma semelhança de linguagem, não de uma constatação sobre você; quando apontam para lados diferentes, a diferença fica à vista.

###### Expressão: abertura e reserva · Diferença

- Nas mãos: linha do coração longa; linha do coração curvada para cima (cap. 7)
- No céu: Vênus em Capricórnio (cap. 4)

Aqui as leituras seguem caminhos diferentes: a quiromancia associa estes traços a uma expressão mais aberta, e a posição citada do mapa, a uma expressão mais reservada. A diferença fica à vista, sem conciliação.

✎ **[alterado na 04E.2B]** **Síntese.** Nos temas comparados, as duas tradições apontam para lados diferentes: são sistemas simbólicos distintos, e cada um pode ser confrontado com o que você vive.

> Antes: **Síntese.** Nos temas comparados, as duas tradições apontam para lados diferentes. Isso não é um erro de nenhuma delas: são sistemas simbólicos distintos, e cada um pode ser confrontado com o que você vive.

**Limites.**

- Semelhanças entre tradições simbólicas não comprovam traços de personalidade, e diferenças entre elas não indicam erro de nenhuma das leituras.

**Limitações desta análise (recolhida).**

- O formato da palma, o comprimento dos dedos, o comprimento da linha da cabeça e o arco da linha da vida não entram nestas comparações: são características que ainda não podem ser classificadas com segurança a partir de uma foto.
- Os demais traços e posições tratam de outros temas e por isso não são comparados neste capítulo.
- Esta comparação usa uma leitura das mãos simulada, do ambiente interno de testes.

##### 9. Seu guia pessoal de reflexão

Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos 1, 4 e 7; as respostas, e a decisão sobre o que faz sentido para você, são suas.

###### Expressão: abertura e reserva

- A partir de: Vênus em Capricórnio (cap. 4); linha do coração longa; linha do coração curvada para cima (cap. 7)

Com quem você mostra com facilidade o que sente, e com quem prefere guardar mais para si?

###### Ritmo: impulso e cautela

- A partir de: linha da cabeça começando unida à da vida (cap. 7)

Que decisões você costuma tomar com calma, e quais gostaria de tomar com menos espera?

###### Identidade

- A partir de: Sol em Capricórnio; Ascendente em Touro (cap. 1)

Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?

###### Prática opcional

Se quiser, repare ao longo de uma semana em quando você fala do que sente e quando prefere guardar. Anotar uma ou duas situações já basta.

###### Para fechar

Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?

**Limites.**

- Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.

### Exemplo 2 — céu com horário aproximado (caso fictício "Bom Jesus") × mão parcial simulada

#### Parte I — Seu Céu (ready)

_As posições astronômicas deste relatório são calculadas. Os significados atribuídos a elas são interpretações simbólicas da tradição da astrologia ocidental tropical — não são fatos científicos, diagnósticos nem previsões._

##### 1. Sua identidade astrológica

Este capítulo reúne os elementos do mapa que a tradição astrológica associa ao núcleo da identidade e à forma de se colocar no mundo.

Com o Sol em Touro, a identidade é tradicionalmente ligada à construção paciente: você pode se sentir mais em casa quando cultiva o que é concreto, belo e duradouro.
(nota: Com o horário de nascimento aproximado, a posição do Sol pode estar entre 21°42′ de Touro e 21°44′ de Touro; a leitura usa a posição calculada para o horário informado (21°43′ de Touro).)

O Sol na casa 8 é tradicionalmente associado a buscar identidade nas experiências de profundidade: crises, intimidade e transformações podem ser momentos de autodescoberta.

✎ **[alterado na 04E.2B]** Muitos corpos em signos de Terra são associados a senso prático e constância: construir algo concreto, passo a passo, pode trazer satisfação.

> Antes: Muitos corpos em signos de Terra são associados a senso prático e constância: construir com as próprias mãos pode trazer satisfação.

Sol em aspecto harmonioso com Saturno é associado à capacidade de dar forma às metas: disciplina e paciência podem trabalhar a favor da sua expressão.

Sol em aspecto harmonioso com Marte é associado a vontade e ação bem articuladas: você pode transformar intenção em iniciativa com relativa facilidade.

**Síntese.** Em conjunto, esses elementos descrevem facetas simbólicas da identidade; vale observar quais delas fazem sentido na sua experiência.

✎ **[alterado na 04E.2B]** **Para refletir.** Quando alguém acaba de conhecer você, o que costuma perceber primeiro — e o que só aparece com o tempo? / Qual dessas descrições combina menos com a sua experiência, e por quê?

> Antes: **Para refletir.** Em que situações você se sente mais você? / Qual dessas descrições combina menos com a sua experiência, e por quê?

**Limites.**

- Regente do mapa não considerado: o signo do Ascendente varia dentro da janela de horário.
- Casas e cúspides não consideradas: com horário aproximado, só entram posições em casas que não mudam dentro da janela.
- Não interpretado por incerteza do horário: Ascendente em Virgem no centro da janela (28°05′), variando 17,6° na janela.

##### 2. Seu mundo emocional

Aqui estão os elementos que a tradição liga às necessidades emocionais, ao acolhimento e ao modo de reagir ao que se sente.

A Lua em Sagitário, na tradição, busca sentido e movimento: otimismo, aventura e espaço para explorar podem renovar o seu ânimo.
(nota: Com o horário de nascimento aproximado, a posição da Lua pode estar entre 23°20′ de Sagitário e 23°50′ de Sagitário; a leitura usa a posição calculada para o horário informado (23°35′ de Sagitário).)

Lua em aspecto tenso com Marte é associada a reações emocionais intensas: reconhecer a irritação cedo pode ajudar você a transformá-la em ação construtiva.

**Síntese.** Juntos, esses temas oferecem uma leitura simbólica da vida emocional, para ser confrontada com o que você reconhece em si.

**Para refletir.** O que costuma trazer segurança emocional no seu dia a dia? / Como você percebe quando precisa de acolhimento?

**Limites.**

- Casas e cúspides não consideradas: com horário aproximado, só entram posições em casas que não mudam dentro da janela.
- Casas que mudam dentro da janela de horário (não interpretadas): a Lua (casas 3, 4).

##### 3. Sua mente e comunicação

Este capítulo trata do que a tradição associa ao jeito de pensar, aprender e se comunicar.

Mercúrio em Touro é tradicionalmente ligado a um raciocínio prático e constante: você pode preferir ideias testadas e aprender no seu próprio ritmo.
(nota: Com o horário de nascimento aproximado, a posição de Mercúrio pode estar entre 8°37′ de Touro e 8°38′ de Touro; a leitura usa a posição calculada para o horário informado (8°37′ de Touro).)

Mercúrio retrógrado no nascimento é associado, na tradição, a um pensamento que revisa e reelabora: você pode preferir refletir antes de falar e voltar às ideias para aprofundá-las.

Mercúrio em aspecto harmonioso com Júpiter é associado a uma mente que gosta de ampliar horizontes: aprender e ensinar podem ser atividades naturais para você.

Na tradição, o trígono entre Mercúrio e Urano sugere que a mente e a liberdade fluem com naturalidade, como um talento que se exerce com facilidade.

**Síntese.** Em conjunto, esses elementos sugerem um estilo de pensar e se comunicar que você pode reconhecer, ajustar ou questionar.

**Para refletir.** Em que contextos você aprende com mais prazer? / Como você prefere organizar uma ideia antes de compartilhá-la?

**Limites.**

- Casas e cúspides não consideradas: com horário aproximado, só entram posições em casas que não mudam dentro da janela.
- Casas que mudam dentro da janela de horário (não interpretadas): Mercúrio (casas 7, 8).

##### 4. Seus relacionamentos e vínculos

Aqui aparecem os elementos que a tradição relaciona aos afetos, ao desejo e à forma de construir vínculos.

Vênus em Áries é associada a um afeto espontâneo e entusiasmado: você pode se encantar com a conquista e com relações que tenham vitalidade.
(nota: Com o horário de nascimento aproximado, a posição de Vênus pode estar entre 9°38′ de Áries e 9°41′ de Áries; a leitura usa a posição calculada para o horário informado (9°39′ de Áries).)

Com Marte em Peixes, a tradição associa a iniciativa, o desejo e a maneira de agir a temas como sensibilidade, imaginação e empatia.
(nota: Com o horário de nascimento aproximado, a posição de Marte pode estar entre 16°15′ de Peixes e 16°17′ de Peixes; a leitura usa a posição calculada para o horário informado (16°16′ de Peixes).)

Vênus na casa 7 é associada à importância das parcerias: o encontro com o outro pode ser um campo central de aprendizado e prazer.

Na tradição, o trígono entre Marte e Plutão sugere que a ação e a intensidade fluem com naturalidade, como um talento que se exerce com facilidade.

Vênus em aspecto tenso com Urano é tradicionalmente ligada à tensão entre proximidade e liberdade: relações que acolham a sua independência podem ser mais sustentáveis.

Vênus em aspecto tenso com Júpiter é associada a grandes expectativas afetivas: o desafio pode ser equilibrar generosidade e medida nos vínculos.

**Síntese.** Juntos, esses temas compõem uma leitura simbólica dos vínculos, como ponto de partida para reflexão e não como regra.

**Para refletir.** O que faz você se sentir à vontade em um vínculo? / Que equilíbrio entre proximidade e espaço próprio parece bom para você hoje?

**Limites.**

- Casas e cúspides não consideradas: com horário aproximado, só entram posições em casas que não mudam dentro da janela.

##### 5. Seus talentos e desafios

Este capítulo reúne o que a tradição associa a recursos que podem ser cultivados e a desafios que pedem amadurecimento.

Com Saturno em Capricórnio, a tradição associa a estrutura, os limites e o amadurecimento a temas como responsabilidade, ambição e paciência.

Com Júpiter em Câncer, a tradição associa a expansão, a confiança e a busca de sentido a temas como cuidado, memória afetiva e proteção.

Júpiter na casa 10 é tradicionalmente ligado à expansão pela vocação: a vida profissional pode ser um campo de crescimento e de sentido.

A ausência de corpos em signos de Ar é lida como um convite a dar palavras ao que sente e a buscar outras perspectivas.

Na tradição, a oposição entre Júpiter e Urano sugere que a expansão e a liberdade puxam em direções opostas e pedem integração e equilíbrio.

Na tradição, o sextil entre Marte e Netuno sugere que a ação e a imaginação se apoiam e abrem oportunidades quando há iniciativa.

**Síntese.** Em conjunto, talentos e desafios aparecem aqui como possibilidades simbólicas, que ganham forma com escolhas e experiência.

**Para refletir.** Que habilidade você exerce com naturalidade e poderia valorizar mais? / Qual desafio recente trouxe aprendizado inesperado?

**Limites.**

- Casas e cúspides não consideradas: com horário aproximado, só entram posições em casas que não mudam dentro da janela.
- Casas que mudam dentro da janela de horário (não interpretadas): Saturno (casas 4, 5).
- Não interpretado por incerteza do horário: Meio do Céu em Gêmeos no centro da janela (28°30′), variando 13,8° na janela.

#### Parte II — Suas Mãos (ready)

_As características descritas foram observadas numa fotografia e podem não corresponder exatamente à sua mão. Os significados vêm da tradição simbólica da quiromancia — não são fatos científicos, diagnósticos nem previsões. A linha da vida, em particular, é lida como um retrato do modo de viver._

> Leitura simulada: nenhuma inteligência artificial observou uma foto real.

> Leitura parcial: algumas características não puderam ser observadas na foto. Cada capítulo indica o que ficou de fora.

##### 6. As características das suas mãos

Este capítulo parte do formato da sua mão, como ele apareceu na foto, e do que a tradição da quiromancia associa a ele.

- Observado: Palma de formato mais quadrado: a largura é parecida com o comprimento.

Na quiromancia, a palma de formato mais quadrado costuma ser associada a um jeito prático de estar no mundo: gosto por estrutura, constância e soluções concretas.

**Síntese.** É uma leitura simbólica sobre o formato da palma, para comparar com o que você reconhece em si.

**Para refletir.** Em que situações do seu dia a dia você reconhece essa leitura, e em quais não?

**Limites.**

- A análise da foto apontou reflexos; algumas características podem não ter sido observadas.
- O comprimento dos dedos não ficou visível na foto e não foi interpretado.
- O formato da palma e o comprimento dos dedos são proporções estimadas a olho na foto; ângulo, perspectiva e enquadramento podem alterá-las.

##### 7. As linhas da sua palma

Aqui estão as linhas da palma que puderam ser observadas na foto e as leituras simbólicas que a tradição da quiromancia faz delas.

- Observado: Linha do coração longa, chegando à área sob o dedo indicador.

Uma linha do coração longa costuma ser associada, na quiromancia, a um afeto expansivo e generoso, que se envolve com intensidade.

- Observado: Linha do coração de traçado mais reto.

Quando a linha do coração segue mais reta, a tradição a relaciona a um modo mais racional e contido de lidar com os afetos.
(nota: A linha do coração ficou só parcialmente visível na foto; leia essa interpretação com reserva.)

- Observado: Linha da cabeça de comprimento médio, chegando à área sob o dedo anelar.

Uma linha da cabeça de comprimento médio é associada pela tradição a um pensamento que equilibra praticidade e reflexão.

- Observado: Linha da cabeça começando unida à linha da vida.

Quando a linha da cabeça começa unida à da vida, a quiromancia costuma associar isso à cautela: você pode preferir avaliar bem antes de se lançar.

- Observado: Linha da vida em arco amplo, avançando para o centro da palma.

Na quiromancia, um arco amplo da linha da vida é associado ao entusiasmo e à abertura para novas experiências.

**Síntese.** Juntas, as leituras sobre a linha do coração, a linha da cabeça e a linha da vida formam um retrato simbólico para comparar com o que você reconhece em si.

✎ **[alterado na 04E.2B]** **Para refletir.** Qual dessas leituras conversa mais com o que você vive hoje? / Em que situações você se reconhece nessas leituras, e em quais não?

> Antes: **Para refletir.** Entre a linha do coração, a linha da cabeça e a linha da vida, qual leitura conversa mais com o que você vive hoje? / Em que situações você se reconhece nessas leituras, e em quais não?

**Limites.**

- A análise da foto apontou reflexos; algumas características podem não ter sido observadas.
- A inclinação da linha da cabeça não ficou visível na foto e não foi interpretada.
- A linha do destino não foi identificada com clareza na foto e não foi interpretada; isso não quer dizer que ela não exista.

#### Parte III — Sua Jornada (ready)

##### 8. Conexões simbólicas entre céu e mãos

✎ **[alterado na 04E.2B]** Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, a semelhança é de linguagem, não uma constatação sobre você.

> Antes: Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, trata-se de uma semelhança de linguagem, não de uma constatação sobre você; quando apontam para lados diferentes, a diferença fica à vista.

###### Expressão: abertura e reserva · Aproximação

- Nas mãos: linha do coração longa (cap. 7)
- No céu: Lua em Sagitário (cap. 2)

As duas leituras usam a imagem de uma expressão afetiva mais aberta.

**Síntese.** As aproximações acima mostram onde as duas tradições usam palavras parecidas. Elas servem como ponto de partida para observar a sua experiência, não como conclusão.

**Limites.**

- Semelhanças entre tradições simbólicas não comprovam traços de personalidade, e diferenças entre elas não indicam erro de nenhuma das leituras.

**Limitações desta análise (recolhida).**

- O traçado da linha do coração ficou só parcialmente visível na foto e por isso não sustenta nenhuma comparação.
- O formato da palma, o comprimento da linha da cabeça e o arco da linha da vida não entram nestas comparações: são características que ainda não podem ser classificadas com segurança a partir de uma foto.
- Os demais traços e posições tratam de outros temas e por isso não são comparados neste capítulo.
- Esta comparação usa uma leitura das mãos simulada, do ambiente interno de testes.

##### 9. Seu guia pessoal de reflexão

Este guia transforma alguns temas da sua leitura em perguntas para pensar com calma. Os temas vêm dos capítulos 1, 2 e 7; as respostas, e a decisão sobre o que faz sentido para você, são suas.

###### Expressão: abertura e reserva

- A partir de: Lua em Sagitário (cap. 2); linha do coração longa (cap. 7)

De que formas você costuma demonstrar afeto, e quais delas parecem mais naturais para você?

###### Ritmo: impulso e cautela

- A partir de: linha da cabeça começando unida à da vida (cap. 7)

Que decisões você costuma tomar com calma, e quais gostaria de tomar com menos espera?

###### Identidade

- A partir de: Sol em Touro (cap. 1)

Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?

###### Prática opcional

Se quiser, repare ao longo de uma semana em quando você fala do que sente e quando prefere guardar. Anotar uma ou duas situações já basta.

###### Para fechar

Pensando na leitura como um todo: com o que você concorda, com o que discorda — e o que prefere deixar em aberto por enquanto?

**Limites.**

- Este guia é um convite à reflexão a partir de tradições simbólicas. Ele não prevê acontecimentos nem substitui orientação profissional, e nenhuma pergunta aqui tem resposta certa.
