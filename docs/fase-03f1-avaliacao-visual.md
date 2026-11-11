# Fase 03F.1 — Preparação da avaliação visual real

Status: **preparada** (11/11/2026). Nenhuma chamada paga, nenhuma foto real
processada, nenhuma credencial alterada, sem deploy. O orçamento de
referência (R$ 7) **ainda não está autorizado para consumo**. A execução
real (03F.2) depende de autorização expressa.

## 1. Mecanismo preparado

Avaliação **só da extração visual**, separada da redação e do fluxo
comercial:

```
manifesto + fotos (pasta FORA do repositório)
  → preparação em memória (mesmas checagens do endpoint)      evaluation/intake.ts
  → plano financeiro (funções reais de custo)                 evaluation/estimate.ts
  → para cada foto × modelo (ordem alternada):
      orçamento EXCLUSIVO → adaptador visual 03D → validador 03C   evaluation/run.ts
  → auditoria por chamada → relatórios cegos + restritos      evaluation/report.ts
```

- **Reaproveita** o orquestrador do produto (`analyzePalmImage`: mesmo
  prompt `03d.1`, schema, categorias, 2 tentativas, validador 03C), o
  adaptador Anthropic de visão e o controlador de orçamento
  (`withVisionBudget`). Os capítulos 6 e 7 **não** são gerados.
- **Não altera o produto.** Só mudou em `vision/analyze.ts` a auditoria
  interna, que agora guarda a característica afetada por cada código do
  validador (`notes`); o resultado do endpoint é o mesmo. Limites e tetos
  comerciais (`server/config.ts`) intocados.
- **Mesmas condições** para os dois modelos: esforço médio, `max_tokens`
  4 000, timeout de 45 s, até 2 tentativas, sem fallback entre modelos.
- **Preparação das fotos:** orientação corrigida, lado maior ≤ 2 576 px,
  ≤ 4 784 tokens visuais, JPEG sem metadados, ≤ 2,5 MB, conferido com o
  mesmo `inspectJpeg` do servidor. Usa `sharp` (agora `devDependency`, a
  mesma versão já instalada pelo Next) no lugar do canvas do navegador.
  Nada preparado é gravado; os bytes são zerados no fim.

### Arquivos

| Arquivo                              | Papel                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `evaluation/config.ts`               | Modelos, condições, teto de R$ 7, portão em camadas                    |
| `evaluation/estimate.ts`             | Custo esperado e pior caso com as funções do sistema                   |
| `evaluation/intake.ts`               | Manifesto, preparação e checagens das fotos                            |
| `evaluation/run.ts`                  | Execução com medição e orçamento exclusivo                             |
| `evaluation/report.ts`               | Ficha cega, referência, relatório técnico, apuração                    |
| `evaluation/session.ts`              | Plano → execução → gravação                                            |
| `evaluation/vision-eval.run.test.ts` | Pontos de entrada (plano, execução paga, apuração), pulados por padrão |
| `evaluation/evaluation.test.ts`      | 38 testes com simuladores e imagens sintéticas                         |

Tudo em `src/features/palm-reading/`.

### O que é registrado (por foto × modelo e por chamada)

- características identificadas (valor e visibilidade: nítida ou parcial);
- características não visíveis (motivo) e as **rebaixadas** pelo
  validador (o modelo disse visível; o sistema não aceitou, com o código);
- evidências visuais descritas;
- reprovações do validador (códigos por característica);
- resultado de cada tentativa e se precisou de nova tentativa;
- modelo que efetivamente respondeu;
- tokens de entrada e saída, custo e latência por chamada;
- observação final validada.

Também: concordância entre os modelos (rotulada como **não** exatidão).

## 2. Critérios de comparação

O validador mede formato e consistência; **passar nele não é acerto**. O
relatório técnico não declara vencedor. A exatidão vem da revisão humana:

1. **Referência cega do revisor** (`revisao/referencia.csv`), preenchida
   olhando as fotos **antes** de ver as observações: visibilidade e valor
   de cada característica, com o mesmo critério dos modelos ("na dúvida,
   não visível").
2. **Conferência das evidências** (`revisao/ficha.csv`): observadores A e B,
   sorteados por foto, sem nome de modelo; para cada observação visível, a
   evidência confere (`sim`, `parcial`, `nao`).
3. **Apuração automática** (`restrito/apuracao.md`), depois da revisão:

| Critério                                      | Por que importa                                           |
| --------------------------------------------- | --------------------------------------------------------- |
| **Falso visível** (afirmou o que não aparece) | O erro mais grave: vira interpretação de algo inexistente |
| Valor correto quando os dois veem             | Exatidão da categoria                                     |
| Evidência confere                             | O modelo olhou o lugar certo?                             |
| Deixou de ver o que estava nítido             | Reduz a leitura, mas não engana                           |
| Reprovações e novas tentativas                | Custo e latência reais                                    |
| Custo e latência por foto                     | Viabilidade                                               |

Com até 8 fotos, os números orientam a decisão; não são medida estatística.
Sugestão de leitura: um modelo só é aceitável se tiver **zero ou quase zero
falso visível** em linhas; depois comparar exatidão, custo e latência.

## 3. Custos (calculados com as funções reais)

Comando de plano (grátis) aplicado a 8 imagens sintéticas de 3 024 × 4 032
(preparadas para 1 638 × 2 184, perto do teto de tokens visuais), câmbio de
R$ 5,50 (com folga sobre a PTAX):

| Modelo     | Esperado por foto | Pior caso por chamada | Pior caso por foto (2 tentativas) | Esperado (8)           | Pior caso (8)          |
| ---------- | ----------------- | --------------------- | --------------------------------- | ---------------------- | ---------------------- |
| Haiku 5.5  | US$ 0,0020        | US$ 0,0032            | US$ 0,0064                        | US$ 0,016              | US$ 0,052              |
| Sonnet 5.5 | US$ 0,0400        | US$ 0,0645            | US$ 0,1290                        | US$ 0,320              | US$ 1,032              |
| **Total**  |                   |                       |                                   | **US$ 0,34 (R$ 1,85)** | **US$ 1,08 (R$ 5,96)** |

- **Pior caso** = `visionWorstCaseUsd` (o valor que o orçamento reserva antes
  de cada chamada): texto a 2 caracteres por token, imagem no teto de
  4 784 tokens, preço de escrita de cache, todo o `max_tokens`, 2
  tentativas em todas as fotos.
- **Esperado** = `estimateCostUsd` com a imagem nas dimensões reais, texto a
  3,5 caracteres por token, ~2 500 tokens de saída e 1 tentativa. A saída
  real (raciocínio) é a maior incerteza: com saída de 4 000 tokens em todas
  as chamadas o esperado fica perto do pior caso.
- **Teto seguro de execução:** US$ 1,0833 (R$ 5,96), o pior caso planejado.
  O orçamento exclusivo é criado com esse teto (nunca acima de R$ 7).
- **Cabem 9 fotos** no pior caso com R$ 7; as **8 fotos cabem** sem reduzir
  amostra nem tentativas. Só com câmbio acima de ~R$ 6,46 o pior caso
  passaria de R$ 7.
- Se não couber (câmbio, orçamento menor): o plano diz quantas fotos cabem;
  as alternativas seguras são reduzir a amostra
  (`manifesto.json` com menos fotos) ou usar 1 tentativa
  (`SIDERA_PALM_EVAL_MAX_ATTEMPTS=1`: pior caso ≈ US$ 0,54, R$ 2,98). Nada
  de baixar `max_tokens` ou mudar o prompt: isso mudaria o que está sendo
  avaliado.

**Controles do orçamento exclusivo:**

1. **Antes de tudo:** se o pior caso total passar do orçamento, nada é
   chamado (`over_budget`).
2. **Antes de cada foto × modelo:** só começa se o saldo cobre todas as
   suas tentativas no pior caso.
3. **Em cada chamada:** reserva do pior caso e acerto pelo consumo real.
4. **Ao atingir o teto:** a avaliação para; o restante fica "não executado"
   no relatório.

## 4. Recebimento seguro das fotografias

### Autorização específica (antes de receber qualquer foto)

Cada voluntário adulto assina (ou aceita por escrito) um termo **específico
desta avaliação**, separado do consentimento do produto, com:

- finalidade: comparar dois modelos de IA na **descrição** de características
  visíveis da palma; não há leitura nem interpretação;
- que a foto será enviada à Anthropic (Haiku 5.5 e Sonnet 5.5), conforme as
  políticas do provedor, que podem incluir retenção pelo provedor por
  período próprio (não tratar a ausência de armazenamento no Sidera como
  ausência de retenção pelo provedor);
- que a foto deve mostrar **só a palma** (sem rosto, documentos, tatuagens
  ou joias identificáveis, de preferência sem anéis);
- quem verá a foto (o revisor) e que ela não entra em relatórios nem no Git;
- prazo de exclusão (sugestão: até 7 dias após a revisão) e o direito de
  retirar a autorização a qualquer momento, antes ou depois da execução;
- maioridade declarada.

O termo assinado fica **fora** do Sidera e do repositório. No Sidera, cada
autorização é só um código opaco (`AUT-03F-01`…), sem nome.

### Envio e guarda

- Os voluntários enviam a foto **diretamente ao responsável** por um canal
  privado (nunca por issue, PR, chat compartilhado ou repositório).
- O responsável cria uma pasta **fora do repositório**, com acesso só dele
  (ex.: `chmod 700`), e coloca as fotos com nomes neutros
  (`p01.jpg`…) e o `manifesto.json`:

  ```json
  [
    { "arquivo": "p01.jpg", "mao": "direita", "autorizacao": "AUT-03F-01" },
    { "arquivo": "p02.jpg", "mao": "esquerda", "autorizacao": "AUT-03F-02" }
  ]
  ```

  O manifesto aceita no máximo 8 itens, só esses três campos, nome de
  arquivo sem pastas e autorização no formato `AUT-03F-NN`.

- O Sidera recusa pasta dentro do repositório e grava os relatórios só em
  `avaliacao-ia/` (ignorada pelo Git) ou fora do repositório.
- Os relatórios identificam as fotos como `foto-01`…; a correspondência com
  os arquivos fica em `mapa-fotos.json`, **na pasta das fotos**.
- Nenhum relatório contém imagem, nome de arquivo, caminho, código de
  autorização, credencial ou prompt (testado).

### Exclusão após a avaliação

1. Concluir a revisão e a apuração.
2. Apagar a pasta das fotos inteira (fotos, `manifesto.json`,
   `mapa-fotos.json`): `rm -rf /caminho/da/pasta`; esvaziar a lixeira e
   apagar cópias recebidas no canal de envio (mensagens, downloads).
3. Se a sessão for em nuvem, apagar também o que tiver sido enviado ao
   contêiner (o contêiner é efêmero, mas não conte com isso).
4. Manter só os relatórios em `avaliacao-ia/` (sem imagens). Se o voluntário
   pedir, apagar também as linhas da foto dele nos relatórios.
5. Registrar fora do repositório a data de exclusão de cada `AUT-03F-NN`.
6. Pedir ao provedor a exclusão, se o termo ou a política aplicável
   previr, sabendo que a retenção do provedor segue as regras dele.

## 5. Comandos

Plano (grátis, sem chamadas; grava `plano.md`):

```bash
SIDERA_PALM_EVAL_MODE=plan \
SIDERA_PALM_EVAL_DIR=/caminho/fora/do/repo/fotos-03f \
npx vitest run src/features/palm-reading/evaluation/vision-eval.run.test.ts
```

**Execução paga (só com autorização expressa; não executada):**

```bash
SIDERA_PALM_EVAL_MODE=run \
SIDERA_PALM_EVAL_PAID=1 \
SIDERA_PALM_EVAL_CONFIRM=autorizo-avaliacao-visual-03f \
SIDERA_PALM_EVAL_DIR=/caminho/fora/do/repo/fotos-03f \
SIDERA_AI_KEY_VIA_PROXY=1 \
npx vitest run src/features/palm-reading/evaluation/vision-eval.run.test.ts
```

- `SIDERA_AI_KEY_VIA_PROXY=1` quando a chave é um segredo de rede da sessão
  (injetado pelo proxy); localmente, use `SIDERA_ANTHROPIC_API_KEY` no
  ambiente, sem nunca imprimir o valor.
- Opcionais: `SIDERA_PALM_EVAL_BUDGET_BRL` (só para baixo de R$ 7),
  `SIDERA_PALM_EVAL_MAX_ATTEMPTS=1`, `SIDERA_AI_USD_BRL` (câmbio do dia),
  `SIDERA_PALM_EVAL_OUT_DIR`.
- Saída: `avaliacao-ia/03f-<data-hora>/` com `plano.md`, `revisao/` e
  `restrito/`.

Apuração (grátis), depois de preencher `referencia.csv` e `ficha.csv`:

```bash
SIDERA_PALM_EVAL_MODE=score \
SIDERA_PALM_EVAL_REPORT_DIR=avaliacao-ia/03f-<data-hora> \
npx vitest run src/features/palm-reading/evaluation/vision-eval.run.test.ts
```

Sem `SIDERA_PALM_EVAL_MODE`, os três ficam pulados (`npm test` nunca chama
nada). Variáveis comerciais ou da 02F.1 não abrem a avaliação.

## 6. Testes

38 testes, só com simuladores e imagens sintéticas:

- portão fechado por padrão, variáveis de outras fases, pasta dentro do
  repositório, frase errada, sem credencial, produção, valor da chave nunca
  exposto;
- custos iguais aos reservados pelo orçamento; 8 fotos cabem em R$ 7;
  orçamento menor indica quantas fotos cabem;
- registro de observações, não visíveis, evidências, tentativas, modelo,
  custo e latência; ordem alternada; imagens zeradas; nenhum capítulo;
- reprovações e rebaixamentos por característica; recusa, tempo esgotado,
  indisponibilidade com recuperação, resposta cortada; 1 tentativa;
- teto: verificação prévia, reserva, interrupção e "não executado";
- CSV; ficha cega sem nomes de modelo e chave sorteada por foto; relatório
  técnico sem vencedor; apuração pela leitura do revisor;
- manifesto inválido (lista, vazio, > 8, caminho, nome de pessoa, campo
  extra, mão); preparação com orientação EXIF, remoção de metadados e
  original zerado; foto pequena ou ilegível;
- sessão completa: bloqueada sem portão, plano sem chamadas, recusa acima
  do orçamento, relatórios sem nomes de arquivo, caminhos ou imagens.

Verificação: 941 testes passando (5 pagos/planejamento pulados), lint,
tipos e build de produção (nada da avaliação no bundle).

## 7. Pendências antes da avaliação

1. **Autorização expressa** da execução paga e do orçamento (R$ 7; pior
   caso calculado R$ 5,96).
2. **Termo específico** desta avaliação e, se possível, revisão jurídica
   dele (a revisão jurídica do produto segue pendente).
3. **Recebimento** de até 8 fotos de voluntários adultos, com variedade
   (mão direita e esquerda, luz boa e ruim, ao menos uma foto difícil).
4. **Conferir a política de retenção** do provedor para entradas da API e
   informar no termo.
5. **Câmbio do dia** em `SIDERA_AI_USD_BRL` e novo plano com as fotos
   reais (`SIDERA_PALM_EVAL_MODE=plan`).
6. **Escolher o revisor** (alguém que não saiba qual modelo é A ou B) e
   combinar o prazo de exclusão.
7. Continuam de fases anteriores: calibração dos limiares de qualidade,
   revisão das categorias 03C com o resultado, estado compartilhado antes
   de uso público, registro jurídico do consentimento e a revisão dos
   limites comerciais de orçamento (pendência da 03E; esta avaliação usa
   orçamento próprio e não altera os limites comerciais).
