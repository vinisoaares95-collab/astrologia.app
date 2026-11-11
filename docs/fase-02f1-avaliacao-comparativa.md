# Fase 02F.1 — Preparação da avaliação real da IA

Avaliação comparativa **Claude Sonnet 5.5 × Claude Haiku 5.5** preparada e
testada com provedores simulados. **Nenhuma chamada paga foi feita:** não há
autorização explícita do proprietário para gastar nem credencial configurada
nesta sessão.

## 1. Auditoria

- Commit `559fe6b` confirmado; árvore limpa e idêntica a
  `origin/claude/upbeat-pasteur-x5y1k2`; nada pendente.
- Arquitetura da 02F preservada (mesmo fluxo, contratos e validador).
- Preços oficiais reconferidos em 11/11/2026
  ([preços](https://platform.claude.com/docs/en/about-claude/pricing)),
  sem mudanças: Sonnet 5.5 US$ 2 / 10 por milhão de tokens (escrita em
  cache 2,50; leitura 0,10); Haiku 5.5 US$ 0,10 / 0,50 (escrita 0,125;
  leitura 0,01; até 100 mil tokens por prompt).
- Saída estruturada suportada pelos dois modelos (lista `supportedModels`
  de [saídas estruturadas](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)).
- **Achado:** o Haiku 5.5 não tem fallback do servidor para recusas. Com a
  configuração da 02F, apontar `SIDERA_AI_MODEL=claude-haiku-5-5` enviaria
  `fallbacks: "default"`, que a API não aceita para esse modelo. Corrigido:
  o parâmetro só é enviado para modelos da lista `SERVER_FALLBACK_MODELS`.

## 2. Ajustes técnicos

| Ajuste                                                                                                                                                                                 | Onde                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Fallback entre modelos opcional; **desligado na avaliação**; nunca enviado ao Haiku 5.5; `SIDERA_AI_REFUSAL_FALLBACK=0` desliga no produto                                             | `anthropic-provider.ts`, `config.ts`, `eval-config.ts` |
| Fallback para a biblioteca preservado                                                                                                                                                  | `generate.ts` (inalterado)                             |
| Modelo pedido (`requestedModel`) e modelo que respondeu (`model`) em cada tentativa; total de divergências (`modelMismatches`)                                                         | `contract.ts`, `generate.ts`                           |
| Custos de **todas** as tentativas: reprovadas, truncadas, recusadas e falhas que podem ter sido cobradas (timeout/rede, pelo pior caso); `unpricedCalls` sinaliza custo não calculável | `budget.ts`, `generate.ts`                             |
| Teto de gasto com reserva do pior caso por chamada (seguro em paralelo)                                                                                                                | `budget.ts`                                            |
| Avaliação cega: execução, rótulos aleatórios, ficha e chave separada                                                                                                                   | `evaluation.ts`, `paid-eval.test.ts`                   |
| Nenhum prompt em artefatos: só textos gerados, IDs e métricas (testado)                                                                                                                | `evaluation.ts`                                        |

## 3. Configuração da avaliação

- **Casos fictícios** (12/05/1990, São Paulo): horário exato (14:30),
  aproximado (14:30 ± 2 h) e desconhecido.
- **Modelos:** `claude-sonnet-5-5` e `claude-haiku-5-5` → 6 relatórios de
  5 capítulos.
- **Condições idênticas** (testado: as requisições dos dois modelos são
  iguais byte a byte): mesmo relatório do motor, system prompt, dados do
  capítulo e schema; esforço `medium` explícito nos dois (o padrão difere:
  Sonnet `high`, Haiku `medium`); `max_tokens` 6 000 por capítulo; até 2
  tentativas; timeout 120 s; sem fallback entre modelos.
- **Avaliação cega:** os 6 relatórios recebem rótulos A–F em ordem
  sorteada (`crypto.randomInt`). Os arquivos de leitura não contêm modelo,
  custo, latência nem tokens (testado). A ficha (`cego/ficha.md`) agrupa os
  dois relatórios de cada caso e traz os 10 critérios em escala 1–5. A
  chave (`chave.json`) liga rótulo → modelo, com métricas e custos, e só
  deve ser aberta depois das notas.
- **Critérios:** personalização; profundidade interpretativa; clareza da
  linguagem brasileira; coerência narrativa; ausência de informações
  inventadas; rastreabilidade; respeito às limitações do mapa; repetições;
  qualidade da síntese; qualidade das perguntas de reflexão.
- **Tamanho não é critério:** a ficha diz isso explicitamente; o número de
  palavras aparece só como informação.
- Capítulos reprovados aparecem como "texto da biblioteca (geração
  reprovada)", com o motivo — fazem parte do resultado do modelo.

## 4. Controle de custos

| Medida               | Como                                                                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Teto total           | R$ 15 (`EVAL_BUDGET_BRL`); configurável só para baixo                                                                                                    |
| Câmbio               | R$ 5,50 por US$ (acima da PTAX de 28/10/2026, R$ 5,3420, para dar folga); ajustável por `SIDERA_AI_USD_BRL` → teto de US$ 2,73                           |
| Antes de executar    | `preflight` soma o pior caso de **todas** as 60 chamadas possíveis (6 relatórios × 5 capítulos × 2 tentativas) e aborta se passar do teto                |
| Durante              | Cada chamada reserva o próprio pior caso; se não couber, não é feita e o capítulo vai para a biblioteca                                                  |
| Pior caso (estimado) | **R$ 11,91** (Sonnet US$ 2,06 + Haiku US$ 0,10), com entrada a 2 caracteres por token, preço de escrita em cache e 6 000 tokens de saída em toda chamada |
| Depois               | Gasto real pelo `usage` da API; `chave.json` traz total por modelo, custo por relatório, tentativas, falhas e divergências de modelo                     |

**Limites de gasto na conta (recomendado antes de rodar):**

- A documentação da Anthropic descreve limite mensal de gasto por
  organização (página Billing) e **por workspace** (página Workspaces, com
  alertas). Recomendação: criar um workspace e uma chave só para a
  avaliação, com limite de US$ 3. O workspace padrão não aceita limite
  próprio. Fontes: [limites de uso](https://platform.claude.com/docs/en/api/rate-limits),
  [workspaces](https://platform.claude.com/docs/en/manage-claude/workspaces).
- Não verifiquei esses limites na sua conta (não tenho acesso a ela); o
  teto do código funciona independentemente deles.

## 5. Como autorizar e executar

1. Criar a chave num workspace com limite de gasto (recomendado).
2. Configurar a chave **fora do repositório**: como segredo de rede da
   sessão para `api.anthropic.com` no cabeçalho `x-api-key` (então usar
   `SIDERA_AI_KEY_VIA_PROXY=1`), ou como `ANTHROPIC_API_KEY` no ambiente
   do servidor. Nunca em `.env` versionado, documento ou chat.
3. Autorizar explicitamente e rodar:

```bash
SIDERA_AI_PAID_TESTS=1 SIDERA_AI_KEY_VIA_PROXY=1 npm test -- paid-eval
```

Os artefatos vão para `docs/avaliacao-ia/<data>/` (`cego/Relatório-A.md` …
`cego/Relatório-F.md`, `cego/ficha.md`, `chave.json`).

## 6. Resultados comparativos

**Não há resultados:** os testes pagos não foram autorizados nem havia
credencial. Nenhum texto foi gerado por IA até aqui.

## 7. Testes

`ai/evaluation.test.ts` (26 testes, sem rede):

- **Fallback:** desligado não envia `betas`/`fallbacks`; nunca enviado ao
  Haiku 5.5; padrão de produção do Sonnet mantido; variável de desligamento;
  registro de modelo pedido × modelo que respondeu; fallback para a
  biblioteca intacto.
- **Teto:** fórmula do pior caso; bloqueio antes da chamada; estouro vira
  biblioteca sem nova tentativa; capítulos em paralelo não ultrapassam o
  teto; gasto real e liberação da reserva; timeout cobra o pior caso e erro
  4xx não cobra; custo de tentativas com falha entra no total; modelo sem
  preço não é chamado.
- **Planejamento:** 30 chamadas por modelo; pior caso abaixo de R$ 15;
  teto não sobe acima de R$ 15; bloqueio sem autorização ou sem credencial,
  sem expor a chave.
- **Comparação simulada:** 6 relatórios de 5 capítulos; requisições
  idênticas para os dois modelos; rótulos A–F e chave completa; ordem
  sorteada; relatórios cegos sem modelo, custo ou tokens; nenhum prompt nos
  artefatos; ficha com os 10 critérios e o aviso sobre tamanho; resumo por
  modelo.

`ai/paid-eval.test.ts`: ignorado (sem autorização e sem credencial).

## 8. Problemas encontrados

- Fallback do servidor seria enviado ao Haiku 5.5 (corrigido).
- Na 02F, falhas sem `usage` (timeout, rede) ficavam com custo `null` no
  total; agora entram pelo pior caso quando podem ter sido cobradas.
- O sorteio da ordem cega precisa de fonte aleatória real; um gerador
  simples com semente pequena mantinha a ordem original (detectado em
  teste; a avaliação usa `crypto.randomInt`).
- Os valores do pior caso são estimativas de teto, não previsão de gasto:
  o gasto real esperado é bem menor (a saída real costuma ficar abaixo do
  limite de 6 000 tokens).
- A avaliação humana continua necessária: a validação automática é léxica.

## 9. Arquivos

Novos: `ai/budget.ts`, `ai/evaluation.ts`, `ai/eval-config.ts`,
`ai/evaluation.test.ts`, este documento.

Alterados: `ai/anthropic-provider.ts`, `ai/config.ts`, `ai/contract.ts`,
`ai/generate.ts`, `ai/mock-provider.ts`, `ai/pricing.ts`,
`ai/paid-eval.test.ts` (agora comparativo), `.env.example`,
`docs/DECISIONS.md`, `README.md`.
