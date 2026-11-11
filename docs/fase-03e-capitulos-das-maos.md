# Fase 03E — Capítulos 6 e 7 da leitura das mãos

Status: **concluída com provedores simulados** (11/11/2026). Nenhuma chamada
paga foi feita, nenhuma foto real foi enviada e os orçamentos não mudaram.
A integração final dos 9 capítulos fica para a Fase 04. A Fase 03F não
começa sem aprovação.

## 1. O que a fase entrega

As observações validadas (03C/03D) e os itens simbólicos da biblioteca 03C
viram dois capítulos completos:

- **Capítulo 6 — As características das suas mãos**: formato da palma,
  comprimento dos dedos e tipo de mão.
- **Capítulo 7 — As linhas da sua palma**: coração, cabeça, vida e destino
  (este último só quando nítido).

Cada capítulo tem introdução, seções, síntese, perguntas de reflexão e
limites. Em cada seção, o que foi **observado na foto** aparece num bloco
separado da **leitura simbólica**.

## 2. Arquitetura

```
foto preparada (03B)
  → POST /api/leitura-das-maos/analise (03D)
  → provedor de visão → validador da observação (03C)       vision/analyze.ts
  → motor 03C: fatos e itens simbólicos                      analysis/engine.ts
  → redação dos capítulos (IA validada ou biblioteca)        chapters/generate.ts
  → resultado do cliente + trilha de auditoria interna       chapters/presentation.ts
  → prévia: <ChapterArticle> para os capítulos 6 e 7         features/report/chapter-article.tsx
```

O pipeline de texto é **o mesmo da astrologia**, sem arquitetura paralela:

- `interpretation/ai/generate-core.ts` (novo): o laço genérico
  requisição → provedor → JSON → validador → reparo de referências na última
  tentativa → nova tentativa com correções. A astrologia
  (`interpretation/ai/generate.ts`) e a quiromancia usam o mesmo núcleo.
- Reaproveitados da 02F: `AiProvider`, `chapterSchema`, `LIMITS`, os
  padrões de linguagem determinista e de temas sensíveis
  (`languageIssues`, agora exportado), a checagem de repetição, o reparo de
  referências cruzadas, `AttemptMetrics`, o controlador de orçamento e o
  adaptador Anthropic.

### Arquivos novos

| Arquivo                                          | Papel                                                                               |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `interpretation/ai/generate-core.ts`             | Núcleo genérico de geração validada (astrologia + mãos)                             |
| `palm-reading/chapters/contract.ts`              | Tipos dos capítulos gerados (seção com `observed`, `notes`, `itemIds`, `factIds`)   |
| `palm-reading/chapters/prompt.ts`                | Instruções e dados do modelo de texto (versão `03e.1`)                              |
| `palm-reading/chapters/validate.ts`              | Validador da quiromancia                                                            |
| `palm-reading/chapters/library-draft.ts`         | Versão da biblioteca (reserva), no mesmo formato                                    |
| `palm-reading/chapters/generate.ts`              | Geração dos dois capítulos; capítulo sem itens vira "indisponível"                  |
| `palm-reading/chapters/presentation.ts`          | Resultado do cliente × trilha de auditoria                                          |
| `palm-reading/chapters/compose.ts`               | Observação validada → motor → capítulos → resultado                                 |
| `palm-reading/chapters/mock-text-provider.ts`    | Provedor de texto simulado, com cenários de falha e de interpretação não sustentada |
| `features/report/chapter-article.tsx`            | Componente de capítulo redigido, reutilizável na Fase 04                            |
| `palm-reading/chapters/chapters.test.ts`         | 43 testes dos capítulos                                                             |
| `palm-reading/components/palm-chapters.test.tsx` | 6 testes de apresentação                                                            |

### Arquivos alterados

- `interpretation/ai/generate.ts`: usa o núcleo genérico (comportamento
  igual; todos os testes da astrologia passam).
- `interpretation/ai/contract.ts`: `AttemptMetrics<C>` genérico no capítulo.
- `interpretation/ai/validate.ts`: `languageIssues` exportado; códigos
  `UNSUPPORTED_FEATURE`, `CONTRADICTION` e `SENSITIVE_ATTRIBUTE`.
- `palm-reading/vision/analyze.ts`: devolve a **observação validada**; a
  composição do resultado do cliente saiu daqui.
- `palm-reading/server/handlers.ts`: compõe os capítulos após a análise;
  novo `textProvider` nas dependências; o cache de deduplicação guarda o
  resultado final (a mesma foto não gera nova redação).
- `palm-reading/components/demo-preview.tsx`: mostra os capítulos 6 e 7
  (no lugar da lista de observações da 03D); a demonstração fixa e o aviso
  "sua foto não foi analisada" só aparecem sem análise.
- Títulos dos capítulos 6 e 7 (`analysis/engine.ts`,
  `content/report-chapters.ts`).
- `analysis/engine.ts`: concordância nas limitações ("A inclinação … não
  pôde ser observad**a**").

## 3. Como a geração funciona

1. **Capítulo sem itens** (nada observado): não chama o modelo. Vira
   `status: "unavailable"` com uma mensagem específica, que explica a
   limitação e orienta a nova foto. Nada é inventado.
2. **Dados do modelo de texto**: só material do sistema — para cada item, a
   frase de observação (escrita pelo sistema) e a interpretação autoral da
   biblioteca, com `certainty`. O modelo de texto **nunca** recebe a foto,
   a evidência visual nem texto livre do modelo de visão; não há conteúdo
   externo que possa carregar instruções. As regras estão no prompt do
   sistema e, principalmente, no validador, que confere todo rascunho.
3. **Validador da quiromancia** (`chapters/validate.ts`), além das checagens
   estruturais e de linguagem da 02F:
   - **características inexistentes** (linha do Sol, montes, ilhas,
     estrelas, braceletes, unhas, impressões digitais, outras linhas) →
     `UNSUPPORTED_FEATURE`;
   - menção a uma característica de **outro item** sem citá-lo →
     `CROSS_REFERENCE` (reparável); de característica **fora do capítulo** →
     `UNSUPPORTED_FEATURE`;
   - **valor contrário ao observado** ("curta" para uma linha longa, outro
     tipo de mão) → `CONTRADICTION`;
   - **longevidade, morte, futuro traçado, predestinação**, saúde, dinheiro,
     relacionamentos → `FORBIDDEN_LANGUAGE`;
   - **atributos pessoais** (idade, gênero, pele, aparência) →
     `SENSITIVE_ATTRIBUTE`;
   - todos os itens usados, nenhum item inventado, sem repetição.
4. **Até 2 tentativas** por capítulo (a segunda recebe as correções); na
   última, o reparo automático de referências cruzadas.
5. **Reserva**: se nada passar (erro do provedor, JSON inválido, recusa,
   resposta cortada, teto de gasto ou rascunho reprovado), o capítulo usa a
   **versão da biblioteca** — as interpretações aprovadas da 03C, com
   introdução, síntese e perguntas fixas. O cliente recebe o mesmo formato,
   sem aviso técnico.
6. **Ressalvas do sistema**: item parcialmente visível recebe a ressalva
   oficial (`PARTIAL_CAVEAT`) na primeira ocorrência e uma versão curta nas
   seguintes; as limitações do que não foi visto vêm do motor 03C.
7. **Cliente × auditoria**: o cliente recebe número, título, status,
   textos, observações, ressalvas, limites e a mensagem de indisponibilidade.
   Origem (IA/biblioteca), motivo da reserva, `itemIds`, `factIds`,
   tentativas, modelo e custo ficam só na trilha de auditoria
   (`palmAuditTrail`), no servidor.
8. **Provedor de texto no endpoint**: o **real** só existe quando a chamada
   real de visão já está autorizada (`config.mode === "anthropic"`, com
   todas as travas da 03D, inclusive o bloqueio em produção); usa o mesmo
   modelo e o **mesmo teto de gasto do processo**. Em qualquer outro caso, o
   simulado.

## 4. Exemplos (dados fictícios, provedores simulados)

O provedor de texto simulado monta o rascunho com as interpretações da
biblioteca; o texto real da IA só será visto na 03F.

### Capítulo 6 — leitura completa (`clearHand`)

> **06 · As características das suas mãos**
>
> Este capítulo parte do formato da sua mão, como ele apareceu na foto, e do
> que a tradição da quiromancia associa a ele.
>
> _Observado na foto:_ Palma de formato mais quadrado: a largura é parecida
> com o comprimento. · Dedos curtos em relação ao comprimento da palma.
>
> Na quiromancia, a palma de formato mais quadrado costuma ser associada a um
> jeito prático de estar no mundo: gosto por estrutura, constância e soluções
> concretas. Na quiromancia, dedos mais curtos em relação à palma são ligados
> a um modo de agir rápido e direto, mais atento ao conjunto do que aos
> detalhes.
>
> _Observado na foto:_ Combinação de palma e dedos que a quiromancia moderna
> chama de mão de Terra.
>
> Palma mais quadrada com dedos curtos compõe o que a quiromancia moderna
> chama de mão de Terra, associada à praticidade, à estabilidade e ao contato
> com o concreto.
>
> **Síntese.** Em conjunto, essas características compõem uma leitura
> simbólica do seu jeito de agir, para ser confrontada com a sua experiência.
>
> **Para refletir.** Em que situações você se reconhece nessa descrição, e em
> quais não? · Como o seu jeito de agir aparece no dia a dia?

### Capítulo 7 — leitura parcial (`partialHand`)

> **07 · As linhas da sua palma**
>
> Aqui estão as linhas da palma que puderam ser observadas na foto e as
> leituras simbólicas que a tradição da quiromancia faz delas.
>
> _Observado na foto:_ Linha do coração longa, chegando à área sob o dedo
> indicador.
>
> Uma linha do coração longa costuma ser associada, na quiromancia, a um
> afeto expansivo e generoso, que se envolve com intensidade.
>
> _Observado na foto:_ Linha do coração de traçado mais reto.
>
> Quando a linha do coração segue mais reta, a tradição a relaciona a um modo
> mais racional de lidar com os afetos…
>
> ⓘ Esta característica ficou só parcialmente visível na foto; leia esta
> interpretação com reserva.
>
> _(linha da cabeça: comprimento e início; linha da vida: arco amplo — "uma
> leitura sobre o modo de viver, não sobre a duração da vida")_
>
> **Limites desta leitura.** A foto tinha reflexos; algumas características
> podem não ter sido observadas. · A inclinação da linha da cabeça não pôde
> ser observada na foto e não foi interpretada. · A linha do destino não foi
> identificada com clareza na foto e não foi interpretada; isso não quer
> dizer que ela não exista.

### Capítulo 7 — linhas não identificáveis (`linesMissing`)

> **07 · As linhas da sua palma**
>
> **Esta parte não pôde ser lida.** Nesta foto, nenhuma linha da palma pôde
> ser observada com segurança, então esta parte da leitura não foi feita. Uma
> nova foto, com a palma bem aberta, de frente para a câmera e com luz
> natural sem reflexos, pode permitir esta leitura.

Captura no celular (Pixel 7, fluxo completo com simuladores, `next start`):
sem rolagem horizontal, nenhum texto técnico na tela.

## 5. Testes

Só observações fictícias e provedores simulados:

- **completa**: dois capítulos redigidos, todos os itens citados, cada
  observação mostrada uma vez, fora do texto;
- **parcial**: ressalva oficial na primeira seção incerta, curta nas
  demais; o que não foi visível não aparece em nenhum fato;
- **foto insuficiente**: dois capítulos indisponíveis, sem chamar o
  provedor de texto;
- **sem linhas identificáveis**: capítulo 6 redigido, 7 indisponível com
  orientação; uma única chamada;
- **falha de geração** (tempo esgotado, indisponível, JSON inválido,
  resposta cortada, recusa) → biblioteca; falha na 1ª e sucesso na 2ª →
  texto redigido;
- **biblioteca válida em 600 combinações** de valores e visibilidades
  (gerador determinístico);
- **interpretação não sustentada**: linha do Sol, montes, ilhas,
  braceletes, valor contrário, longevidade, morte, futuro traçado, destino
  inevitável, previsão, saúde, dinheiro, idade, gênero, item ausente; os
  mesmos cenários pelo provedor simulado nunca chegam ao cliente;
- **referência cruzada** reparada; conexão legítima entre dois itens aceita;
- **segurança do texto final** em todas as fixtures, com IA e com biblioteca;
  a evidência visual (inclusive com texto de "instrução") não chega ao
  modelo de texto;
- **endpoint**: falha de texto não derruba a leitura nem expõe detalhes; a
  mesma foto não gera nova redação; chaves do resultado conferidas;
- **apresentação**: observação em bloco próprio, ressalvas, síntese,
  perguntas, indisponível, prévia com e sem análise, nada técnico.

Resultado: **903 testes passando** (2 pagos pulados), lint, tipos e build de
produção.

## 6. Limitações e riscos

- **Validação léxica**: o validador detecta as falhas que conhece; não prova
  correção semântica. Paráfrases novas de previsões ou de características
  inexistentes podem escapar até serem cobertas. A 03F deve revisar textos
  reais.
- **Texto da IA não observado**: o simulador reescreve a biblioteca; a
  qualidade editorial real (repetição, tom, conexões) só será vista na 03F.
- **Orçamento compartilhado** (pendência abaixo): com Sonnet e o teto
  padrão, a redação tende a cair na biblioteca por falta de orçamento — o que
  é seguro, mas impede avaliar o texto.
- **Estado em memória** (limites, deduplicação, teto): por processo; não
  serve para uso público.
- O tipo de mão (Terra, Ar, Fogo, Água) é um item derivado da 03C; o
  validador recusa outro tipo, mas não julga a pertinência da tradição.

## 7. Pendência para a Fase 03F — limites de orçamento

Registrada a pedido, **sem alterar os orçamentos nesta tarefa**:

> Revisar os limites de orçamento: o pior caso de duas chamadas Sonnet pode
> ultrapassar US$ 0,10, e o pior caso da rodada completa pode ultrapassar
> US$ 1.

Pior caso calculado localmente (sem chamadas), com os mesmos estimadores do
controlador (`visionWorstCaseUsd`, `worstCaseUsd`, `max_tokens` 4 000):

| Chamada                                    | Haiku 5.5   | Sonnet 5.5 |
| ------------------------------------------ | ----------- | ---------- |
| Visão (1 tentativa)                        | US$ 0,0032  | US$ 0,0645 |
| Texto, capítulo 6                          | US$ 0,0023  | US$ 0,0455 |
| Texto, capítulo 7                          | US$ 0,0024  | US$ 0,0472 |
| **Foto, pior caso** (2 tentativas em tudo) | ≈ US$ 0,016 | ≈ US$ 0,31 |

- Duas chamadas Sonnet (2 tentativas de visão, ou visão + um capítulo)
  já passam de US$ 0,10, o teto padrão por processo.
- Rodada da 03F (8 fotos × 2 modelos), pior caso: ≈ US$ 0,13 (Haiku) +
  ≈ US$ 2,5 (Sonnet) ≈ **US$ 2,6**, acima de US$ 1 (teto máximo aceito pela
  variável) e dos R$ 5 citados na 03A. Os custos esperados são bem menores.
- Hoje o teto é compartilhado entre visão e texto; quando ele se esgota, a
  visão falha com `processing_limit` e o texto cai na biblioteca.
