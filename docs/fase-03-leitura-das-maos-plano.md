# Fase 03 — Leitura das mãos por IA: planejamento técnico

Status:

- **03A (planejamento): aprovada** em 11/11/2026, com as decisões da seção 0.
- **03B (preparação da foto no navegador): concluída**; ver seção 16.
- **03C (observações, validação e biblioteca): concluída**; ver seção 17 e
  `docs/fase-03c-observacoes-e-biblioteca.md`.
- 03D em diante: aguardando aprovação.

Nenhuma chamada paga foi feita na Fase 03. A integração com o mapa astral
(capítulos 8–9) fica para a Fase 04.

## 0. Decisões aprovadas (MVP)

| #   | Decisão                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------- |
| 1   | **Uma foto**: palma da mão dominante                                                                      |
| 2   | **Sem MediaPipe** por enquanto (sem detector de mão no aparelho)                                          |
| 3   | Testes com **fotos reais de voluntários adultos autorizados** (termo assinado)                            |
| 4   | **Nenhum armazenamento persistente de fotos no Sidera**                                                   |
| 5   | **Somente maiores de 18 anos**                                                                            |
| 6   | **Revisão jurídica de privacidade e LGPD obrigatória** antes do lançamento público                        |
| 7   | Primeira comparação visual (03F) planejada com **teto de R$ 5**; chamadas pagas ainda **não autorizadas** |
| 8   | **Linha do destino só quando claramente identificável** (`clear`); caso contrário, omitida                |

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

- **Limites de envio do Next.js 16.4.3** (versão instalada; documentação em
  `node_modules/next/dist/docs/`):
  - Server Actions: **1 MB** de corpo por padrão, configurável em
    `experimental.serverActions.bodySizeLimit`. O limite conta o corpo HTTP
    bruto, incluindo o envelope `multipart/form-data` (a doc sugere folga de
    10–20 KB) (`…/05-config/01-next-config-js/serverActions.md`).
  - Requisições que passam pelo `proxy` (antigo middleware): o corpo é
    armazenado até **10 MB** por padrão (`proxyClientMaxBodySize`). Acima
    disso é truncado com aviso (`…/proxyClientMaxBodySize.md`).
  - Consequência (revisada na 03B): para preservar as linhas, a foto
    preparada é um JPEG de alta qualidade de ~1 600 × 2 200 px. Em fotos
    reais isso pode passar de 1 MB. **Decidido na 03C:** a 03D usa um Route
    Handler `POST` dedicado, com limite de corpo próprio verificado no
    servidor, em vez de Server Action. O teto do arquivo preparado é 2,5 MB
    (`MAX_PREPARED_BYTES`).
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
captura → reprocessa (canvas):              POST /api/... (Route Handler dedicado)
  orientação, sem EXIF/GPS,                   ├─ checa flag, tamanho, assinatura
  ≤ 2 576 px / 4 784 tokens, JPEG 0,92        │  JPEG (bytes mágicos) e dimensões
→ checagens locais (luz, nitidez)             ├─ dedupe por SHA-256 (sessão)
→ consentimento registrado                    ├─ provedor de visão (AiProvider +
→ envia (≤ 2,5 MB, limite no handler)         │  imagem) com withBudget
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
- Route Handler `POST` dedicado (decidido na 03C) atrás de flag interna,
  com consentimento, maioridade, mão e arquivo conferidos no servidor; sem
  persistência.

## 5. Análise e validação das fotografias

### 5.1 Quantas mãos e fotos (MVP)

- **Decidido: 1 foto obrigatória da palma da mão dominante.** A pessoa
  informa qual mão fotografa (direita ou esquerda). Cobre os capítulos 6 e 7
  e é a prática tradicional citada no guia do app.
- A palma da mão não dominante fica fora do MVP.
- **Fora do MVP:** dorso da mão, unhas, perfil do polegar e close das linhas
  menores. Mais fotos, mais atrito e baixa confiabilidade.

### 5.2 Camada 1: navegador (grátis, instantânea)

- Já existe: formato, tamanho de 15 MB, ≥ 600 px, HEIC.
- Novo (implementado na 03B), calculado numa cópia em cinza de ~512 px no
  lado maior:
  - **luz**: luminância média e % de pixels estourados ou escuros (mão
    escura, flash ou reflexo);
  - **contraste**: desvio-padrão da luminância;
  - **nitidez**: variância do Laplaciano (foto tremida ou fora de foco);
  - **orientação**: aplicada pelo navegador ao redesenhar no canvas;
    horizontal gera aviso (já existe).
- Os limiares são calibrados com fotos de teste. Começam como **aviso**, não
  bloqueio, para não barrar fotos boas.
- **Adiado (decisão 2):** detector de mão no próprio aparelho (MediaPipe Hand
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

- **Evidência visual obrigatória para cada característica identificada.**
  Todo valor diferente de `not_visible` precisa de `evidence` não vazia,
  concreta e localizável na imagem (onde começa ou termina, por onde passa,
  em relação a quais dedos), por exemplo "termina abaixo do espaço entre o
  indicador e o médio".
  - Sem evidência, ou com evidência genérica ("a linha é visível"), o
    validador rebaixa a característica para `not_visible` e ela não gera
    item.
  - `partial` também exige evidência e vira item incerto.
  - A linha do destino só é aceita com `visibility: "clear"` e evidência de
    início e fim (decisão 8).
  - A `evidence` é limitada (~160 caracteres) e checada: não pode conter
    interpretação, diagnóstico nem termos proibidos. Serve à auditoria e
    nunca é mostrada ao cliente.
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
  - reduzir ao limite útil do provedor (≤ 2 576 px, ≤ 4 784 tokens);
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
- **Retenção externa (provedor de IA): é diferente de armazenamento no
  Sidera.** Não guardar a foto no Sidera não significa que ninguém a retém.
  Pela documentação oficial da Anthropic (consultada em 11/11/2026):
  - na API comercial padrão, entradas e saídas (inclusive imagens) são
    apagadas em até **30 dias**
    ([commercial data retention](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data));
  - os dados não são usados para treino sem permissão expressa;
  - com **ZDR** (retenção zero, habilitada por organização via contato
    comercial), prompts e respostas não ficam armazenados depois da
    resposta, mas conteúdo sinalizado pelos sistemas de segurança pode ser
    retido por até **2 anos** em qualquer arranjo
    ([API and data retention](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention));
  - Batches e Files API retêm dados (não usar para fotos).
  - Decisão pendente para a revisão jurídica: pedir ZDR antes do lançamento
    ou declarar os 30 dias no consentimento. O texto provisório da 03B já
    informa os 30 dias e os 2 anos.
- **Exclusão:**
  - "apagar minha leitura" remove observações e capítulos;
  - a foto, por não ser guardada, não precisa de exclusão;
  - revogar o consentimento interrompe a análise.
- **Maioridade:** confirmação de 18 anos ou mais. Menores ficam fora do MVP,
  porque exigiriam consentimento dos responsáveis.
- **Segurança:**
  - Route Handler atrás de flag interna até a aprovação, conferindo de novo
    o consentimento no servidor;
  - limite de corpo (1 MB);
  - checagem de bytes mágicos JPEG e dimensões;
  - limite de envios por sessão, chave só no servidor;
  - nunca registrar base64, hash ligado a pessoa nem resposta bruta de
    visão;
  - cabeçalhos atuais mantidos.
- **Texto ao usuário:** atualizar a promessa atual ("nada sai do seu
  aparelho") só quando o envio existir.

## 12. Modelos com visão: candidatos e custos

Cálculo revisado segundo a
[documentação oficial de visão](https://platform.claude.com/docs/en/build-with-claude/vision).
A imagem custa `⌈largura/28⌉ × ⌈altura/28⌉` tokens visuais, cobrados como
tokens de **entrada**. Nos modelos 4.7 e posteriores o máximo é 2 576 px no
lado maior e 4 784 tokens; acima disso o provedor reduz a imagem sozinho. Por
foto:

| Componente                       | Tokens (estimativa)    | Origem do número                                                                                  |
| -------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| **Imagem**                       | **4 661** (máx. 4 784) | Foto preparada de 12 MP em retrato: 1 643 × 2 191 px → 59 × 79 blocos (medido na 03B)             |
| **Instruções** (system + schema) | ~2 300                 | Estimativa; medir com `count_tokens` na 03D. Na 1ª chamada, gravar no cache custa 1,25× a entrada |
| **Resposta** (JSON + raciocínio) | ~3 000                 | JSON ~800 + raciocínio em esforço baixo/médio; a confirmar na 03F                                 |

Preços oficiais da Anthropic (USD por 1 M tokens, tabela da API consultada em
11/11/2026). Custo por foto, por componente:

| Modelo                            | Entrada / saída | Imagem      | Instruções  | Resposta   | **Total por foto**          | Uso sugerido                                                                       |
| --------------------------------- | --------------- | ----------- | ----------- | ---------- | --------------------------- | ---------------------------------------------------------------------------------- |
| **Claude Haiku 5.5**              | 0,10 / 0,50     | US$ 0,00047 | US$ 0,00023 | US$ 0,0015 | **≈ US$ 0,0022 (R$ 0,012)** | **Candidato padrão** (adaptador, teto e preço já no projeto)                       |
| Claude Sonnet 5.5                 | 2 / 10          | US$ 0,0093  | US$ 0,0046  | US$ 0,030  | **≈ US$ 0,044 (R$ 0,24)**   | Comparação cega na 03F                                                             |
| Claude Opus 5.5                   | 4 / 20          | US$ 0,019   | US$ 0,0092  | US$ 0,060  | **≈ US$ 0,088 (R$ 0,48)**   | Fora da 03F (teto de R$ 5)                                                         |
| Google Gemini Flash (família)     | não verificado  | —           | —           | —          | —                           | Exigiria novo adaptador, novo contrato de dados e nova transferência internacional |
| OpenAI (modelos "mini" com visão) | não verificado  | —           | —           | —          | —                           | Idem                                                                               |

- Em todos os modelos a **resposta** é a maior parcela do custo. Limitar
  `max_tokens` e o esforço na extração reduz mais o custo do que reduzir a
  imagem, que piora a leitura das linhas.
- A reserva do teto (`budget.ts`) usa o pior caso, não esta estimativa:
  entrada a 2 caracteres por token, preço de escrita em cache e `max_tokens`
  inteiro.

- Os preços de Google e OpenAI **não foram verificados**: o site oficial do
  Google não estava acessível nesta sessão e as fontes secundárias divergem.
  Exemplos: [ai.google.dev/pricing](https://ai.google.dev/gemini-api/docs/pricing),
  [Vertex AI pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)
  e agregadores como
  [Finout](https://www.finout.io/blog/gemini-pricing-in-2026).
- **Custo por leitura com Haiku 5.5:** visão (1 foto, ≈ US$ 0,0022) mais os
  capítulos 6 e 7 em texto (≈ US$ 0,0016 cada, medido na validação da 02F)
  dão **≈ US$ 0,0054 (≈ R$ 0,03)**.
- **Pior caso com Haiku 5.5** (decisão 1: uma mão; 3 envios, novas
  tentativas): ≈ US$ 0,013 (≈ R$ 0,07).
- **03F com teto de R$ 5** (decisão 7): ~US$ 0,046 por foto nos dois modelos.
  Com 20 fotos seriam ~US$ 0,92 ≈ R$ 5,07, acima do teto antes de qualquer
  nova tentativa. **Proposta: 15 fotos × 2 modelos ≈ US$ 0,69 ≈ R$ 3,80**,
  com folga para novas tentativas. O pior caso conferido antes da execução
  tem de caber em R$ 5.
- Câmbio de referência: 5,5, o mesmo do projeto.
- Recomendação: **Haiku 5.5 como hipótese**, a confirmar numa avaliação
  cega Haiku × Sonnet sobre fotos de teste consentidas (03F). Sem essa
  avaliação, a precisão de linhas é desconhecida.

## 13. Controle de custo

1. Checagens no navegador antes de qualquer envio (grátis).
2. Uma única chamada de visão por foto aceita; a avaliação de adequação vem
   na mesma resposta.
3. Imagem preparada no limite útil do provedor (≤ 2 576 px e ≤ 4 784
   tokens; ~4 661 numa foto de 12 MP), sem enviar bytes que seriam
   descartados.
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

| Etapa   | Entrega                                                                                                                                                                | Chamadas pagas              |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **03A** | Este plano (aprovação)                                                                                                                                                 | Não                         |
| **03B** | ✅ Concluída: consentimento específico, escolha da mão, reprocessamento sem EXIF, checagens de luz/nitidez, textos de nova foto (só navegador)                         | Não                         |
| **03C** | ✅ Concluída: contrato `PalmObservation`, validador, biblioteca autoral da quiromancia, motor observações → itens, fixtures                                            | Não                         |
| **03D** | Adaptador com imagem, provedor simulado de visão, Route Handler `POST` atrás de flag (consentimento e arquivo conferidos no servidor), sem persistência, teto e dedupe | Não (só simulado)           |
| **03E** | Capítulos 6 e 7 no pipeline da 02F: validador da quiromancia, biblioteca alternativa, apresentação                                                                     | Não                         |
| **03F** | Conjunto de fotos de teste consentidas e avaliação cega Haiku × Sonnet (teto próprio, autorização separada)                                                            | **Sim, autorizada à parte** |
| **03G** | Revisão de privacidade: textos de consentimento, retenção, exclusão, documentação                                                                                      | Não                         |
| (spike) | MediaPipe no navegador: **adiado** (decisão 2)                                                                                                                         | Não                         |

Cada etapa termina com testes, lint e tipos, como na Fase 02.

## 15. Riscos e decisões

Riscos técnicos:

- **Precisão das linhas:** modelos multimodais erram trajeto e comprimento,
  sobretudo com linhas finas, peles mais escuras com pouca luz ou palmas
  muito marcadas. Mitigação: categorias grosseiras, `not_visible`, avaliação
  com fotos variadas.
- **Viés:** a qualidade pode variar com o tom de pele e a iluminação. A
  avaliação precisa de amostra diversa e consentida.
- **Fotos de teste (decisão 3):** fotos reais de voluntários adultos com
  termo assinado, mantidas fora do repositório e apagadas ao fim da
  avaliação. A amostra precisa ser diversa (tons de pele, idades adultas,
  luz).
- **Reprodutibilidade:** a mesma foto pode gerar observações diferentes em
  chamadas diferentes. A medir na 03F; dá para exigir concordância em duas
  leituras, ao custo de dobrar a visão.
- **iOS/HEIC e câmeras:** o reprocessamento no canvas resolve na maioria dos
  casos; o HEIC fora do Safari continua com orientação para JPG.
- **Limite de corpo:** o Route Handler da 03D confere o tamanho (≤ 2,5 MB) e
  recusa acima disso. O limite de 1 MB das Server Actions não se aplica.
- **Expectativa do usuário:** a quiromancia apresentada como leitura
  simbólica, com aviso no início dos capítulos, como na astrologia.

As decisões da 03A estão na seção 0. Diretrizes registradas na aprovação da
03C (11/11/2026):

1. **ZDR não é pré-requisito do MVP.** O desenvolvimento segue sem retenção
   zero, mas a **retenção real do provedor** (30 dias na API comercial, até
   2 anos para conteúdo sinalizado, ou ZDR, se habilitada) **precisa ser
   verificada na conta antes do lançamento**, e o consentimento deve refletir
   o que for confirmado.
2. **A 03D usará um Route Handler `POST` dedicado** em vez de Server Action,
   com limites próprios de corpo. O servidor confere:
   - o consentimento (versão do texto e aceite);
   - maioridade declarada e mão;
   - tipo e assinatura JPEG, dimensões e tamanho;
   - limite de envios;
   - flag interna.

   Nada é persistido.

3. **A 03F começa com uma amostra piloto** de fotos autorizadas de
   voluntários. A ampliação depende da qualidade observada e do orçamento (teto
   de R$ 5; nenhuma chamada paga sem autorização específica).
4. **O texto definitivo do consentimento e a transferência internacional**
   (provedor nos EUA) **exigem revisão jurídica** antes da operação pública.

Continuam pendentes:

1. Tamanho exato da amostra piloto da 03F.
2. Calibração dos limiares de luz e foco com as fotos dos voluntários.
3. Revisão das categorias visuais da 03C depois da 03F.

## 16. Conclusão da Fase 03B (11/11/2026)

Preparação da foto **totalmente no navegador**: nada é enviado, armazenado
ou analisado, e nenhuma chamada paga foi feita.

### Comportamento implementado

1. **Orientações** (tela inicial e guia): luz natural, palma aberta, mão
   inteira, câmera paralela, mão dominante, o que evitar.
2. **Consentimento** (`/leitura-das-maos/consentimento`):
   - mostra finalidade, o que acontece nesta versão, a futura análise
     (provedor nos EUA), a retenção externa (30 dias e até 2 anos se
     sinalizado) e os direitos;
   - duas caixas **desmarcadas** por padrão: "Tenho 18 anos ou mais" e
     "Autorizo o uso da foto…";
   - versão do texto (`CONSENT_VERSION = "03b.1"`) e data registradas só em
     memória;
   - opção de retirar o consentimento, que descarta foto, mão e aceite.
3. **Mão**: direita ou esquerda (mão dominante), exibida na captura, na
   pré-visualização e na prévia.
4. **Captura**:
   - câmera nativa (`capture="environment"`), galeria ou arrastar e soltar;
   - a tela de foto **exige** consentimento e mão; sem eles, leva ao
     consentimento.
5. **Verificações locais:**
   - bloqueiam: formato, arquivo vazio, 15 MB, ≥ 600 px no lado menor,
     falha de decodificação (HEIC fora do Safari), falha do canvas e foto
     preparada acima de 2,5 MB;
   - só avisam, apresentadas como **aproximadas e sem garantia**: luz
     (escura ou clara demais), reflexo, contraste e foco (variância do
     Laplaciano).
6. **Reprocessamento sem metadados:**
   - redesenho em canvas com a orientação do EXIF aplicada;
   - redução ao limite útil do provedor (≤ 2 576 px e ≤ 4 784 tokens, sem
     ampliar) com suavização de alta qualidade;
   - JPEG 0,92, descendo a 0,88 e 0,85 só se passar do teto;
   - EXIF, GPS, XMP e IPTC descartados.
7. **Pré-visualização** da imagem preparada, com mão, resolução, tamanho,
   "EXIF/GPS: removidos" e autoconferência.
8. **Descartar e tirar outra:** botões "Tirar outra" (celular), "Trocar
   foto" (computador) e "Descartar".
9. **Permissões e erros:**
   - câmera ou galeria fechadas sem foto (evento `cancel`, que inclui
     permissão negada) mostram orientação sobre a permissão e a galeria;
   - erro inesperado no preparo vira mensagem, não tela quebrada;
   - arquivos incompatíveis e pequenos têm mensagens próprias.

### Verificação em navegador real (Chromium, emulação Pixel 7)

- JPEG de 4 032 × 3 024 com orientação EXIF 6, GPS, fabricante e modelo
  preparado como **1 643 × 2 191** (retrato, orientação aplicada, 4 661
  tokens).
- Arquivo preparado **sem** EXIF, GPS ou fabricante; só JFIF e perfil de
  cor.
- Nenhuma requisição com a imagem: as únicas requisições que não eram GET
  foram internas do servidor de desenvolvimento.
- Consentimento obrigatório, mensagens de PDF e de foto pequena conferidos.

### Arquivos

- Novos:
  - `src/features/palm-reading/consent.ts`;
  - `src/features/palm-reading/lib/prepare-image.ts`;
  - `src/features/palm-reading/lib/quality.ts`;
  - `src/features/palm-reading/components/consent-form.tsx`;
  - `src/app/(jornada)/leitura-das-maos/consentimento/page.tsx`;
  - `src/components/ui/checkbox.tsx`;
  - testes `prepare-image.test.ts`, `quality.test.ts`,
    `load-image.test.ts` e `consent-form.test.tsx`.
- Alterados:
  - `lib/load-image.ts` (pipeline com dependências injetáveis);
  - `lib/image-validation.ts` (novos códigos de erro);
  - `palm-photo-context.tsx` (consentimento e mão em memória);
  - `components/photo-capture.tsx`, `photo-capture.test.tsx`,
    `photo-guide.tsx` e `demo-preview.tsx`;
  - página `leitura-das-maos/page.tsx`;
  - `src/config/routes.ts` e `src/components/ui/index.ts`.
- O motor astrológico não foi alterado.

### Limitações restantes

- Os limiares de qualidade são provisórios. Foram testados com imagens
  sintéticas e serão calibrados com fotos dos voluntários; podem gerar
  avisos falsos ou deixar passar fotos ruins.
- Não há detecção de mão (decisão 2): nada confirma que a foto é uma palma
  nem que é a mão escolhida. Isso fica para a autoconferência e para a
  avaliação de adequação na chamada de visão (03D).
- O evento `cancel` depende do navegador (Chrome 113+, Safari 16.4+, Firefox
  91+). Em navegadores antigos, fechar a câmera simplesmente não mostra
  mensagem.
- HEIC só é decodificado no Safari; nos outros navegadores há orientação
  para usar JPG.
- Consentimento e foto vivem só na memória da aba: recarregar a página
  descarta os dois, de propósito.
- O texto do consentimento é **provisório** até a revisão jurídica
  (decisão 6). A retenção do provedor ainda precisa ser confirmada na conta
  (ZDR ou 30 dias).
- O tamanho real dos arquivos preparados a partir de fotos de celular será
  medido na 03F; o Route Handler da 03D deve aceitar até 2,5 MB.

## 17. Conclusão da Fase 03C (11/11/2026)

Motor estruturado de interpretação simbólica das mãos, **sem visão e sem
chamadas pagas**. Detalhes em `docs/fase-03c-observacoes-e-biblioteca.md`.

- Contrato `PalmObservation` (`analysis/contract.ts`): 9 características em
  categorias fechadas, visibilidade categórica, evidência obrigatória e
  "não visível" sem valor. Não há comprimento da linha da vida, e a linha do
  destino entra só como "presente".
- Validador (`analysis/validate-observation.ts`):
  - recusa estrutura malformada, campos e valores fora do contrato, mão
    divergente e conteúdo sensível;
  - rebaixa evidência fraca, interpretativa ou repetida, destino não nítido e
    inconsistências;
  - status `complete`, `partial` ou `insufficient`.
- Biblioteca (`analysis/library.ts`): definição visual, observação do sistema
  e leitura simbólica por categoria, mais os quatro tipos elementares.
  Regras editoriais conferidas em teste; referências da tradição
  documentadas.
- Motor (`analysis/engine.ts`): fatos rastreáveis → itens dos capítulos 6 e
  7, ressalva para o parcial e limitações para o não visível. A evidência fica
  só na auditoria.
- 56 testes novos com cenários fictícios; suíte completa, lint, tipos e build
  passando.
