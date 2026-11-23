# Fase 03G.3, Bloco 2 — especificação consolidada do registro de consentimento

**Para decisão (23/11/2026).**

- **Direção aprovada:** PostgreSQL com Prisma.
- **Sem implementação:** não há migração nem persistência.
- **Relação com o documento 08:** esta especificação substitui a seção 3
  de `08-bloco2-arquitetura.md`. As decisões D1–D4, D6 e D7 de lá
  continuam abertas; a D5 foi resolvida (seção 9).

## 1. Modelo

```prisma
/// Evidência de consentimento da leitura das mãos. Sem foto, hash da foto,
/// IP, user-agent, mão, resultado ou dado de nascimento.
model PalmConsentRecord {
  id               String           @id @default(cuid())
  /// SHA-256 com separação de domínio do código aleatório do recibo (seção 2).
  receiptHash      String           @unique @db.Char(64)
  consentVersion   String           @db.VarChar(16)
  purposes         ConsentPurpose[]
  adultDeclared    Boolean
  acceptedAt       DateTime         // relógio do servidor, UTC (precisão: D3)
  receiptExpiresAt DateTime
  analysesUsed     Int              @default(0)
  lastUsedAt       DateTime?
  revokedAt        DateTime?
  deleteAfter      DateTime         // prazo: D1
  uses             PalmConsentUse[]

  @@index([deleteAfter])
}

/// Controle técnico de cada tentativa (idempotência e devolução), de curta duração.
model PalmConsentUse {
  id          String            @id @default(cuid())
  consentId   String
  consent     PalmConsentRecord @relation(fields: [consentId], references: [id], onDelete: Cascade)
  /// SHA-256 da chave de idempotência gerada no aparelho (aleatória, por envio).
  requestHash String            @db.Char(64)
  state       ConsentUseState   @default(PENDING)
  createdAt   DateTime          @default(now())
  settledAt   DateTime?

  @@unique([consentId, requestHash])
  @@index([state, createdAt])
}

enum ConsentPurpose  { PALM_READING  INTERNATIONAL_TRANSFER }
enum ConsentUseState { PENDING  COMPLETED  REFUNDED }
```

**Mudança em relação ao documento 08.** Entra uma tabela de uso por
tentativa, `PalmConsentUse`. Sem ela não há idempotência entre instâncias
nem devolução segura da tentativa.

Ela é **técnica e de vida curta** (seção 6):

- **O que guarda:** só um hash aleatório, o estado e o horário.
- **O que não guarda:** hash da foto ou qualquer coisa derivada da
  imagem.
- **O que serve de prova:** a contagem e a última data, no registro
  principal.

## 2. Validação do recibo sem persistir o código

- **Recibo sem mudança:** o token continua o mesmo de hoje (conteúdo e
  HMAC com `SIDERA_CONSENT_SECRET`), e o `nonce` tem 128 bits aleatórios.
- **Hash guardado:** `receiptHash = SHA-256("sidera:consent-receipt:v1:" + nonce)`.
  - **O que não é guardado:** nem o token nem o `nonce`.
  - **Por que SHA-256 basta:** com 128 bits aleatórios, não há o que
    enumerar. HMAC só seria necessário se o código fosse curto.
- **Ordem de validação em cada pedido:**
  1. confere a assinatura e a validade **sem consultar o banco**. Recibos
     forjados param aqui e não geram carga no banco;
  2. confere a versão;
  3. calcula o hash e lê o registro;
  4. confere que ele existe, não foi revogado e não venceu.
- **Recibo assinado sem registro** (ex.: emitido antes de o registro ser
  ligado): é recusado com 401, "consentimento necessário".
- **Onde o token pode aparecer:** só no aparelho e no cabeçalho
  `x-sidera-consent`. Os testes de logs passam a incluir as rotas novas, e
  a hospedagem precisa confirmar que não registra cabeçalhos de pedido
  (H3).

## 3. Revogação: quem pode e como

| Via                                                                   | Autorização                                                   | Comportamento                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Botão "Retirar consentimento"** (aparelho)                          | posse do **recibo assinado**: quem tem o token é quem aceitou | `POST /api/leitura-das-maos/consentimento/revogar` com o token no cabeçalho; mesma origem; limite por cliente. Aceita recibo assinado **mesmo vencido**, até o registro ser apagado, para registrar a retirada                                                           |
| **Pedido de titular por e-mail** (só se D4 aprovar mostrar um código) | posse do **código da autorização**, exibido na tela           | comando administrativo fora do site, rodado pelo responsável. Código de 16 caracteres base32 (80 bits), derivado do `nonce` com HMAC e chave própria, para não ser adivinhável. Pedido sem código é respondido pelo procedimento de titulares, sem revogar nada às cegas |

**Regras comuns:**

- **Sem endpoint de consulta:** nenhum endpoint devolve dados do registro.
  A revogação responde sempre 204, sem dizer se havia algo a revogar.
- **Idempotência:** `UPDATE … SET revokedAt = now() WHERE receiptHash = h
AND revokedAt IS NULL`. A segunda revogação não muda nada.
- **Efeito imediato em todas as instâncias:** o consumo (seção 4) exige
  `revokedAt IS NULL` na mesma instrução.
- **Sair da página não revoga** (D5). Só o botão ou o pedido.
- **O registro fica:** a revogação não apaga o registro antes do prazo
  (D2).

## 4. Consumo atômico das tentativas e pedidos simultâneos

Cada envio de foto ganha, no aparelho, uma **chave de idempotência
aleatória**, que vai no cabeçalho `x-sidera-request`. Uma nova tentativa
com a mesma foto (depois de tempo esgotado ou falha de rede) reutiliza a
chave; uma foto nova gera outra.

**No servidor, uma transação curta:**

```
BEGIN
  INSERT INTO PalmConsentUse (consentId, requestHash, state) VALUES (…, PENDING)
    ON CONFLICT (consentId, requestHash) DO NOTHING        -- já existe → seção 5
  UPDATE PalmConsentRecord
     SET analysesUsed = analysesUsed + 1, lastUsedAt = now, deleteAfter = …
   WHERE id = … AND revokedAt IS NULL AND receiptExpiresAt > now
     AND analysesUsed < 3
  -- 0 linhas → ROLLBACK; responde 401 (revogado ou vencido) ou 429 (esgotado)
COMMIT
```

**Garantias:**

- **Um só vencedor:** o `UPDATE` condicionado trava a linha. Com dois
  pedidos simultâneos no limite (2 de 3 usadas), só um passa, em qualquer
  instância.
- **A chamada à Anthropic só começa depois do `COMMIT`.**
- **Sem banco, sem análise:** se o banco não responde, a análise devolve
  503 sem chamar o provedor e sem consumir nada.
- **Substitui a memória:** o limite por recibo hoje em memória
  (`analysisPerReceipt`) sai e dá lugar a esse controle.
- **Continuam em memória:** o limite por cliente e o global. O estado
  compartilhado deles é a T7, que depende da hospedagem.

## 5. Idempotência entre instâncias

| Caso                                                     | Situação da tentativa | Resposta                                                                                       |
| -------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| Mesma chave, mesma instância, análise em andamento       | `PENDING`             | espera o mesmo resultado (deduplicação em memória, como hoje), sem consumir nem chamar de novo |
| Mesma chave, outra instância, em andamento               | `PENDING`             | `409 analysis_in_progress` com `Retry-After`; o aparelho tenta de novo, sem consumir           |
| Mesma chave, já concluída, resultado na mesma instância  | `COMPLETED`           | devolve o resultado do cache (até 10 min), sem consumir                                        |
| Mesma chave, concluída, resultado em **outra** instância | `COMPLETED`           | **decisão D8** (abaixo)                                                                        |
| Mesma chave, devolvida                                   | `REFUNDED`            | volta a `PENDING` e consome de novo, na mesma transação da seção 4                             |
| Novo consentimento repetido (aparelho reenviou o aceite) | —                     | cria outro recibo e outro registro; inofensivo, sujeito ao limite por cliente                  |
| Revogação ou limpeza repetida                            | —                     | instruções condicionadas; repetir não muda nada                                                |

**D8 — resultado concluído que ficou em outra instância.** O cache é em
memória e não é compartilhado.

- **(a) Recomendado:** analisar de novo **sem consumir**, dentro do teto de
  custo por relatório (≈ US$ 0,01–0,03). O caso é raro: o aparelho espera
  70 s e o servidor responde em 55 s.
  - Efeito colateral aceito: por causa da instabilidade visual registrada
    na 03F.2, a nova leitura pode divergir.
- **(b) Alternativa:** cache compartilhado do resultado por 10 min (banco
  ou Redis). Isso passa a guardar **o texto da leitura** fora da memória:
  é mais dado pessoal persistido e exige texto de privacidade novo.

**Migrações:** rodam no processo de deploy (`prisma migrate deploy`), nunca
na inicialização da aplicação. Assim não há corrida entre instâncias.

## 6. Devolução da tentativa em falha técnica

As regras que já valem para o produto continuam:

- falha do provedor, prazo de 55 s esgotado na visão ou teto de custo → a
  tentativa é devolvida;
- "foto insuficiente" **não** é devolvida, porque o modelo analisou.

**Devolução, numa transação:**

```
UPDATE PalmConsentUse SET state = REFUNDED, settledAt = now
 WHERE id = … AND state = PENDING                 -- só uma vez
-- 1 linha → UPDATE PalmConsentRecord SET analysesUsed = analysesUsed - 1
--           WHERE id = … AND analysesUsed > 0
```

- **Conclusão:** `PENDING → COMPLETED` quando a resposta é entregue.
- **Tentativa órfã** (a instância caiu entre o consumo e o fim):
  - uma tentativa `PENDING` há mais de **2 min** (o dobro do prazo
    total, com folga) é tratada como falha técnica e devolvida pela
    rotina de limpeza;
  - favorece a pessoa;
  - o custo do provedor, se houve, já está no teto do processo.
- **Linhas de uso:** saem **24 h depois de concluídas ou devolvidas**,
  porque não são prova. O que fica é a contagem e a última data no
  registro principal.
  - O prazo de 24 h é técnico (diagnóstico de duplicidade), não jurídico.

## 7. Retenção, limpeza programada e backups

**Prazo do registro: D1, sem valor padrão.**

- **Configuração:** `SIDERA_CONSENT_RETENTION_DAYS`, sem padrão.
- **Em produção:** se a variável faltar, o recurso não liga, e o
  consentimento responde 503. O lançamento fica travado até a
  fundamentação jurídica.
- **Cálculo:** `deleteAfter = max(acceptedAt, lastUsedAt, revokedAt) +
prazo`, recalculado em cada uso e na revogação.

**Limpeza: uma rotina, três gatilhos.**

- **A rotina:** apaga em lotes registros com `deleteAfter < now()`, e os
  usos saem em cascata. Também devolve as tentativas órfãs e apaga usos
  concluídos há mais de 24 h. Cada execução apaga até 500 linhas e
  repete enquanto houver.
- **Gatilho 1, oportunista:** a cada novo consentimento, um lote pequeno
  (50). Funciona sem infraestrutura nova.
- **Gatilho 2, agendado, diário:** pela hospedagem (rotina agendada
  chamando um endpoint interno protegido por segredo próprio) ou pelo
  próprio banco (`pg_cron`).
  - O mecanismo **depende do provedor (D7)**. Nada foi presumido.
- **Gatilho 3, manual:** o mesmo comando, para o operador.

**Backups:**

- **Retenção real:** a retenção máxima de fato é o prazo do registro mais
  a janela de backup ou de recuperação do provedor (D7).
- **Onde declarar:** a política declara o total.
- **Depois de restaurar:** qualquer restauração **roda a limpeza
  imediatamente**. Senão, registros já apagados, ou revogações e
  exclusões feitas depois do backup, voltariam a valer. Isso entra no
  procedimento de incidentes e recuperação.
- **Pedidos de exclusão:** dentro da janela, o dado só sai do backup
  quando ele vence. A política diz isso.

## 8. Proteção contra acessos indevidos

| Camada          | Medida                                                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rede            | Banco sem acesso público; só a aplicação (rede privada ou lista de IPs do provedor); TLS obrigatório na conexão                                                                  |
| Papéis do banco | `sidera_app`: só SELECT, INSERT, UPDATE e DELETE nestas duas tabelas (e `Product`), sem DDL. `sidera_migrate`: só no deploy. Nenhum superusuário na aplicação                    |
| Aplicação       | Nenhuma rota lê ou lista registros; o acesso é só por `receiptHash` (vindo de um recibo assinado) ou por `deleteAfter` (limpeza); sem painel administrativo nesta fase           |
| Operador        | Comandos administrativos (revogar por código, limpar) rodam fora do site, com credencial própria; cada execução registra data, comando e quantidade, **sem** o código nem hashes |
| Logs            | Prisma sem log de consultas; nenhum `console.*` novo (o teste de logs cobre); no banco, sem log de parâmetros (`log_statement = none` ou equivalente), a confirmar no provedor   |
| Segredos        | `DATABASE_URL`, `SIDERA_CONSENT_SECRET`, `SIDERA_CLIENT_KEY_SECRET` e a chave do código curto (se D4) separados, no gerenciador da hospedagem; nunca no repositório              |
| Dados           | Campos fechados (sem texto livre); hashes irreversíveis; nada liga o registro a IP, foto ou pessoa; tratado como dado pessoal pseudonimizado                                     |
| Repouso         | Cifragem em repouso e região conforme o provedor (D7)                                                                                                                            |
| Falha           | Banco indisponível → 503 sem análise; nunca segue sem registro                                                                                                                   |

**Ambientes:**

- **Produção e qualquer ambiente público:** PostgreSQL é obrigatório.
- **Desenvolvimento:** PostgreSQL local em contêiner, sem dado real, ou o
  recurso desligado, voltando ao recibo sem registro de hoje, que **só é
  aceito fora de produção**.
- **Testes unitários:** a implementação em memória existe só para eles e
  é recusada em produção.

## 9. Decisões

| #   | Decisão                                                                                                | Tipo                | Situação                           |
| --- | ------------------------------------------------------------------------------------------------------ | ------------------- | ---------------------------------- |
| D1  | Prazo de retenção do registro e sua fundamentação                                                      | jurídica            | aberta; bloqueia ligar em produção |
| D2  | A revogação mantém o registro até o prazo? A contagem e a última data bastam como prova?               | jurídica            | aberta                             |
| D3  | Precisão do horário (minuto ou segundo)                                                                | jurídica e técnica  | aberta                             |
| D4  | Mostrar o código da autorização (revogação por e-mail)                                                 | produto e jurídica  | aberta                             |
| D5  | Descartar o estado ao sair do fluxo                                                                    | produto             | **resolvida e implementada**       |
| D6  | Controlador: Cation Digital, a constituir                                                              | comercial           | aberta                             |
| D7  | Banco de produção: provedor, região, backups, rotina agendada                                          | comercial e técnica | aberta                             |
| D8  | Resultado concluído em outra instância: nova análise sem consumir (recomendado) ou cache compartilhado | técnica e produto   | **nova**, aberta                   |

**Pode começar com a aprovação desta especificação, sem D1, D6 e D7:**

- código, migração **local** e testes, inclusive de integração com
  PostgreSQL em contêiner;
- tudo desligado em produção até D1 e D7.
