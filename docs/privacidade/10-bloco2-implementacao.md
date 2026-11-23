# Fase 03G.3, Bloco 2 — implementação local do registro de consentimento

**Registro de 23/11/2026.**

- **Limite do que foi feito:** implementação e testes só locais. Não houve
  deploy nem chamada paga.
- **Inalterado:** os modelos de IA, a interpretação das mãos e a política
  de privacidade, que segue sem publicar.
- **Produção:** **bloqueada por código**. Ali, a leitura das mãos responde
  503 mesmo com tudo configurado. Isso foi conferido no servidor de
  produção local.

Base: a especificação `09-bloco2-especificacao.md`, com os ajustes da
aprovação:

- horário em UTC com segundos;
- decisão D8: resultado compartilhado em vez de nova análise;
- revogação só pelo recibo.

## 1. O que foi implementado

| Parte                                                                                         | Arquivo                                                             |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Modelos `PalmConsentRecord`, `PalmConsentUse`, `PalmSharedResult`                             | `prisma/schema.prisma`                                              |
| Primeira migração (inclui `Product`) e restrições `CHECK`                                     | `prisma/migrations/20261123162856_consentimento_leitura_maos/`      |
| Serviço PostgreSQL (`ConsentLedger`)                                                          | `src/features/palm-reading/server/consent-ledger.ts`                |
| Configuração e bloqueio em produção                                                           | `consent-ledger-config.ts`                                          |
| Implementação em memória, **só para testes** (recusa produção)                                | `consent-ledger-memory.ts`                                          |
| Integração: aceite, análise, revogação                                                        | `handlers.ts`, rota `consentimento/revogar`                         |
| Aparelho: chave de idempotência por foto, novos códigos, revogação ao retirar o consentimento | `analysis-client.ts`, `photo-capture.tsx`, `palm-photo-context.tsx` |

### 1.1 O que o registro guarda

| Tabela                  | Campos                                                                                                                                                                                                                                                         | Nunca                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `PalmConsentRecord`     | `receiptHash` (SHA-256 com separação de domínio do código aleatório do recibo), `consentVersion`, `purposes` (`PALM_READING`), `adultDeclared`, `acceptedAt` (UTC, **segundos**), `receiptExpiresAt`, `analysesUsed`, `lastUsedAt`, `revokedAt`, `deleteAfter` | foto, hash da foto, IP, user-agent, mão, resultado, dados de nascimento, características das mãos, o token ou o código do recibo |
| `PalmConsentUse`        | hash da chave de idempotência (aleatória, do aparelho), estado, `leaseId`, `leaseUntil`, horários                                                                                                                                                              | idem                                                                                                                             |
| `PalmSharedResult` (D8) | o JSON entregue ao aparelho, `expiresAt` (10 min)                                                                                                                                                                                                              | foto, observação bruta do modelo                                                                                                 |

**Restrições no banco:**

- `analysesUsed >= 0`;
- pelo menos uma finalidade;
- hashes no formato `^[0-9a-f]{64}$`;
- `receiptHash` único;
- `(consentId, requestHash)` único.

### 1.2 Estados de uma tentativa

```
                 begin (trava o consentimento; revogação, validade e limite)
  (nenhuma) ─────────────────────────────────────────────► PENDING (lease 2 min)
  PENDING ── complete (mesmo lease) ─────────────────────► COMPLETED  [+ resultado compartilhado, se ligado]
  PENDING ── refund (mesmo lease, uma vez) ──────────────► REFUNDED   [contagem − 1]
  PENDING ── lease vencido (begin do mesmo pedido OU limpeza) ► REFUNDED [− 1, uma vez] → nova autorização
  REFUNDED ── begin do mesmo pedido ─────────────────────► PENDING (novo lease) [+ 1]
  COMPLETED ── begin do mesmo pedido ────────────────────► (não muda) → resultado guardado, ou 410
```

**Regras gerais:**

- **Ordem das travas:** toda mudança trava antes a linha do consentimento
  (`SELECT … FOR UPDATE`), sempre na ordem consentimento → uso, para não
  haver impasse entre transações.
- **Lease:** `complete` e `refund` exigem o `leaseId` da autorização.
  Assim, uma instância lenta que perdeu o lease não conclui nem devolve a
  tentativa de outra.
- **Sem transação aberta durante a chamada:** autorizar e concluir são
  transações curtas e separadas, e nenhuma fica aberta durante a chamada
  ao provedor. Há teste que confere a ausência de sessões `idle in
transaction` entre as duas.

### 1.3 Endpoints

**`POST /consentimento`:**

- emite o recibo e **grava a evidência antes de devolvê-lo**;
- se a gravação falhar → **503, sem recibo**;
- depois, roda uma limpeza oportunista em lote pequeno.

**`POST /analise`:** exige `x-sidera-request` (22–64 caracteres de
`[A-Za-z0-9_-]`); sem ela, 400.

Ordem de processamento:

1. Recibo assinado e foto conferidos, como antes.
2. `begin`, que é a autorização transacional:
   - banco indisponível → **503, sem chamar o provedor**;
   - inexistente, vencido ou revogado → 401;
   - esgotado → 429.
3. Pedido em andamento:
   - **na mesma instância**, espera o mesmo resultado;
   - **em outra instância**, `409 analysis_in_progress` com
     `Retry-After: 5`. **Não executa de novo.**
4. Pedido já concluído (D8):
   - devolve o cache local, ou o **resultado compartilhado, idêntico**,
     se ligado;
   - se não houver resultado, `410 result_expired`;
   - **nunca reanalisa automaticamente.**
5. Só depois do `COMMIT` da autorização, o provedor é chamado.
6. Fim da análise:
   - **falha técnica** → `refund`, que vale uma única vez;
   - **foto insuficiente** → conclui e consome a tentativa, como antes;
   - **revogado durante o processamento** → conclui, **descarta o
     resultado** (nada compartilhado nem em cache) e responde 401;
   - **banco falha ao concluir** → o resultado é entregue. A tentativa
     fica PENDING e é devolvida como órfã quando o lease vence, a favor da
     pessoa.

**`POST /consentimento/revogar`:**

- **Autorização:** o recibo assinado, que vale mesmo vencido.
- **Proteções:** mesma origem e limite por cliente (20/h).
- **Resposta:** 204, sem dizer se havia algo a revogar.
- **Repetição:** é idempotente.
- **Efeito:** nenhuma nova autorização em nenhuma instância; o registro
  **fica até o prazo** (D2, pendente de validação jurídica).
- **Quem chama:** só o botão de retirar o consentimento. **Sair da página
  não revoga** (D5).
- **Fora do escopo:** não há código público de recuperação, conta nem
  processo administrativo.

### 1.4 Configuração e bloqueio

| Ambiente                                      | Comportamento                                                                                                                                                                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Produção** (`NODE_ENV=production`)          | `CONSENT_LEDGER_PRODUCTION_READY = false` no código → registro bloqueado → **503 em consentimento, análise e revogação**, mesmo com `DATABASE_URL`, prazo e segredos. O resultado compartilhado tem trava própria (`SHARED_RESULTS_PRODUCTION_READY = false`) |
| Fora de produção, sem `SIDERA_CONSENT_LEDGER` | modo anterior, sem registro (desenvolvimento e avaliações)                                                                                                                                                                                                    |
| `SIDERA_CONSENT_LEDGER=postgres`              | exige `DATABASE_URL` e `SIDERA_CONSENT_RETENTION_DAYS` (inteiro de 1 a 3650, **sem valor padrão**); sem eles, bloqueado (503)                                                                                                                                 |
| `SIDERA_SHARED_RESULTS=1`                     | resultado compartilhado (D8), só fora de produção                                                                                                                                                                                                             |

**Ativar em produção exige um commit que mude as travas.** Esse commit
só deve existir depois das dependências da seção 4.

## 2. D8: resultado compartilhado no PostgreSQL

**Como funciona:**

- **Vínculo:** é uma linha por tentativa concluída
  (`PalmSharedResult.useId`), ligada à chave de idempotência pelo
  `PalmConsentUse`.
- **Acesso:** só chega a ela quem apresenta **o recibo assinado e a mesma
  chave de idempotência**, e só enquanto o consentimento não estiver
  revogado nem vencido. Não há rota de consulta.
- **Conteúdo:** o mesmo JSON entregue ao aparelho, que inclui textos e
  frases "Observado". O teste confere igualdade exata, inclusive acentos e
  símbolos.
- **Validade:** `expiresAt = conclusão + 10 min`. Vencido, não é mais
  lido, e o pedido repetido recebe 410.
- **Exclusão física:** acontece **na próxima limpeza** (oportunista, a
  cada novo consentimento, ou agendada).
  - Por isso **não se promete "apagado em 10 minutos"**: o prazo real é
    10 min até deixar de ser lido, mais o intervalo até a limpeza, mais a
    janela de backup do provedor do banco.
  - A rotina agendada e a janela de backup ainda não estão definidas
    (D7).
- **Bloqueado em produção** até:
  - o banco de produção e os backups (D7);
  - a atualização dos textos de privacidade, que hoje dizem "na memória
    do servidor por até 10 minutos". Com esta função, o texto da leitura
    também ficaria no banco.

## 3. Testes executados

### PostgreSQL real

Servidor local, PostgreSQL 16, sem dados reais.

- **Banco por execução:** cada execução cria um banco com nome aleatório,
  aplica `prisma migrate deploy` do zero e remove esse banco no fim.
- **Por que não o `migrate reset`:** o Prisma recusa o `migrate reset`
  quando é chamado por um agente, e essa proteção foi respeitada.
- **Como rodar:** `SIDERA_TEST_DATABASE_URL=… npm run test:db`.
- **Resultado:** **31 testes passaram em 5 execuções seguidas**.

| Grupo                                               | O que foi verificado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modelo e migração                                   | migração aplicada do zero; colunas exatamente as previstas, sem coluna de IP, foto, mão, nascimento, local ou navegador; `acceptedAt` em UTC com segundos (os 789 ms truncados); `CHECK` recusa contagem negativa, finalidade vazia e hash inválido; mesmo recibo duas vezes é recusado                                                                                                                                                                                                                                                                                                                                                                                                               |
| Contrato (9)                                        | limite; mesmo pedido sem consumo duplo; consentimento inexistente, vencido ou revogado; conclusão; devolução única; órfã retomada; limpeza de órfãs uma vez só; revogação no meio do processamento; resultado compartilhado idêntico e com validade; retenção pelo prazo configurado                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Concorrência real (4 conexões, como instâncias)     | 12 pedidos diferentes simultâneos → exatamente 3 autorizados; o mesmo pedido 10 vezes → 1 autorizado e 9 em andamento; 6 devoluções simultâneas → 1; órfã disputada por 2 limpezas e 2 retomadas → uma devolução, uma tentativa ativa, contagem 1; revogação no meio de autorizações → nenhuma nova depois e nada compartilhado; nenhuma transação aberta entre autorizar e concluir                                                                                                                                                                                                                                                                                                                  |
| Endpoints em duas instâncias com o mesmo banco (14) | evidência antes do recibo; mesmo pedido sem nova chamada; chave inválida → 400; 409 na outra instância durante o processamento e resultado compartilhado idêntico depois; 410 sem compartilhamento ou depois de 10 min; falha técnica devolve; 8 pedidos simultâneos entre as instâncias → 3 análises; revogação durante o processamento → 401 e nada guardado; revogação exige assinatura e aceita recibo vencido; **queda de instância** (provedor que nunca responde) → 409 e, depois do lease, retomada sem cobrança dupla; banco fora do ar antes da autorização → 503 sem provedor; falha ao gravar o consentimento → sem recibo; banco falha ao concluir → resultado entregue e órfã devolvida |
| Banco inalcançável                                  | a autorização falha, e o endpoint responde 503                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### Sem banco, no `npm run check`

- **Contrato e endpoints em memória:** o mesmo contrato e o mesmo conjunto
  de endpoints, contra a implementação em memória.
- **Configuração:** produção bloqueada mesmo configurada; prazo ausente ou
  inválido bloqueia; resultado compartilhado só quando pedido.
- **Bloqueio:** os três endpoints respondem 503.
- **Aparelho:**
  - chave de idempotência aleatória no cabeçalho;
  - revogação com o recibo e sem corpo;
  - **sair do fluxo não revoga, retirar o consentimento revoga**.
- **Logs:**
  - aceite, análise, pedido repetido, revogação e falha do banco não
    registram nada, nem recibo, nem chave, nem segredo;
  - o cliente Prisma e o registro não configuram log de consultas.

### Aplicação real

| Verificação                                                                                                  | Resultado                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `next start` em produção, com registro, banco, prazo e segredos configurados                                 | consentimento **503**, revogação **503**, **0 registros** gravados                                                                                                                                                       |
| `next dev` com o registro no PostgreSQL e análise simulada; roteiro D5 (`scripts/e2e/d5-saida-do-fluxo.mjs`) | **17/17**. No banco: só versão `03g3.1`, `{PALM_READING}`, 18+ e aceite com segundos; tentativas `COMPLETED`; a saída com análise em andamento não consumiu tentativa (o envio foi abortado antes de chegar ao servidor) |
| Retirar o consentimento na prévia ("Descartar")                                                              | revogação **204**; `revokedAt` gravado                                                                                                                                                                                   |

### Suíte completa

| Verificação     | Resultado                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------- |
| `npm run check` | **1175 testes passaram**, 42 pulados (os 31 com banco, sem a variável, e os pagos ou de avaliação) |
| `npm run build` | concluído, 15 rotas (nova: `/api/leitura-das-maos/consentimento/revogar`)                          |

## 4. Pendências para ativação comercial

| #   | Pendência                                                                                                                                                                                                                                                            | Tipo                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| D1  | Prazo de retenção do registro e sua fundamentação (`SIDERA_CONSENT_RETENTION_DAYS`)                                                                                                                                                                                  | jurídica                        |
| D2  | Revogado: manter até o prazo (implementado assim) ou apagar antes                                                                                                                                                                                                    | jurídica                        |
| D6  | Controlador: Cation Digital, a constituir                                                                                                                                                                                                                            | comercial                       |
| D7  | Banco de produção: provedor, região, TLS, papéis com permissão mínima, backups e sua janela, rotina diária de limpeza, procedimento de restauração com limpeza imediata                                                                                              | comercial e técnica             |
| T-a | **Texto do consentimento e da política**: dizer que uma evidência mínima da autorização é guardada (o que, por quanto tempo) e, se o D8 for ativado, que o texto da leitura pode ficar no banco por até 10 min, mais limpeza e backups. Nova versão do consentimento | jurídica e técnica              |
| T-b | Rotina agendada de limpeza (endpoint protegido ou `pg_cron`) e comando manual; hoje só a limpeza oportunista                                                                                                                                                         | técnica (depende de D7)         |
| T-c | Limites por cliente e global ainda em memória (T7)                                                                                                                                                                                                                   | técnica (depende da hospedagem) |
| T-d | Commit de ativação: virar `CONSENT_LEDGER_PRODUCTION_READY` (e, se aprovado, `SHARED_RESULTS_PRODUCTION_READY`) e aplicar `prisma migrate deploy` no banco de produção                                                                                               | aprovação                       |
| —   | Reprodutibilidade visual (03F.2) e as demais pendências jurídicas da 03G.2 (transferência internacional, Marco Civil)                                                                                                                                                | já registradas                  |

**Ambiente local destes testes:** PostgreSQL 16 em
`/var/lib/postgresql/sidera-test`, na porta 54329. Ele não faz parte do
projeto e é descartado com o contêiner.
