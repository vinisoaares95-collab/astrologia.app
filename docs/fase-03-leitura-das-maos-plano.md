# Fase 03 — Leitura das mãos por IA: planejamento técnico (03A)

Status: **proposta para aprovação**. Nenhum código foi implementado e nenhuma
chamada paga foi feita nesta etapa. A integração com o mapa astral (capítulos
8–9) fica para a Fase 04.

Escopo: capítulos **6 (características das mãos)** e **7 (linhas da palma)**
do relatório Sidera (`src/content/report-chapters.ts`, parte "Suas Mãos").

## 1. Diagnóstico técnico

O que já existe e pode ser reaproveitado:

| Peça                                                   | Onde                                                            | Situação                                                              |
| ------------------------------------------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------- |
| Captura por câmera nativa e galeria, arrastar e soltar | `features/palm-reading/components/photo-capture.tsx`            | Pronta (Fase 01). `<input capture>` abre a câmera traseira no celular |
| Validação local: formato, tamanho, ≥ 600 px, HEIC      | `features/palm-reading/lib/image-validation.ts`                 | Básica; não mede luz, nitidez nem presença da mão                     |
| Foto só em memória (URL `blob:` revogada ao sair)      | `palm-photo-context.tsx`, `lib/load-image.ts`                   | Pronto; hoje **nada sai do navegador**                                |
| Guia de fotografia                                     | `components/photo-guide.tsx`                                    | Pronto (luz, palma aberta, mão inteira, de frente; evitar anéis)      |
| Separação fato calculado × leitura simbólica           | `interpretation/contract.ts` (`Fact` × `InterpretationItem`)    | Padrão a repetir: observação visual × interpretação da quiromancia    |
| Provedor de IA, saída estruturada, tentativas, teto    | `interpretation/ai/` (`AiProvider`, `generate.ts`, `budget.ts`) | Reaproveitável; falta enviar imagem no adaptador                      |
| Validador léxico, biblioteca como alternativa, notas   | `validate.ts`, `library-chapter.ts`, `precision.ts`             | Padrão a repetir com vocabulário da quiromancia                       |
| Apresentação sem metadados × auditoria interna         | `presentation.ts`                                               | Reaproveitável como está                                              |
| Ação de servidor protegida por flag, sem persistência  | `natal-chart/actions.ts` + `engine-gate.ts`                     | Padrão a repetir                                                      |

Lacunas: consentimento específico para foto; remoção de metadados (EXIF/GPS);
medição de qualidade; envio ao servidor; contrato de observações; biblioteca
simbólica da quiromancia; validador da quiromancia; avaliação de qualidade.

Restrições técnicas relevantes:

- Server Actions aceitam **1 MB** de corpo por padrão
  (`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md`).
  Uma foto reprocessada no navegador (JPEG, 1 536 px no lado maior, qualidade
  ~0,85) fica em ~300–600 KB, dentro do limite sem mudar configuração.
- Visão no Claude: JPEG/PNG/WebP/GIF; custo de
  `⌈largura/28⌉ × ⌈altura/28⌉` tokens visuais; modelos 4.7 e posteriores
  (inclui Haiku 5.5) até 2 576 px e 4 784 tokens por imagem. A doc oficial
  avisa que localização espacial e contagem são **aproximadas** e que imagens
  de baixa qualidade, giradas ou muito pequenas aumentam erros
  ([Vision](https://platform.claude.com/docs/en/build-with-claude/vision)).

## 2. Abordagem recomendada

**Extração visual estruturada (1 chamada multimodal) → validação →
biblioteca simbólica determinística → redação dos capítulos 6 e 7 com o
mesmo pipeline da 02F (texto, sem imagem).**

1. **Observar, não interpretar.** A chamada com imagem devolve só
   observações visuais em JSON Schema fechado: valores categóricos (por
   exemplo `heart.length: short | medium | long | not_visible`), uma
   confiança por característica (`clear | partial | not_visible`) e uma
   evidência curta ("a linha some antes do dedo médio"). Nada de
   significado, previsão ou adjetivo de personalidade.
2. **Validar** (código, sem IA): enums, coerência (linha `not_visible` não
   tem comprimento), evidência obrigatória, características `partial` viram
   item incerto com ressalva do sistema, e `not_visible` simplesmente não
   gera item.
3. **Interpretar com a biblioteca** (como a 02E): cada observação aceita vira
   um `Fact` e um `InterpretationItem` com texto autoral da quiromancia
   ("na tradição da quiromancia…"). O significado nunca vem do modelo de
   visão.
4. **Redigir** os capítulos 6 e 7 com `generate.ts` (Haiku 5.5, texto),
   validador e alternativa da biblioteca, como nos capítulos 1–5.

Por quê:

- Isola o que o modelo enxerga do que a tradição diz, o mesmo princípio que
  já funcionou na astrologia.
- A imagem é enviada **uma única vez**; os capítulos são gerados só com
  texto (barato, validável, e não reenvia dado sensível).
- Permite dizer "não foi possível observar" em vez de inventar.
- Visão computacional clássica (detecção de bordas) para linhas é frágil com
  luz e pele variadas; modelos multimodais também erram, por isso o desenho
  pede categorias grosseiras com opção explícita de "não visível".

## 3. Fluxo do usuário (smartphone primeiro)

1. **Introdução e guia** (existente): luz natural, palma aberta, mão inteira,
   câmera paralela, sem anéis.
2. **Consentimento específico** (novo, antes da câmera): finalidade, envio a
   um provedor de IA nos EUA, não armazenamento da foto, possibilidade de
   desistir. Caixa não marcada por padrão e confirmação de maioridade.
3. **Escolha da mão**: "Com qual mão você escreve?" (dominante).
4. **Foto da palma dominante** (câmera nativa ou galeria).
5. **Checagem local instantânea** (sem custo): formato, resolução, luz,
   nitidez, orientação; mensagem específica e botão "Tirar outra".
6. **Pré-visualização + autoconferência** (existente) → "Analisar".
7. **Análise** (~5–20 s, com indicador): uma chamada de visão.
8. Resultado:
   - **adequada** → capítulos 6 e 7;
   - **parcial** → "algumas linhas não ficaram visíveis; seguir assim ou
     tirar outra?" (as não visíveis são omitidas, nunca inventadas);
   - **inadequada** → motivo específico (escura, tremida, cortada, mão
     fechada, não é uma palma…) e nova foto, até o limite de tentativas.
9. (Opcional, a decidir) **segunda mão** para comparação tradicional.

## 4. Arquitetura proposta

```
Navegador                                   Servidor (Next.js, flag interna)
─────────                                   ──────────────────────────────
captura → reprocessa (canvas):              ação analyzePalmAction(imagem, mão)
  orientação, sem EXIF/GPS,                   ├─ checa flag, tamanho, assinatura
  1 536 px, JPEG                              │  JPEG (bytes mágicos) e dimensões
→ checagens locais (luz, nitidez)             ├─ dedupe por SHA-256 (sessão)
→ consentimento registrado                    ├─ provedor de visão (AiProvider +
→ envia (≤ 1 MB)                              │  imagem) com withBudget
                                              ├─ validatePalmObservation → fatos
                                              ├─ palm engine (biblioteca) → itens
                                              ├─ generateReport (caps. 6–7, texto)
                                              └─ devolve capítulos + limitações;
                                                 imagem descartada da memória
```

Novos módulos (nomes indicativos), no padrão atual:

- `features/palm-reading/lib/prepare-image.ts`: reprocessamento e remoção de
  metadados no navegador.
- `features/palm-reading/lib/quality.ts`: luz, contraste, nitidez e
  orientação.
- `features/palm-reading/analysis/contract.ts`: `PalmObservation`, enums,
  confiança, evidência.
- `features/palm-reading/analysis/validate-observation.ts`: validação do JSON
  de visão.
- `features/palm-reading/library/`: textos autorais da quiromancia, com as
  mesmas regras editoriais da 02E.
- `features/palm-reading/engine.ts`: observações → `Fact`/`InterpretationItem`
  dos capítulos 6 e 7.
- `interpretation/ai/`:
  - `ChapterId` estendido com `maos` e `linhas`;
  - validador com vocabulário da quiromancia;
  - `anthropic-provider.ts` aceitando blocos de imagem (base64).
- `features/palm-reading/actions.ts`: ação de servidor atrás de flag
  (`isInternalEngineEnabled` ou flag própria), sem persistência.

## 5. Análise e validação das fotografias

### 5.1 Quantas mãos e fotos (MVP)

- **Recomendado: 1 foto obrigatória da palma da mão dominante.** Cobre os
  capítulos 6 e 7 e é a prática tradicional citada no próprio guia do app.
- **Opcional: palma da mão não dominante** (a tradição compara "potencial" e
  "desenvolvimento"). Dobra o custo de visão (ainda centavos) e o atrito.
  Decisão do produto.
- **Fora do MVP:** dorso da mão, unhas, perfil do polegar e close das linhas
  menores. Mais fotos, mais atrito e baixa confiabilidade.

### 5.2 Camada 1: navegador (grátis, instantânea)

- Já existe: formato, tamanho de 15 MB, ≥ 600 px, HEIC.
- Novo, calculado num canvas reduzido (~256 px):
  - **luz**: luminância média e % de pixels estourados ou escuros (mão
    escura, flash ou reflexo);
  - **contraste**: desvio-padrão da luminância;
  - **nitidez**: variância do Laplaciano (foto tremida ou fora de foco);
  - **orientação**: aplicada pelo navegador ao redesenhar no canvas;
    horizontal gera aviso (já existe).
- Os limiares são calibrados com fotos de teste. Começam como **aviso**, não
  bloqueio, para não barrar fotos boas.
- **Opcional (decisão):** detector de mão no próprio aparelho (MediaPipe Hand
  Landmarker, Apache-2.0, rodando no navegador). Confirma que há uma mão, que
  a palma está voltada para a câmera, a mão inteira no quadro e os dedos
  abertos. Os 21 pontos dariam **proporções dos dedos de forma
  determinística**. Custo: ~10 MB de WASM e modelo, carregados só na tela da
  foto e servidos pelo próprio domínio. Vale um spike antes de decidir.

### 5.3 Camada 2: na própria chamada de visão (sem chamada extra)

O schema começa por um bloco `image_assessment`:

- `usable: true | false`;
- `issues[]`, entre `too_dark`, `overexposed`, `glare`, `blurry`,
  `hand_cropped`, `hand_closed`, `back_of_hand`, `multiple_hands`,
  `not_a_hand` e `obstruction` (anéis, objetos);
- visibilidade de cada região.

Se `usable` for falso, o servidor **não** gera capítulos e devolve a mensagem
de nova foto correspondente.

## 6. O que observar e o que nunca afirmar

| Característica                                                      | Confiabilidade esperada    | MVP                                   |
| ------------------------------------------------------------------- | -------------------------- | ------------------------------------- |
| Formato da palma (mais quadrada × mais retangular)                  | Razoável                   | Sim                                   |
| Comprimento dos dedos em relação à palma (curtos/médios/longos)     | Razoável                   | Sim                                   |
| Afastamento natural dos dedos, polegar (abertura)                   | Razoável a baixa           | Sim, com ressalva                     |
| Linha do coração: presença, comprimento, curvatura                  | Razoável se nítida         | Sim                                   |
| Linha da cabeça: presença, comprimento, inclinação                  | Razoável se nítida         | Sim                                   |
| Linha da vida: presença, curvatura, início junto/separado da cabeça | Razoável se nítida         | Sim (**sem relação com longevidade**) |
| Linha do destino: presença                                          | Baixa (muitas vezes tênue) | Só se `clear`; senão omitida          |
| Montes (relevo), linha do Sol, linhas de relacionamento, braceletes | Baixa                      | Não                                   |
| Marcas pequenas (ilhas, cruzes, estrelas, correntes, quebras)       | Muito baixa                | Não                                   |
| Pele, unhas, cor, idade, sexo, saúde, impressões digitais           | Fora do escopo             | **Nunca**                             |

Regras de conteúdo:

- Nunca afirmar algo marcado `not_visible`. Uma característica `partial` só
  entra com ressalva do sistema.
- Nunca ligar linha a duração da vida, morte, doença, gravidez, número de
  filhos, casamento, dinheiro ou data de acontecimentos. Isso entra como
  padrão proibido no validador da quiromancia, junto dos que já existem.
- Nenhuma identificação de pessoa, nem uso da imagem para isso; a política da
  Anthropic já veda.

## 7. Observação visual × interpretação simbólica

- **Observação** (modelo de visão, validada): "Linha do coração longa,
  curvando-se em direção ao espaço entre o indicador e o médio (nítida)."
- **Interpretação** (biblioteca autoral): "Na tradição da quiromancia, uma
  linha do coração longa e curva é associada a uma expressão afetiva calorosa
  e aberta."
- **Redação** (modelo de texto): articula os itens, com o mesmo validador da
  02F. Itens incertos recebem notas do sistema; a apresentação ao cliente não
  mostra a origem.

## 8. Dados estruturados e validados

Esboço do contrato (a detalhar na 03C):

```ts
type Visibility = "clear" | "partial" | "not_visible";
type PalmObservation = {
  hand: "dominant" | "non_dominant";
  imageAssessment: { usable: boolean; issues: ImageIssue[] };
  shape: { palm: "square" | "rectangular" | "not_visible"; fingers: "short" | "medium" | "long" | "not_visible"; visibility: Visibility; evidence: string };
  lines: {
    heart: { length: "short" | "medium" | "long" | "not_visible"; curve: "straight" | "curved" | "not_visible"; visibility: Visibility; evidence: string };
    head: { length: …; slope: "straight" | "sloping" | "not_visible"; joinedWithLife: boolean | null; visibility; evidence };
    life: { curve: "tight" | "wide" | "not_visible"; visibility; evidence };
    fate: { present: boolean | null; visibility; evidence };
  };
};
```

- Valores livres só na `evidence`, limitada (~160 caracteres) e checada:
  não pode conter interpretação, diagnóstico nem termos proibidos.
- Cada valor aceito vira um `Fact` (`palm-shape`, `palm-line:heart`…) com
  `observation` gerada pelo **sistema** a partir dos enums. O texto do modelo
  não vai ao cliente.
- A confiança `partial` vira `certainty: "uncertain"` com ressalva do
  sistema, reaproveitando `precision.ts`.

## 9. Capítulos 6 e 7

- **Capítulo 6 (características):** formato da palma, proporção dos dedos e
  abertura da mão (se observada).
- **Capítulo 7 (linhas):** coração, cabeça e vida; destino só se nítida.
- **Limitações** copiadas pelo sistema, por exemplo: "A linha do destino não
  ficou visível na foto e não foi interpretada."
- Mesma geração por capítulo, mesmo validador (vocabulário da quiromancia:
  nomes de linhas e partes da mão no lugar de signos e casas), mesma
  biblioteca como alternativa e mesmo `presentation.ts`.
- Se a foto for parcial e um capítulo ficar sem itens, o capítulo mostra a
  limitação e um convite a nova foto, **sem texto inventado**.

## 10. Falhas e nova fotografia

| Situação                                                 | Resposta                                                      | Custo        |
| -------------------------------------------------------- | ------------------------------------------------------------- | ------------ |
| Arquivo inválido, pequeno, escuro ou tremido (navegador) | Mensagem específica + "Tirar outra"                           | Zero         |
| Visão: `usable: false`                                   | Motivo específico + nova foto                                 | 1 chamada    |
| Visão: parcial                                           | Seguir com ressalvas ou nova foto                             | 1 chamada    |
| JSON inválido, truncado ou fora do schema                | 1 nova tentativa; depois "não conseguimos analisar agora"     | ≤ 2 chamadas |
| Recusa do modelo                                         | Pedir nova foto (pode ser imagem não permitida)               | 1 chamada    |
| Erro de API, timeout, teto atingido                      | Mensagem neutra, sem texto da biblioteca (não há observações) | —            |
| Mesma foto reenviada                                     | Reaproveita o resultado (hash), sem nova chamada              | Zero         |
| Limite de envios por sessão (p.ex. 3)                    | Bloqueia novas análises naquela sessão                        | Zero         |

## 11. Privacidade, consentimento, armazenamento e segurança (LGPD)

> Requer revisão jurídica antes de abrir ao público. Abaixo, a postura
> técnica recomendada.

- **Classificação conservadora:** foto da palma pode conter traços biométricos
  (impressões palmares e digitais). Tratar como **dado pessoal sensível**
  (LGPD art. 5º, II; art. 11): consentimento **específico e destacado**,
  separado de outros termos, para finalidade determinada.
- **Transferência internacional** (provedor de IA nos EUA): informar
  claramente no consentimento e registrar a base legal (art. 33), com revisão
  jurídica.
- **Minimização:**
  - reprocessar no navegador (remove EXIF/GPS e modelo do aparelho);
  - reduzir para 1 536 px;
  - pedir só a palma (sem rosto e sem fundo identificável);
  - não pedir nome junto da foto.
- **Armazenamento: nenhum no MVP.**
  - A imagem existe só na memória do navegador e, durante a análise, na
    memória do servidor.
  - Não vai a banco, disco, log nem fila.
  - Persistem só as observações categóricas validadas e os capítulos, que não
    permitem reconstruir a imagem.
  - Se um dia for preciso guardar a foto, cria-se armazenamento cifrado com
    expiração curta e uma decisão própria.
- **Provedor:**
  - os dados da API não são usados para treino por padrão;
  - a retenção de logs e a ZDR (retenção zero) precisam ser confirmadas na
    conta, antes do uso público;
  - ver `docs/fase-02f-geracao-com-ia.md` §3.
- **Exclusão:**
  - "apagar minha leitura" remove observações e capítulos;
  - a foto, por não ser guardada, não precisa de exclusão;
  - revogar o consentimento interrompe a análise.
- **Maioridade:** confirmação de 18 anos ou mais. Menores ficam fora do MVP,
  porque exigiriam consentimento dos responsáveis.
- **Segurança:**
  - ação de servidor atrás de flag interna até a aprovação;
  - limite de corpo (1 MB);
  - checagem de bytes mágicos JPEG e dimensões;
  - limite de envios por sessão, chave só no servidor;
  - nunca registrar base64, hash ligado a pessoa nem resposta bruta de
    visão;
  - cabeçalhos atuais mantidos.
- **Texto ao usuário:** atualizar a promessa atual ("nada sai do seu
  aparelho") só quando o envio existir.

## 12. Modelos com visão: candidatos e custos

Premissas da estimativa, por foto:

- imagem de 1 536 × 2 048 px → ⌈1536/28⌉ × ⌈2048/28⌉ = 55 × 74 = **4 070
  tokens visuais**;
- instruções e schema: ~2 300 tokens;
- entrada total: **~6 400 tokens**;
- saída (JSON com raciocínio, esforço baixo ou médio): **~3 000 tokens** de
  pior caso típico.

Preços oficiais da Anthropic (USD por 1 M tokens, consultados em 11/11/2026
na tabela de modelos da API e na
[página de Vision](https://platform.claude.com/docs/en/build-with-claude/vision)):

| Modelo                            | Entrada / saída | Visão (por foto)          | Uso sugerido                                                                       |
| --------------------------------- | --------------- | ------------------------- | ---------------------------------------------------------------------------------- |
| **Claude Haiku 5.5**              | 0,10 / 0,50     | ≈ US$ 0,0021 (≈ R$ 0,012) | **Candidato padrão** (adaptador, teto e preço já no projeto)                       |
| Claude Sonnet 5.5                 | 2 / 10          | ≈ US$ 0,043 (≈ R$ 0,24)   | Comparação cega na avaliação                                                       |
| Claude Opus 5.5                   | 4 / 20          | ≈ US$ 0,086 (≈ R$ 0,47)   | Referência de qualidade só na avaliação                                            |
| Google Gemini Flash (família)     | não verificado  | —                         | Exigiria novo adaptador, novo contrato de dados e nova transferência internacional |
| OpenAI (modelos "mini" com visão) | não verificado  | —                         | Idem                                                                               |

- Os preços de Google e OpenAI **não foram verificados**: o site oficial do
  Google não estava acessível nesta sessão e as fontes secundárias divergem.
  Exemplos: [ai.google.dev/pricing](https://ai.google.dev/gemini-api/docs/pricing),
  [Vertex AI pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)
  e agregadores como
  [Finout](https://www.finout.io/blog/gemini-pricing-in-2026).
- **Custo por leitura com Haiku 5.5:** visão (1 foto, ≈ US$ 0,002) mais os
  capítulos 6 e 7 em texto (≈ US$ 0,002 cada, medido na 02F) dão **≈ US$
  0,006 (≈ R$ 0,03)**.
- **Pior caso com Haiku 5.5** (3 envios, 2 mãos, novas tentativas): ≈ US$
  0,02 (≈ R$ 0,12).
- Câmbio de referência: 5,5, o mesmo do projeto.
- Recomendação: **Haiku 5.5 como hipótese**, a confirmar numa avaliação
  cega Haiku × Sonnet sobre fotos de teste consentidas (03F). Sem essa
  avaliação, a precisão de linhas é desconhecida.

## 13. Controle de custo

1. Checagens no navegador antes de qualquer envio (grátis).
2. Uma única chamada de visão por foto aceita; a avaliação de adequação vem
   na mesma resposta.
3. Imagem reduzida a ~1 536 px (≈ 4 070 tokens), sem pagar o teto de 4 784.
4. Os capítulos usam só texto, sem reenviar a imagem.
5. Dedupe por hash na sessão, para não reanalisar a mesma foto.
6. Limite de envios por sessão e por dia.
7. `withBudget` e pior caso por chamada (`budget.ts`), com teto por leitura.
8. Sem fallback pago entre modelos. A alternativa é pedir nova foto, nunca
   inventar texto.
9. Esforço baixo na extração visual, se a avaliação mostrar que basta. O
   cache do system prompt só ajuda se o prefixo atingir o mínimo do modelo; a
   medir.

## 14. Etapas da Fase 03

| Etapa   | Entrega                                                                                                                          | Chamadas pagas              |
| ------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **03A** | Este plano (aprovação)                                                                                                           | Não                         |
| **03B** | Consentimento específico, escolha da mão, reprocessamento sem EXIF, checagens de luz/nitidez, textos de nova foto (só navegador) | Não                         |
| **03C** | Contrato `PalmObservation`, validador, biblioteca autoral da quiromancia, motor observações → itens, fixtures                    | Não                         |
| **03D** | Adaptador com imagem, provedor simulado de visão, ação de servidor atrás de flag, sem persistência, teto e dedupe                | Não (só simulado)           |
| **03E** | Capítulos 6 e 7 no pipeline da 02F: validador da quiromancia, biblioteca alternativa, apresentação                               | Não                         |
| **03F** | Conjunto de fotos de teste consentidas e avaliação cega Haiku × Sonnet (teto próprio, autorização separada)                      | **Sim, autorizada à parte** |
| **03G** | Revisão de privacidade: textos de consentimento, retenção, exclusão, documentação                                                | Não                         |
| (spike) | MediaPipe no navegador: viabilidade, peso, precisão das proporções                                                               | Não                         |

Cada etapa termina com testes, lint e tipos, como na Fase 02.

## 15. Riscos e decisões

Riscos técnicos:

- **Precisão das linhas:** modelos multimodais erram trajeto e comprimento,
  sobretudo com linhas finas, peles mais escuras com pouca luz ou palmas
  muito marcadas. Mitigação: categorias grosseiras, `not_visible`, avaliação
  com fotos variadas.
- **Viés:** a qualidade pode variar com o tom de pele e a iluminação. A
  avaliação precisa de amostra diversa e consentida.
- **Fotos de teste:** não podemos usar fotos reais sem consentimento. Fontes
  possíveis: voluntários com termo assinado, banco licenciado ou mãos
  ilustradas e sintéticas (estas não medem o mundo real).
- **Reprodutibilidade:** a mesma foto pode gerar observações diferentes em
  chamadas diferentes. A medir na 03F; dá para exigir concordância em duas
  leituras, ao custo de dobrar a visão.
- **iOS/HEIC e câmeras:** o reprocessamento no canvas resolve na maioria dos
  casos; o HEIC fora do Safari continua com orientação para JPG.
- **Limite de 1 MB** das Server Actions: o reprocessamento garante o
  tamanho; senão, ajustar `bodySizeLimit`.
- **Expectativa do usuário:** a quiromancia apresentada como leitura
  simbólica, com aviso no início dos capítulos, como na astrologia.

Decisões necessárias:

1. Uma mão (dominante) ou duas no MVP?
2. Spike do MediaPipe no navegador: sim ou não?
3. Origem das fotos de teste da 03F (voluntários, banco licenciado,
   sintéticas)?
4. Confirmar **nenhum armazenamento de foto** no MVP.
5. Idade mínima de 18 anos no MVP?
6. Revisão jurídica da LGPD (dado sensível, transferência internacional)
   antes do uso público?
7. Orçamento e autorização da avaliação 03F (estimativa: ~20 fotos × 2
   modelos ≈ US$ 0,90 ≈ R$ 5 sem novas tentativas, até ~R$ 10 no pior caso;
   o Sonnet responde por ~95% do valor; a confirmar no planejamento da 03F).
8. A linha do destino entra no MVP (só quando nítida) ou fica de fora?
