# Fase 02F — Geração de interpretações com IA

Integração de um modelo de linguagem ao motor editorial da 02E para redigir
os **cinco capítulos astrológicos**. A IA só articula o que o motor já
selecionou, e toda resposta passa pelo validador. Quando a resposta falha, o
capítulo usa o texto determinístico da biblioteca, identificado como tal.
**Nenhuma rota pública chama a IA.** Nenhuma chamada paga foi feita nesta fase.

## 1. Auditoria inicial

- Commit `236a6fa` (Fase 02E) confirmado; árvore limpa e idêntica a
  `origin/claude/upbeat-pasteur-x5y1k2`; nenhuma alteração pendente.
- Biblioteca, fatos, capítulos e validador da 02E preservados. O validador
  foi **ampliado** (mesma API `validateAiOutput`); o único teste da 02E
  ajustado passou a esperar também `UNSUPPORTED_SIGN` em "Sol em Leão".
- Motor astrológico (02B–02D) não foi alterado.

## 2. Avaliação de provedores

Fontes oficiais da Anthropic consultadas em 31/10/2026:
[preços](https://platform.claude.com/docs/en/about-claude/pricing),
[retenção de dados](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention),
[saídas estruturadas](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).
**Os domínios oficiais da OpenAI (`openai.com`, `platform.openai.com`,
`developers.openai.com`) estão bloqueados na rede desta sessão**; os dados da
OpenAI abaixo vêm de fontes secundárias e estão marcados como **não
verificados**.

| Critério                | Anthropic (Claude)                                                                                                                     | OpenAI (GPT)                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Preço (USD / 1M tokens) | Opus 5.5: 4 / 20 · **Sonnet 5.5: 2 / 10** · Haiku 5.5: 0,10 / 0,50 (oficial)                                                           | Não verificado. Fontes secundárias divergem: ex. GPT-5.4 2,50 / 15; "GPT-5.6 Terra" 2 / 12; "GPT-5.6 Luna" 0,20 / 1,20 |
| Saída estruturada       | `output_config.format` com JSON Schema (sem `minLength`/`maxLength`; `minItems` só 0/1) — conferido na doc                             | JSON Schema estrito (conhecido; não reconferido na doc oficial nesta sessão)                                           |
| Retenção e treinamento  | Dados da API não usados para treino sem permissão expressa; ZDR disponível; com saída estruturada só o schema fica em cache (até 24 h) | Segundo a própria doc (via busca): sem treino por padrão; logs de abuso por até 30 dias; ZDR sob aprovação             |
| Controle de custo       | `max_tokens`, `effort` (low/medium/high), cache de prompt (leitura a 5% do preço no Sonnet 5.5), lote com 50% de desconto              | `max_output_tokens`, esforço de raciocínio, cache automático, lote 50% (fontes secundárias)                            |
| Integração Next.js      | SDK TypeScript oficial (`@anthropic-ai/sdk` 1.3.0), erros tipados, Node no servidor                                                    | SDK TypeScript oficial                                                                                                 |
| Confiabilidade/latência | Não medidas (sem chamadas pagas). Recusas por classificador tratadas com `fallbacks: "default"`                                        | Não medidas                                                                                                            |
| Qualidade em pt-BR      | **Não medida** nesta fase                                                                                                              | **Não medida** nesta fase                                                                                              |

### Recomendação: Claude Sonnet 5.5 (`claude-sonnet-5-5`), esforço `medium`

- **Econômica:** mesmo no pior cenário estimado (com uma nova tentativa por
  capítulo), o custo fica em torno de 3% do preço de R$ 39,90 (§ 9).
  Opus 5.5 custa o dobro por token sem ganho medido para textos curtos.
  Haiku 5.5 custa cerca de 20 vezes menos e é o **candidato a teste A/B**:
  se a avaliação paga mostrar qualidade equivalente em português, ele passa a
  ser a melhor escolha.
- **Técnica:** saída estruturada com schema por capítulo (os `itemIds` ficam
  restritos aos itens daquele capítulo), cache do system prompt, erros tipados
  no SDK e preços oficiais verificáveis. Com saída estruturada, a API não
  guarda prompts nem respostas; só o schema fica em cache, e ele contém
  apenas ids de itens.
- **O que não decidiu a escolha:** o fato de o desenvolvimento usar Claude
  Code. A interface `AiProvider` é independente do fornecedor; um adaptador
  OpenAI tem ~100 linhas. Uma comparação justa de qualidade exige rodar a
  avaliação paga nos dois provedores (e liberar os domínios da OpenAI na rede).
- O modelo é configurável (`SIDERA_AI_MODEL`); a escolha final depende da
  sua aprovação e da avaliação paga.

## 3. Arquitetura

```
ChartView → extractFacts → seleção por capítulo (02E: InterpretationReport)
   └─ generateReport(report, provider)                     ai/generate.ts
        ├─ para cada capítulo, em paralelo:
        │    buildChapterRequest (system estável + JSON do capítulo + schema)   ai/prompt.ts
        │    provider.generate  ── AnthropicProvider | MockProvider            ai/*-provider.ts
        │    stop_reason (recusa / truncado) → JSON.parse → validateChapterDraft  ai/validate.ts
        │    reprovado? nova tentativa com a lista de problemas (máx. 2; teto 3)
        │    ainda reprovado? libraryDraft (source: "library", fallbackReason)  ai/library-chapter.ts
        └─ GeneratedReport + métricas (tokens, latência, custo, tentativas)     ai/pricing.ts
```

- **Seleção do provedor** (`ai/config.ts`, `server-only`): a API real só é
  usada com `SIDERA_AI_ENABLED=1`, `SIDERA_AI_PROVIDER=anthropic` e
  `ANTHROPIC_API_KEY` no ambiente do servidor; caso contrário, provedor
  simulado. Chaves nunca usam `NEXT_PUBLIC_` e não estão no repositório
  (`.env*` no `.gitignore`; `.env.example` só com nomes).
- **Dados enviados:** por capítulo, título, nota sobre a precisão do horário,
  itens (id, certeza, observação calculada, interpretação, ressalva),
  limitações, tensões e os títulos dos outros capítulos. **Não vão:** nome,
  e-mail, foto, data, hora, local, coordenadas, fuso, instante UTC, dia
  juliano (garantido por teste).
- **Rastreabilidade:** cada seção gerada guarda `itemIds` (02E) e `factIds`
  (derivados pelo servidor, não pelo modelo) → `Fact.source` → `ChartView`.
- **Por capítulo, e não um relatório inteiro por chamada:** menor latência
  (paralelo) e uma falha não derruba os outros capítulos. A repetição entre
  capítulos é medida (`crossChapterRepetition`) na avaliação.

## 4. Contratos

**Entrada do modelo** (`chapterInput`): `{ chapter {id, number, title},
timePrecision, items [{id, certainty, observation, interpretation, caveat}],
limitations, tensions [{itemIds, note}], otherChapters }`.

**Saída do modelo** (`ChapterDraft`, via JSON Schema):
`{ introduction, sections [{ text, itemIds }], synthesis, reflectionQuestions }`.

**Capítulo final** (`GeneratedChapter`): `id`, `number`, `title` (fixo),
`introduction`, `sections [{ text, itemIds, factIds }]`, `synthesis`,
`reflectionQuestions`, `limitations` (copiadas do motor, nunca do modelo),
`source: "ai" | "library"`, `fallbackReason`.

**Relatório** (`GeneratedReport`): `version` (`02e.1+02f.1`), `disclaimer`,
`basis`, `chapters`, `metrics`.

## 5. Validação e segurança (`ai/validate.ts`)

| Verificação                       | Como                                                                                                                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Formato                           | Objeto, campos obrigatórios, 1–3 perguntas terminadas em "?", limites de tamanho (introdução 450, seção 900, síntese 550)                                                                                                                  |
| Capítulos e IDs                   | `itemIds` só do capítulo (também restritos no schema); **todo item deve ser usado** (`MISSING_ITEM`)                                                                                                                                       |
| Posições inventadas/parafraseadas | "<corpo> em <signo>"; signo citado sozinho; adjetivos ("leonino", "taurina"); pontos (planetas, Ascendente, MC, Descendente, Fundo do Céu); casas em algarismo, por extenso ou ordinal ("oitava casa"); aspectos (inclusive plural); graus |
| Limitações de horário             | Ponto ou casa ausente só pode aparecer em frase que explica a limitação ("sem o horário… não pôde ser calculado")                                                                                                                          |
| Incertezas omitidas               | Seção que cita item incerto precisa manter a ressalva                                                                                                                                                                                      |
| Repetição excessiva               | Frase idêntica; mesma sequência de 6 palavras 3+ vezes; 4+ frases com a mesma abertura                                                                                                                                                     |
| Linguagem determinista            | "certamente", "comprovado", "cientificamente", "determina", "inevitável", "você vai", "seu destino"…                                                                                                                                       |
| Saúde, finanças, relacionamentos  | "tratamento", "terapia", "medicamento", "doença", "investir", "dívida", "divórcio", "terminar o relacionamento", "alma gêmea"…                                                                                                             |
| Falhas da API                     | Timeout, 429, 5xx, rede → nova tentativa; credencial ou requisição inválida → sem nova tentativa; recusa e truncamento tratados                                                                                                            |

**Limite assumido:** a validação é léxica. Ela barra o que sabemos detectar,
mas **não prova correção semântica** (ex.: uma interpretação distorcida sem
citar posição nenhuma passa). Por isso a avaliação humana dos exemplos pagos
continua necessária.

**Tentativas:** no máximo 2 por capítulo (configurável, teto rígido de 3);
o SDK roda com `maxRetries: 0` para que o limite seja único.

## 6. Exemplos dos cinco capítulos

Mapa fictício: 12/05/1990, São Paulo. **Os três exemplos foram gerados pela biblioteca determinística** (`libraryReport`), não pela IA. Fonte: `src/features/interpretation/ai/__fixtures__/`.

### Exemplo 1 — horário exato (14:30) · **gerado pela BIBLIOTECA determinística (não é IA)**

#### 1. Sua identidade astrológica

_Este capítulo reúne os elementos do mapa que a tradição astrológica associa ao núcleo da identidade e à forma de se colocar no mundo._

- Com o Sol em Touro, a identidade é tradicionalmente ligada à construção paciente: você pode se sentir mais em casa quando cultiva o que é concreto, belo e duradouro. <sub>itens: `body-sign:sun`</sub>
- Com o Ascendente em Virgem, a aproximação ao mundo é tradicionalmente analítica e cuidadosa: você pode perceber detalhes e oferecer ajuda prática. <sub>itens: `angle-sign:asc`</sub>
- O Sol na casa 8 é tradicionalmente associado a buscar identidade nas experiências de profundidade: crises, intimidade e transformações podem ser momentos de autodescoberta. <sub>itens: `body-house:sun`</sub>
- Com o Ascendente em Virgem, o regente tradicional do mapa é Mercúrio. A tradição sugere que o modo de pensar, aprender e se comunicar — aqui em Touro, na casa 8 — ganha peso especial na condução da sua trajetória. <sub>itens: `chart-ruler:mercury`</sub>
- Na tradição, o trígono entre o Sol e o Ascendente sugere que a identidade e a forma de se apresentar fluem com naturalidade, como um talento que se exerce com facilidade. <sub>itens: `aspect:asc-sun:trine`</sub>
- Muitos corpos em signos de Terra são associados a senso prático e constância: construir com as próprias mãos pode trazer satisfação. <sub>itens: `element-dominant:earth`</sub>

**Síntese.** Em conjunto, esses elementos descrevem facetas simbólicas da identidade; vale observar quais delas fazem sentido na sua experiência.

**Para refletir.** Em que situações você se sente mais você? Qual dessas descrições combina menos com a sua experiência, e por quê?

#### 2. Seu mundo emocional

_Aqui estão os elementos que a tradição liga às necessidades emocionais, ao acolhimento e ao modo de reagir ao que se sente._

- A Lua em Sagitário, na tradição, busca sentido e movimento: otimismo, aventura e espaço para explorar podem renovar o seu ânimo. <sub>itens: `body-sign:moon`</sub>
- A Lua na casa 3 é associada a emoções que circulam pela comunicação: conversas, escrita e o convívio com o entorno próximo podem acalmar você. <sub>itens: `body-house:moon`</sub>
- Na tradição, a quadratura entre a Lua e o Ascendente sugere que as emoções e a forma de se apresentar geram atrito, um desafio que costuma impulsionar crescimento. <sub>itens: `aspect:asc-moon:square`</sub>
- Na tradição, a oposição entre a Lua e o Meio do Céu sugere que as emoções e a vocação puxam em direções opostas e pedem integração e equilíbrio. <sub>itens: `aspect:mc-moon:opposition`</sub>
- Com a cúspide da casa 4 (Fundo do Céu) em Sagitário, a tradição associa as raízes, o lar e a vida íntima a temas como busca de sentido, entusiasmo e amplitude de horizontes. <sub>itens: `cusp-sign:4`</sub>

**Síntese.** Juntos, esses temas oferecem uma leitura simbólica da vida emocional, para ser confrontada com o que você reconhece em si.

**Para refletir.** O que costuma trazer segurança emocional no seu dia a dia? Como você percebe quando precisa de acolhimento?

#### 3. Sua mente e comunicação

_Este capítulo trata do que a tradição associa ao jeito de pensar, aprender e se comunicar._

- Mercúrio em Touro é tradicionalmente ligado a um raciocínio prático e constante: você pode preferir ideias testadas e aprender no seu próprio ritmo. <sub>itens: `body-sign:mercury`</sub>
- Mercúrio na casa 8 é tradicionalmente ligado a uma mente que investiga: temas profundos, psicologia e o que está por trás das aparências podem atrair a sua atenção. <sub>itens: `body-house:mercury`</sub>
- Mercúrio retrógrado no nascimento é associado, na tradição, a um pensamento que revisa e reelabora: você pode preferir refletir antes de falar e voltar às ideias para aprofundá-las. <sub>itens: `body-retrograde:mercury`</sub>
- Mercúrio em aspecto harmonioso com Júpiter é associado a uma mente que gosta de ampliar horizontes: aprender e ensinar podem ser atividades naturais para você. <sub>itens: `aspect:jupiter-mercury:sextile`</sub>
- Com a cúspide da casa 3 em Sagitário, a tradição associa a comunicação, o aprendizado e o entorno próximo a temas como busca de sentido, entusiasmo e amplitude de horizontes. <sub>itens: `cusp-sign:3`</sub>

**Síntese.** Em conjunto, esses elementos sugerem um estilo de pensar e se comunicar que você pode reconhecer, ajustar ou questionar.

**Para refletir.** Em que contextos você aprende com mais prazer? Como você prefere organizar uma ideia antes de compartilhá-la?

#### 4. Seus relacionamentos e vínculos

_Aqui aparecem os elementos que a tradição relaciona aos afetos, ao desejo e à forma de construir vínculos._

- Vênus em Áries é associada a um afeto espontâneo e entusiasmado: você pode se encantar com a conquista e com relações que tenham vitalidade. <sub>itens: `body-sign:venus`</sub>
- Com Marte em Peixes, a tradição associa a iniciativa, o desejo e a maneira de agir a temas como sensibilidade, imaginação e empatia. <sub>itens: `body-sign:mars`</sub>
- Com a cúspide da casa 7 (Descendente) em Peixes, a tradição associa as parcerias e os encontros com o outro a temas como sensibilidade, imaginação e empatia. <sub>itens: `cusp-sign:7`</sub>
- Vênus na casa 7 é associada à importância das parcerias: o encontro com o outro pode ser um campo central de aprendizado e prazer. <sub>itens: `body-house:venus`</sub>
- Na tradição, o trígono entre Marte e Plutão sugere que a ação e a intensidade fluem com naturalidade, como um talento que se exerce com facilidade. <sub>itens: `aspect:mars-pluto:trine`</sub>
- Vênus em aspecto tenso com Urano é tradicionalmente ligada à tensão entre proximidade e liberdade: relações que acolham a sua independência podem ser mais sustentáveis. <sub>itens: `aspect:uranus-venus:square`</sub>

**Síntese.** Juntos, esses temas compõem uma leitura simbólica dos vínculos, como ponto de partida para reflexão e não como regra.

**Para refletir.** O que faz você se sentir à vontade em um vínculo? Que equilíbrio entre proximidade e espaço próprio parece bom para você hoje?

#### 5. Seus talentos e desafios

_Este capítulo reúne o que a tradição associa a recursos que podem ser cultivados e a desafios que pedem amadurecimento._

- Com Saturno em Capricórnio, a tradição associa a estrutura, os limites e o amadurecimento a temas como responsabilidade, ambição e paciência. <sub>itens: `body-sign:saturn`</sub>
- Com Júpiter em Câncer, a tradição associa a expansão, a confiança e a busca de sentido a temas como cuidado, memória afetiva e proteção. <sub>itens: `body-sign:jupiter`</sub>
- Júpiter na casa 10 é tradicionalmente ligado à expansão pela vocação: a vida profissional pode ser um campo de crescimento e de sentido. <sub>itens: `body-house:jupiter`</sub>
- Saturno na casa 5 é associado a levar a sério a autoexpressão: a criatividade pode amadurecer com disciplina e ganhar consistência com o tempo. <sub>itens: `body-house:saturn`</sub>
- Com o Meio do Céu em Gêmeos, a tradição associa a vocação e a imagem pública a temas como curiosidade, versatilidade e troca de ideias. <sub>itens: `angle-sign:mc`</sub>
- A ausência de corpos em signos de Ar é lida como um convite a dar palavras ao que sente e a buscar outras perspectivas. <sub>itens: `element-absent:air`</sub>

**Síntese.** Em conjunto, talentos e desafios aparecem aqui como possibilidades simbólicas, que ganham forma com escolhas e experiência.

**Para refletir.** Que habilidade você exerce com naturalidade e poderia valorizar mais? Qual desafio recente trouxe aprendizado inesperado?

### Exemplo 2 — horário aproximado (14:30 ± 120 min) · **gerado pela BIBLIOTECA determinística (não é IA)**

#### 1. Sua identidade astrológica

_Este capítulo reúne os elementos do mapa que a tradição astrológica associa ao núcleo da identidade e à forma de se colocar no mundo._

- Com o Sol em Touro, a identidade é tradicionalmente ligada à construção paciente: você pode se sentir mais em casa quando cultiva o que é concreto, belo e duradouro. <sub>itens: `body-sign:sun`</sub>
- Muitos corpos em signos de Terra são associados a senso prático e constância: construir com as próprias mãos pode trazer satisfação. <sub>itens: `element-dominant:earth`</sub>
- Sol em aspecto harmonioso com Saturno é associado à capacidade de dar forma às metas: disciplina e paciência podem trabalhar a favor da sua expressão. <sub>itens: `aspect:saturn-sun:trine`</sub>
- Sol em aspecto harmonioso com Marte é associado a vontade e ação bem articuladas: você pode transformar intenção em iniciativa com relativa facilidade. <sub>itens: `aspect:mars-sun:sextile`</sub>
- Sol em aspecto tenso com Plutão é associado, na tradição, a experiências de poder e transformação: crises podem se tornar oportunidades de renovação pessoal. <sub>itens: `aspect:pluto-sun:opposition`</sub>

**Síntese.** Em conjunto, esses elementos descrevem facetas simbólicas da identidade; vale observar quais delas fazem sentido na sua experiência.

**Para refletir.** Em que situações você se sente mais você? Qual dessas descrições combina menos com a sua experiência, e por quê?

**Limitações.** Regente do mapa não considerado: o signo do Ascendente varia dentro da janela de horário. Casas e cúspides não consideradas: com horário aproximado, só entram posições em casas que não mudam dentro da janela. Casas que mudam dentro da janela de horário (não interpretadas): o Sol (casas 7, 8, 9). Não interpretado por incerteza do horário: Ascendente em Virgem no centro da janela (24°45′), variando 77,8° na janela.

#### 2. Seu mundo emocional

_Aqui estão os elementos que a tradição liga às necessidades emocionais, ao acolhimento e ao modo de reagir ao que se sente._

- A Lua em Sagitário, na tradição, busca sentido e movimento: otimismo, aventura e espaço para explorar podem renovar o seu ânimo. <sub>itens: `body-sign:moon`</sub>
- Lua em aspecto tenso com Marte é associada a reações emocionais intensas: reconhecer a irritação cedo pode ajudar você a transformá-la em ação construtiva. <sub>itens: `aspect:mars-moon:square`</sub>

**Síntese.** Juntos, esses temas oferecem uma leitura simbólica da vida emocional, para ser confrontada com o que você reconhece em si.

**Para refletir.** O que costuma trazer segurança emocional no seu dia a dia? Como você percebe quando precisa de acolhimento?

**Limitações.** Casas e cúspides não consideradas: com horário aproximado, só entram posições em casas que não mudam dentro da janela. Casas que mudam dentro da janela de horário (não interpretadas): a Lua (casas 2, 3, 4).

#### 3. Sua mente e comunicação

_Este capítulo trata do que a tradição associa ao jeito de pensar, aprender e se comunicar._

- Mercúrio em Touro é tradicionalmente ligado a um raciocínio prático e constante: você pode preferir ideias testadas e aprender no seu próprio ritmo. <sub>itens: `body-sign:mercury`</sub>
- Mercúrio retrógrado no nascimento é associado, na tradição, a um pensamento que revisa e reelabora: você pode preferir refletir antes de falar e voltar às ideias para aprofundá-las. <sub>itens: `body-retrograde:mercury`</sub>
- Mercúrio em aspecto harmonioso com Júpiter é associado a uma mente que gosta de ampliar horizontes: aprender e ensinar podem ser atividades naturais para você. <sub>itens: `aspect:jupiter-mercury:sextile`</sub>
- Na tradição, o trígono entre Mercúrio e Urano sugere que a mente e a liberdade fluem com naturalidade, como um talento que se exerce com facilidade. <sub>itens: `aspect:mercury-uranus:trine`</sub>

**Síntese.** Em conjunto, esses elementos sugerem um estilo de pensar e se comunicar que você pode reconhecer, ajustar ou questionar.

**Para refletir.** Em que contextos você aprende com mais prazer? Como você prefere organizar uma ideia antes de compartilhá-la?

**Limitações.** Casas e cúspides não consideradas: com horário aproximado, só entram posições em casas que não mudam dentro da janela. Casas que mudam dentro da janela de horário (não interpretadas): Mercúrio (casas 7, 8, 9).

#### 4. Seus relacionamentos e vínculos

_Aqui aparecem os elementos que a tradição relaciona aos afetos, ao desejo e à forma de construir vínculos._

- Vênus em Áries é associada a um afeto espontâneo e entusiasmado: você pode se encantar com a conquista e com relações que tenham vitalidade. <sub>itens: `body-sign:venus`</sub>
- Com Marte em Peixes, a tradição associa a iniciativa, o desejo e a maneira de agir a temas como sensibilidade, imaginação e empatia. <sub>itens: `body-sign:mars`</sub>
- Na tradição, o trígono entre Marte e Plutão sugere que a ação e a intensidade fluem com naturalidade, como um talento que se exerce com facilidade. <sub>itens: `aspect:mars-pluto:trine`</sub>
- Vênus em aspecto tenso com Urano é tradicionalmente ligada à tensão entre proximidade e liberdade: relações que acolham a sua independência podem ser mais sustentáveis. <sub>itens: `aspect:uranus-venus:square`</sub>
- Vênus em aspecto tenso com Júpiter é associada a grandes expectativas afetivas: o desafio pode ser equilibrar generosidade e medida nos vínculos. <sub>itens: `aspect:jupiter-venus:square`</sub>
- Na tradição, o sextil entre Marte e Netuno sugere que a ação e a imaginação se apoiam e abrem oportunidades quando há iniciativa. <sub>itens: `aspect:mars-neptune:sextile`</sub>

**Síntese.** Juntos, esses temas compõem uma leitura simbólica dos vínculos, como ponto de partida para reflexão e não como regra.

**Para refletir.** O que faz você se sentir à vontade em um vínculo? Que equilíbrio entre proximidade e espaço próprio parece bom para você hoje?

**Limitações.** Casas e cúspides não consideradas: com horário aproximado, só entram posições em casas que não mudam dentro da janela. Casas que mudam dentro da janela de horário (não interpretadas): Vênus (casas 6, 7, 8); Marte (casas 5, 6, 7).

#### 5. Seus talentos e desafios

_Este capítulo reúne o que a tradição associa a recursos que podem ser cultivados e a desafios que pedem amadurecimento._

- Com Saturno em Capricórnio, a tradição associa a estrutura, os limites e o amadurecimento a temas como responsabilidade, ambição e paciência. <sub>itens: `body-sign:saturn`</sub>
- Com Júpiter em Câncer, a tradição associa a expansão, a confiança e a busca de sentido a temas como cuidado, memória afetiva e proteção. <sub>itens: `body-sign:jupiter`</sub>
- A ausência de corpos em signos de Ar é lida como um convite a dar palavras ao que sente e a buscar outras perspectivas. <sub>itens: `element-absent:air`</sub>
- Na tradição, a oposição entre Júpiter e Urano sugere que a expansão e a liberdade puxam em direções opostas e pedem integração e equilíbrio. <sub>itens: `aspect:jupiter-uranus:opposition`</sub>
- Na tradição, a quadratura entre Vênus e Netuno sugere que os afetos e a imaginação geram atrito, um desafio que costuma impulsionar crescimento. <sub>itens: `aspect:neptune-venus:square`</sub>
- Saturno retrógrado é tradicionalmente ligado a uma relação muito pessoal com regras e limites: a autoridade interna pode se construir aos poucos. <sub>itens: `body-retrograde:saturn`</sub>

**Síntese.** Em conjunto, talentos e desafios aparecem aqui como possibilidades simbólicas, que ganham forma com escolhas e experiência.

**Para refletir.** Que habilidade você exerce com naturalidade e poderia valorizar mais? Qual desafio recente trouxe aprendizado inesperado?

**Limitações.** Casas e cúspides não consideradas: com horário aproximado, só entram posições em casas que não mudam dentro da janela. Casas que mudam dentro da janela de horário (não interpretadas): Júpiter (casas 9, 10, 11); Saturno (casas 4, 5, 6); Urano (casas 3, 4, 5); Netuno (casas 3, 4, 5); Plutão (casas 1, 2, 3). Não interpretado por incerteza do horário: Meio do Céu em Gêmeos no centro da janela (26°24′), variando 56,0° na janela.

### Exemplo 3 — horário desconhecido · **gerado pela BIBLIOTECA determinística (não é IA)**

#### 1. Sua identidade astrológica

_Este capítulo reúne os elementos do mapa que a tradição astrológica associa ao núcleo da identidade e à forma de se colocar no mundo._

- Com o Sol em Touro, a identidade é tradicionalmente ligada à construção paciente: você pode se sentir mais em casa quando cultiva o que é concreto, belo e duradouro. <sub>itens: `body-sign:sun`</sub>
- Muitos corpos em signos de Terra são associados a senso prático e constância: construir com as próprias mãos pode trazer satisfação. <sub>itens: `element-dominant:earth`</sub>
- Sol em aspecto harmonioso com Saturno é associado à capacidade de dar forma às metas: disciplina e paciência podem trabalhar a favor da sua expressão. <sub>itens: `aspect:saturn-sun:trine`</sub>
- Sol em aspecto tenso com Plutão é associado, na tradição, a experiências de poder e transformação: crises podem se tornar oportunidades de renovação pessoal. <sub>itens: `aspect:pluto-sun:opposition`</sub>
- Sol em aspecto harmonioso com Marte é associado a vontade e ação bem articuladas: você pode transformar intenção em iniciativa com relativa facilidade. <sub>itens: `aspect:mars-sun:sextile`</sub>

**Síntese.** Em conjunto, esses elementos descrevem facetas simbólicas da identidade; vale observar quais delas fazem sentido na sua experiência.

**Para refletir.** Em que situações você se sente mais você? Qual dessas descrições combina menos com a sua experiência, e por quê?

**Limitações.** Ascendente e regente do mapa não considerados: o horário de nascimento é desconhecido. Casas não consideradas: sem horário de nascimento, elas não podem ser calculadas.

#### 2. Seu mundo emocional

_Aqui estão os elementos que a tradição liga às necessidades emocionais, ao acolhimento e ao modo de reagir ao que se sente._

- A Lua em Sagitário, na tradição, busca sentido e movimento: otimismo, aventura e espaço para explorar podem renovar o seu ânimo. <sub>itens: `body-sign:moon`</sub>
- Lua em aspecto tenso com Marte é associada a reações emocionais intensas: reconhecer a irritação cedo pode ajudar você a transformá-la em ação construtiva. Este aspecto não se mantém em toda a janela de horário informada; considere-o com reserva. <sub>itens: `aspect:mars-moon:square`</sub>
- Na tradição, o trígono entre a Lua e Vênus sugere que as emoções e os afetos fluem com naturalidade, como um talento que se exerce com facilidade. Vale a mesma reserva: este aspecto também depende do horário de nascimento. <sub>itens: `aspect:moon-venus:trine`</sub>

**Síntese.** Juntos, esses temas oferecem uma leitura simbólica da vida emocional, para ser confrontada com o que você reconhece em si.

**Para refletir.** O que costuma trazer segurança emocional no seu dia a dia? Como você percebe quando precisa de acolhimento?

**Limitações.** Casas não consideradas: sem horário de nascimento, elas não podem ser calculadas.

#### 3. Sua mente e comunicação

_Este capítulo trata do que a tradição associa ao jeito de pensar, aprender e se comunicar._

- Mercúrio em Touro é tradicionalmente ligado a um raciocínio prático e constante: você pode preferir ideias testadas e aprender no seu próprio ritmo. <sub>itens: `body-sign:mercury`</sub>
- Mercúrio retrógrado no nascimento é associado, na tradição, a um pensamento que revisa e reelabora: você pode preferir refletir antes de falar e voltar às ideias para aprofundá-las. <sub>itens: `body-retrograde:mercury`</sub>
- Mercúrio em aspecto harmonioso com Júpiter é associado a uma mente que gosta de ampliar horizontes: aprender e ensinar podem ser atividades naturais para você. <sub>itens: `aspect:jupiter-mercury:sextile`</sub>
- Na tradição, o trígono entre Mercúrio e Urano sugere que a mente e a liberdade fluem com naturalidade, como um talento que se exerce com facilidade. <sub>itens: `aspect:mercury-uranus:trine`</sub>

**Síntese.** Em conjunto, esses elementos sugerem um estilo de pensar e se comunicar que você pode reconhecer, ajustar ou questionar.

**Para refletir.** Em que contextos você aprende com mais prazer? Como você prefere organizar uma ideia antes de compartilhá-la?

**Limitações.** Casas não consideradas: sem horário de nascimento, elas não podem ser calculadas.

#### 4. Seus relacionamentos e vínculos

_Aqui aparecem os elementos que a tradição relaciona aos afetos, ao desejo e à forma de construir vínculos._

- Vênus em Áries é associada a um afeto espontâneo e entusiasmado: você pode se encantar com a conquista e com relações que tenham vitalidade. <sub>itens: `body-sign:venus`</sub>
- Com Marte em Peixes, a tradição associa a iniciativa, o desejo e a maneira de agir a temas como sensibilidade, imaginação e empatia. <sub>itens: `body-sign:mars`</sub>
- Na tradição, o trígono entre Marte e Plutão sugere que a ação e a intensidade fluem com naturalidade, como um talento que se exerce com facilidade. <sub>itens: `aspect:mars-pluto:trine`</sub>
- Vênus em aspecto tenso com Urano é tradicionalmente ligada à tensão entre proximidade e liberdade: relações que acolham a sua independência podem ser mais sustentáveis. <sub>itens: `aspect:uranus-venus:square`</sub>
- Vênus em aspecto tenso com Júpiter é associada a grandes expectativas afetivas: o desafio pode ser equilibrar generosidade e medida nos vínculos. <sub>itens: `aspect:jupiter-venus:square`</sub>
- Na tradição, o sextil entre Marte e Netuno sugere que a ação e a imaginação se apoiam e abrem oportunidades quando há iniciativa. <sub>itens: `aspect:mars-neptune:sextile`</sub>

**Síntese.** Juntos, esses temas compõem uma leitura simbólica dos vínculos, como ponto de partida para reflexão e não como regra.

**Para refletir.** O que faz você se sentir à vontade em um vínculo? Que equilíbrio entre proximidade e espaço próprio parece bom para você hoje?

**Limitações.** Casas não consideradas: sem horário de nascimento, elas não podem ser calculadas.

#### 5. Seus talentos e desafios

_Este capítulo reúne o que a tradição associa a recursos que podem ser cultivados e a desafios que pedem amadurecimento._

- Com Saturno em Capricórnio, a tradição associa a estrutura, os limites e o amadurecimento a temas como responsabilidade, ambição e paciência. <sub>itens: `body-sign:saturn`</sub>
- Com Júpiter em Câncer, a tradição associa a expansão, a confiança e a busca de sentido a temas como cuidado, memória afetiva e proteção. <sub>itens: `body-sign:jupiter`</sub>
- A ausência de corpos em signos de Ar é lida como um convite a dar palavras ao que sente e a buscar outras perspectivas. <sub>itens: `element-absent:air`</sub>
- Na tradição, a oposição entre Júpiter e Urano sugere que a expansão e a liberdade puxam em direções opostas e pedem integração e equilíbrio. <sub>itens: `aspect:jupiter-uranus:opposition`</sub>
- Saturno retrógrado é tradicionalmente ligado a uma relação muito pessoal com regras e limites: a autoridade interna pode se construir aos poucos. <sub>itens: `body-retrograde:saturn`</sub>
- Na tradição, a quadratura entre Vênus e Netuno sugere que os afetos e a imaginação geram atrito, um desafio que costuma impulsionar crescimento. <sub>itens: `aspect:neptune-venus:square`</sub>

**Síntese.** Em conjunto, talentos e desafios aparecem aqui como possibilidades simbólicas, que ganham forma com escolhas e experiência.

**Para refletir.** Que habilidade você exerce com naturalidade e poderia valorizar mais? Qual desafio recente trouxe aprendizado inesperado?

**Limitações.** Meio do Céu não considerado: o horário de nascimento é desconhecido. Casas não consideradas: sem horário de nascimento, elas não podem ser calculadas.

## 7. Avaliação de qualidade

### Exemplos produzidos pela IA

**Nenhum.** Não há credenciais configuradas e não houve autorização para
testes pagos, então nenhum texto deste documento foi gerado pela API. A
avaliação está pronta em `src/features/interpretation/ai/paid-eval.test.ts`:
gera os três relatórios com a API real e grava texto e métricas reais em
`docs/avaliacao-ia/`.

### Exemplos da biblioteca determinística (§ 6)

| Critério                  | Exato                                                                                 | Aproximado        | Desconhecido                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------- |
| Itens / autorais          | 28 / 16                                                                               | 23 / 15           | 24 / 15 (2 incertos)                                                                                |
| Palavras                  | 919                                                                                   | 743               | 797                                                                                                 |
| Personalização            | Média: cada frase é específica da posição, mas sem articulação entre elas             | Média             | Média                                                                                               |
| Coerência                 | Média-baixa: as seções são independentes; introdução e síntese são fixas por capítulo | Idem              | Idem                                                                                                |
| Clareza                   | Alta                                                                                  | Alta              | Alta                                                                                                |
| Profundidade              | Baixa-média (1–2 frases por item)                                                     | Baixa-média       | Baixa-média                                                                                         |
| Rastreabilidade           | Total (itemIds + factIds em cada seção)                                               | Total             | Total                                                                                               |
| Invenções                 | Nenhuma (passa no validador)                                                          | Nenhuma           | Nenhuma                                                                                             |
| Repetição entre capítulos | Nenhuma detectada                                                                     | Nenhuma detectada | **Detectada:** 3× "fluem com naturalidade, como um talento…"; 4 frases abertas por "Na tradição, o" |
| Português                 | Correto; os textos compostos soam mecânicos ("a tradição associa X a temas como Y")   | Idem              | Idem                                                                                                |

Conclusão: a biblioteca é **segura e rastreável**, mas pouco articulada. A
IA deve trazer ganho justamente em coerência, personalização e fluidez. Esse
ganho **ainda não foi medido**.

### Como avaliar os textos da IA (quando houver autorização)

1. Rodar `paid-eval` com Sonnet 5.5 e com Haiku 5.5 (opcionalmente Opus 5.5).
2. Registrar em cada caso: taxa de capítulos `ai` × `library`, motivos de
   reprovação, repetição entre capítulos e custo real.
3. Leitura humana com a mesma grade da tabela acima (nota 1–5 por critério),
   conferindo cada seção com os itens citados.

## 8. Instrumentação de custos

Cada tentativa registra modelo efetivo (`response.model`), tokens de entrada,
saída, leitura e escrita de cache (valores de `usage` devolvidos pela API),
latência, custo estimado (`ai/pricing.ts`, preços oficiais de 31/10/2026),
resultado (`ok`, `invalid_json`, `validation_failed`, `truncated`, `refusal`,
`error:*`) e os erros de validação. O total soma chamadas, novas tentativas,
falhas, tokens, custo, tempo de parede e capítulos `ai`/`library`.

## 9. Custos

### Medidos

**Nenhum consumo real** (sem chamadas pagas). Medido nesta fase apenas o
tamanho das requisições (caracteres, saída do código real):

| Caso         | System (5 chamadas) | Dados dos capítulos | Schemas | Texto da biblioteca (referência de saída) |
| ------------ | ------------------- | ------------------- | ------- | ----------------------------------------- |
| Exato        | 13 870              | 12 425              | 3 452   | 7 942                                     |
| Aproximado   | 13 870              | 13 191              | 3 404   | 6 876                                     |
| Desconhecido | 13 870              | 12 656              | 3 440   | 7 249                                     |

### Estimados (não medidos)

Premissas declaradas: ~3,5 caracteres por token em português; ~1 000 tokens
de sobrecarga do schema e do formato; **entrada ≈ 9 000 tokens por
relatório**, sem contar desconto de cache; saída de 4 000 tokens (só texto)
a 10 000 tokens (texto + raciocínio do modelo); pior caso = todas as
chamadas repetidas uma vez. Câmbio: PTAX de venda de 28/10/2026,
R$ 5,3420 (via fonte secundária; o site do Banco Central não foi consultado).

| Modelo     | Custo por relatório (USD) | Em R$       | % de R$ 39,90 | Pior caso (2 tentativas) |
| ---------- | ------------------------- | ----------- | ------------- | ------------------------ |
| Haiku 5.5  | 0,003 – 0,006             | 0,02 – 0,03 | < 0,1%        | ~0,2%                    |
| Sonnet 5.5 | 0,058 – 0,118             | 0,31 – 0,63 | 0,8% – 1,6%   | ~3,2%                    |
| Opus 5.5   | 0,116 – 0,236             | 0,62 – 1,26 | 1,6% – 3,2%   | ~6,3%                    |

Cálculo (Sonnet 5.5): 9 000 × US$ 2/M + 4 000 × US$ 10/M = US$ 0,058;
com 10 000 de saída, US$ 0,118. Não inclui impostos, taxas de pagamento nem
infraestrutura. A estimativa de OpenAI foi omitida porque os preços oficiais
não puderam ser verificados.

## 10. Testes

`src/features/interpretation/ai/generate.test.ts`: 39 testes (provedor
simulado e adaptador com `create` injetado, sem rede):

- **Privacidade:** as requisições dos três casos não contêm data, hora,
  local, coordenadas, fuso, dia juliano nem chaves pessoais; o system prompt
  é idêntico em todas as chamadas (cacheável).
- **Schema:** só usa recursos aceitos pela saída estruturada; `itemIds`
  restritos ao capítulo.
- **Geração:** resposta válida → 5 capítulos `ai` rastreáveis; posição
  inventada → nova tentativa com a lista de problemas → biblioteca; sucesso
  na 2ª tentativa; JSON inválido, truncamento, recusa e item omitido →
  biblioteca; API indisponível (2 tentativas); credencial inválida (1
  tentativa); teto de 3 tentativas; falha de um capítulo não afeta os outros.
- **Validador:** biblioteca sempre válida nos três casos; signos
  parafraseados; pontos, casas por extenso e aspectos sem origem; Ascendente
  sem horário só em frase de limitação; saúde, finanças, relacionamento e
  determinismo; ressalva obrigatória; repetição, tamanho, perguntas; itens de
  outro capítulo; formato inválido.
- **Adaptador Anthropic:** corpo da requisição (modelo, schema, cache,
  fallback, timeout), tradução de `stop_reason` e dos erros do SDK.
- **Configuração e custo:** só usa a API com as três condições; custo
  calculado a partir do consumo informado, inclusive em tentativas reprovadas.
- **Exemplos:** snapshot dos três relatórios da biblioteca em
  `ai/__fixtures__/library-report.{exact,approximate,unknown}.json`.

`ai/paid-eval.test.ts`: 3 testes **ignorados** sem `SIDERA_AI_PAID_TESTS=1`
e credenciais.

## 11. Limitações

- **Sem medição real:** qualidade, latência, taxa de reprovação e custo da
  IA não foram medidos; os custos acima são estimativas.
- **OpenAI não verificada:** domínios oficiais bloqueados nesta sessão.
- **Validação léxica:** não prova correção semântica; paráfrases fora dos
  padrões conhecidos podem passar.
- **Falsos positivos possíveis:** palavras como "oposição" ou "conjunção" em
  sentido comum serão recusadas quando não houver o aspecto; o capítulo cai
  na biblioteca (seguro, mas mais pobre).
- **Repetição entre capítulos** é medida, não bloqueada (cada capítulo é
  gerado isoladamente).
- **Biblioteca:** textos compostos repetem fórmulas (visto no exemplo sem
  horário).
- **Cache em paralelo:** os cinco capítulos partem juntos; o cache do system
  prompt pode não ser aproveitado na primeira geração.
- **Recusa com fallback do servidor:** o custo é estimado pelo modelo que
  respondeu (`response.model`); cobranças parciais do modelo que recusou não
  são separadas.
- Nada é exibido na interface; nenhuma rota pública chama a IA.

## 12. Como executar a avaliação paga (somente com autorização)

```bash
SIDERA_AI_PAID_TESTS=1 SIDERA_AI_ENABLED=1 SIDERA_AI_PROVIDER=anthropic ANTHROPIC_API_KEY=... npm test -- paid-eval
```

Para testar outro modelo, acrescente `SIDERA_AI_MODEL=claude-haiku-5-5`.

## 13. Arquivos

Novos: `src/features/interpretation/ai/{contract,prompt,generate,library-chapter,mock-provider,anthropic-provider,config,pricing}.ts`,
`ai/generate.test.ts`, `ai/paid-eval.test.ts`,
`ai/__fixtures__/library-report.*.json`,
`src/features/interpretation/test-support.ts`, este documento.

Alterados: `ai/validate.ts` (ampliado), `engine.test.ts` (1 expectativa),
`package.json`/`package-lock.json` (`@anthropic-ai/sdk`), `.env.example`,
`.prettierignore`, `docs/{ARCHITECTURE,DECISIONS}.md`, `README.md`.
