# Fase 04E.2A — Qualidade da experiência de leitura

Estado: **concluída, só interna.**

Esta etapa mudou só a apresentação. Ficaram iguais:

- as interpretações e os textos aprovados (a biblioteca continua `04d.2`);
- os motores astrológico e visual;
- a seleção dos temas e das perguntas do capítulo 9;
- a participação dos capítulos 5 e 6;
- as regras de privacidade.

Não houve chamada paga, foto real, checkout ou deploy.

## 1. Ajustes realizados

### 1.1 Capítulo 8: ressalvas em dois níveis

| Nível                                           | Conteúdo                                                                            | Apresentação                                                               |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Sempre visível                                  | R0: "Semelhanças entre tradições simbólicas não comprovam traços de personalidade…" | Parágrafo com ícone de informação, logo após a síntese                     |
| Seção expansível "Limitações desta análise (n)" | R-parcial, R-conf, R-hora, R-escopo e R-simulada, com o texto e a ordem aprovados   | `<details>` nativo, recolhido por padrão; `n` informa quantas ressalvas há |

Regras preservadas:

- **Indisponibilidade nunca fica recolhida.** As mensagens U1–U6 continuam
  no aviso "Esta parte não pôde ser lida", e o capítulo indisponível não
  tem seção expansível.
- **Nenhum conteúdo foi removido.** Cada ressalva técnica continua no
  documento, inclusive as de classificação visual (R-conf), de parcialidade
  (R-parcial) e de horário (R-hora). Um teste cobre todas as combinações.
- **Acessibilidade:** `<summary>` alcançável por Tab, com foco visível.
  Enter e Espaço expandem e recolhem. O Chromium expõe o estado
  (`expanded=false/true`) na árvore de acessibilidade lida pelos leitores
  de tela. A área de toque tem 44 px de altura.
- **Avisos repetidos:** a R-simulada saiu da leitura inicial do capítulo 8
  e passou para a seção expansível. Na leitura visível, a simulação é
  anunciada uma só vez, no aviso da Parte II. Na Parte III, o aviso continua
  a aparecer só no caso que a 04E.1 definiu.
- **Os demais capítulos não mudaram.** Os capítulos 1–7 e 9 continuam com a
  lista simples "Limites desta leitura". O campo novo, `limitationDetails`,
  é opcional e só o capítulo 8 o preenche.

Arquivos alterados:

- `src/features/report/chapter-article.tsx`;
- `src/features/report/journey-chapters/render.ts`;
- `docs/fase-04d-biblioteca-consolidada.md`, que agora registra a
  apresentação em dois níveis.

### 1.2 Âncoras sob o cabeçalho fixo

**Problema [comprovado]:** havia um vão excessivo, mas sem encobrimento.
Pelo sumário, o título dos capítulos 8 e 9 ficava 203 px abaixo do
cabeçalho fixo (título a 280 px; cabeçalho até 77 px). No iPhone SE, o
vão ocupava quase um terço da tela.

**Causa:** dois deslocamentos somados.

- O `<html>` já tem `scroll-padding-top: 7rem`.
- Cada âncora (capítulo, parte e sumário) tinha também `scroll-margin-top: 8rem`.

**Correção:** os `scroll-mt-32` das âncoras de `report-reader.tsx` foram
removidos. Agora o cartão do capítulo fica 35 px abaixo do cabeçalho, e o
título fica 74–75 px abaixo dele, nas três telas.

A 04E.1 havia registrado as âncoras como "sem defeito", porque verificava
só se o cabeçalho encobria o título. A 04E.2A passou a medir também o
espaço desperdiçado.

### 1.3 Português

Na verificação desta etapa não apareceu nenhum erro objetivo novo. Os
textos e regras aprovados ficaram intactos.

## 2. Comparação visual antes/depois

Capturas em `docs/capturas/fase-04e2a/`. Nas três primeiras, cada imagem
mostra, da esquerda para a direita: antes, depois (recolhido) e depois
(expandido).

- `04e2a-iphoneSE-cap8-parcial-antes-depois-aberta.webp`
- `04e2a-iphone13-cap8-parcial-antes-depois-aberta.webp`
- `04e2a-desktop-cap8-parcial-antes-depois-aberta.webp`
- `04e2a-iphoneSE-ancora-cap8-antes-depois.webp`: o sumário leva ao
  capítulo 8, antes e depois.
- `04e2a-iphone13-cap8-indisponivel-e-cap9.webp`: o capítulo 8 indisponível
  (U6), com a mensagem visível e nada recolhido, e o capítulo 9 completo.

Medidas do mesmo roteiro (`04e2a-leitura.mjs`) antes e depois. O cenário
"clara" é Recife com mão clara; o "parcial" é Recife com mão parcial.

| Medida                                   | Tela               | Antes   | Depois (recolhido) | Depois (expandido) |
| ---------------------------------------- | ------------------ | ------- | ------------------ | ------------------ |
| Palavras visíveis no capítulo 8          | todas, clara       | 244     | 175 (−28%)         | 244                |
| Palavras visíveis no capítulo 8          | todas, parcial     | 253     | 169 (−33%)         | 253                |
| Altura do capítulo 8                     | iPhone SE, parcial | 1490 px | 1306 px (−12%)     | 1665 px            |
| Altura do capítulo 8                     | iPhone SE, clara   | 1467 px | 1346 px (−8%)      | 1621 px            |
| Altura do capítulo 8                     | iPhone 13, parcial | 1216 px | 1087 px (−11%)     | 1368 px            |
| Altura do capítulo 8                     | desktop, parcial   | 759 px  | 721 px (−5%)       | 847 px             |
| Título após âncora, abaixo do cabeçalho  | todas              | 203 px  | 74–75 px           | —                  |
| Menções visíveis a "simulada" na leitura | todas              | 2       | 1                  | 2                  |

Leitura das medidas:

- **Texto visível:** com a seção recolhida, a leitura inicial ficou entre
  28% e 33% mais curta. Com ela expandida, todo o texto anterior volta.
- **Altura:** a altura expandida é um pouco maior que a de antes. O cartão
  da seção tem margem própria, e as ressalvas aparecem em lista com
  marcadores.

## 3. Resultado dos testes

Todos foram executados sobre a versão final.

| Verificação                                                                                                     | Resultado                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check` (typegen, tsc, eslint, Vitest)                                                                  | **1276 aprovados**, 42 ignorados (pagos e de avaliação)                                                                                        |
| Testes novos de componente (`chapter-article.test.tsx`)                                                         | 3/3: dois níveis, lista simples sem detalhes, indisponível nunca recolhido                                                                     |
| Testes novos da biblioteca (`journey-chapters.test.ts`)                                                         | Nas 84 combinações: R0 visível; ressalvas técnicas completas, sem duplicatas e na ordem; indisponível sem nada recolhido; capítulo 9 sem seção |
| `npm run build`                                                                                                 | Aprovado                                                                                                                                       |
| **04A** demonstração (`next start`)                                                                             | 45/45                                                                                                                                          |
| **04B**                                                                                                         | 28/28                                                                                                                                          |
| **04C** com motor / sem motor                                                                                   | 34/34 e 18/18                                                                                                                                  |
| **04D** com motor e mão clara / com motor e mão parcial / sem motor e mão clara / sem motor e foto insuficiente | 36/36, 12/12, 12/12 e 16/16                                                                                                                    |
| **D5**                                                                                                          | 17/17                                                                                                                                          |
| **04E.1** auditoria                                                                                             | 36/36                                                                                                                                          |
| **04E.2A**, mão clara (novo; desktop, iPhone 13, iPhone SE)                                                     | 48/48                                                                                                                                          |
| **04E.2A**, mão parcial                                                                                         | 45/45                                                                                                                                          |

**Navegador: 12 execuções, 347 resultados, 0 falhas.**

O roteiro `04e2a-leitura.mjs` verifica, em cada tela:

- R0 visível com a seção recolhida;
- seção única e recolhida;
- conteúdo técnico presente e fora da leitura inicial;
- estado na árvore de acessibilidade (recolhido e expandido);
- Tab até o resumo, com foco visível;
- Enter expande e Espaço recolhe;
- axe WCAG A/AA com a seção aberta e fechada;
- ausência de rolagem horizontal;
- âncoras dos capítulos 8 e 9;
- capítulo 8 indisponível com o motivo visível.

O roteiro 04D passou a ler o texto integral do capítulo para conferir a
R-simulada e a R-parcial, que agora ficam na seção recolhida.

**Privacidade:** nenhuma regra mudou. As pontes, o armazenamento e a
memória da jornada são os mesmos; a D5 deu 17/17 e a 04E.1 confirmou que
nada é salvo no navegador e que não há requisições a outros hosts.

**Não executados:**

- Firefox, Safari e aparelhos reais: só o Chromium do ambiente está
  disponível, e o mobile é emulado.
- Teste com leitores de tela reais (VoiceOver, TalkBack): o estado foi
  verificado na árvore de acessibilidade do Chromium, não com o leitor.

## 4. Contagem de verificações da 04E.1 (293 × 254)

**O número sustentado é 254.**

- **254** é a soma das linhas `OK` dos logs da regressão final da 04E.1.
  Eram 10 execuções, cada roteiro ou cenário rodado uma vez, no mesmo
  commit: 45 + 28 + 34 + 18 + 36 + 12 + 12 + 16 + 17 + 36.
- **293** apareceu numa mensagem intermediária da conversa, antes do
  relatório. Era um erro de soma: não sai de nenhum log, e a diferença (39)
  não corresponde a nenhuma execução.
- Nenhuma reexecução foi somada.

Cada "verificação" é um resultado de um roteiro: uma asserção num
cenário, numa tela. Por isso, a mesma asserção conta uma vez por tela e
por cenário (por exemplo, "axe sem violações" em desktop, iPhone 13 e
iPhone SE). As execuções de depuração e as reexecuções durante a auditoria
não entram na conta.

O relatório da 04E.1 (`fase-04e1-auditoria.md`) recebeu uma nota com essa
explicação.

## 5. Limitações remanescentes

- **Mobile emulado**, sem aparelho real, Firefox ou Safari. A semântica
  nativa de `<details>` é bem suportada, mas isso não foi verificado nesses
  navegadores.
- **Leitor de tela real não testado.** Só foi verificada a árvore de
  acessibilidade do Chromium.
- **Ressalvas pouco visíveis.** A seção recolhida reduz a chance de alguém
  ler as ressalvas técnicas [hipótese de risco, ainda não avaliada com
  pessoas]. A R0 e o contador "(n)" atenuam esse risco.
- **Capítulo 8 ainda longo no iPhone SE.** Recolhido, ele mede cerca de
  2 telas. A maior parte é a introdução aprovada (63 palavras) e a frase do
  tema. Isso é editorial e fica para a 04E.2B.
- **Introdução e R0 com ideias próximas.** A introdução já diz que
  semelhança "não [é] uma constatação sobre você", e a R0 repete essa ideia
  [oportunidade editorial]. Não foi mudado, porque são textos aprovados.

## 6. Recomendação para a 04E.2B (avaliação editorial)

Ordem sugerida, todas com aprovação de texto antes de implementar:

1. **Diversidade do capítulo 9.** A pergunta de identidade está quase
   sempre presente: há 12 combinações de perguntas nas 84. Decidir a regra
   de uso ou criar perguntas variadas.
2. **Capítulo 8:** fundir a ideia comum da introdução e da R0, para
   encurtar a leitura inicial sem perder o aviso essencial.
3. **Capítulos 5 e 6 na conclusão.** Decidir se Saturno e Júpiter ganham
   assunto. O capítulo 6 depende da revalidação visual, que é paga e só
   com autorização.
4. **Biblioteca 02E:** repetições nos capítulos 1–5 e "próprias mãos" (P6
   e P8 da 04E.1).
5. **Avaliação com leitoras e leitores reais** da seção recolhida: se as
   ressalvas técnicas são encontradas e compreendidas.
