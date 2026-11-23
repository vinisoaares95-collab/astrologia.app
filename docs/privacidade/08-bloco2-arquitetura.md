# Fase 03G.3, Bloco 2 — verificações e arquitetura do registro de consentimento

> **Atualização (23/11/2026).**
>
> - **D5:** aprovada e implementada. Ao sair de `/leitura-das-maos`, o
>   estado é descartado. Verificação no navegador em
>   `scripts/e2e/d5-saida-do-fluxo.mjs`.
> - **Especificação:** a seção 3 foi substituída por
>   `09-bloco2-especificacao.md`.

**Documento de trabalho (23/11/2026).** É uma proposta para aprovação.

- **Implementação:** o registro persistente **não** foi implementado.
- **Sem custo e sem publicação:** nada foi publicado e não houve deploy
  nem chamada paga.
- **Código alterado:** só um aviso comprovadamente incorreto e dois
  comentários (seção 1.3).

**Contexto comercial.** A Cation Digital será a estrutura que comercializa
o Sidera. Ela ainda será constituída: CNPJ e enquadramento estão
pendentes, e nenhum dado jurídico foi preenchido.

## 1. Dados de nascimento: o que vai para onde

### 1.1 Fluxo verificado no código

| Etapa                     | Dados                                                                               | Onde                                                        | Como                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Digitação                 | data, hora, precisão e margem da hora, texto da cidade                              | navegador (estado React)                                    | campos com `autoComplete="off"`                                                             |
| Validação local           | data, hora                                                                          | navegador                                                   | `validateBirthData`, antes de qualquer envio                                                |
| Busca de cidade           | **o texto digitado** (≥ 2 caracteres, até 80; 200 ms após parar de digitar)         | **servidor do Sidera** (Server Action `searchPlacesAction`) | busca em JSON local (IBGE, GeoNames); devolve até N cidades                                 |
| Conferência               | data, hora, precisão, margem, **id da cidade escolhida**, ocorrência (hora ambígua) | **servidor** (`normalizeBirthAction`)                       | normaliza com a tzdb e as bases locais                                                      |
| Cálculo do mapa           | a mesma entrada                                                                     | **servidor** (`computeChartAction`)                         | só com `SIDERA_INTERNAL_ENGINE=1` (desligado em qualquer deploy, por causa da licença AGPL) |
| Casos de demonstração     | só o id da cidade do caso                                                           | servidor (`getPlaceAction`)                                 | —                                                                                           |
| Avançar para `/relatorio` | **nada** é enviado                                                                  | —                                                           | `router.push` sem parâmetros                                                                |

**Serviços externos em execução: nenhum.**

- Não há `fetch` para fora do servidor.
- As efemérides são baixadas só na preparação do ambiente
  (`scripts/fetch-ephemeris.mjs`), sem dado de ninguém.
- As fontes (`next/font/google`) são incorporadas no build e servidas
  pelo próprio site.

**Gravação: nenhuma.** As três Server Actions não gravam nada. Os logs
registram só o tipo do erro ou as versões da tzdb, o que é conferido em
`src/features/privacy/app-logs.test.ts`.

**Fora do código, pendente da hospedagem:** os registros de acesso do
provedor. Uma Server Action é um POST para a própria página; o corpo
normalmente não é registrado, mas isso precisa ser confirmado (H3).

### 1.2 Os avisos do Bloco 1

| Aviso                                                                                                                             | Resultado                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| "A busca da cidade, a data e a hora vão ao servidor do Sidera só para localizar o lugar e verificar os dados (e calcular o mapa)" | **correto**                                                                                                                          |
| "O Sidera não grava esses dados nem os repassa a outros serviços"                                                                 | **correto** quanto ao código. A hospedagem, quando existir, processa os pedidos como operadora; isso entra na política, não no aviso |
| "…nesta tela, eles somem quando você sai"                                                                                         | **incorreto (comprovado), corrigido** (1.3)                                                                                          |
| FAQ: envio da foto, não gravação, 10 min, Anthropic                                                                               | correto                                                                                                                              |

### 1.3 O que foi comprovado e corrigido

**O que acontece.** O projeto usa `cacheComponents: true` (Next.js 16).
Nesse modo, ao navegar, o Next.js **esconde** as rotas com React
`<Activity>` em vez de desmontá-las, e preserva até 3 rotas
(`node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md`).

**Teste no navegador** (Playwright, servidor de produção local, imagem
sintética):

- **Dados de nascimento:**
  - a data foi digitada e a pessoa navegou para a página inicial;
  - o formulário **continuou no DOM, escondido**, com os dados;
  - voltar pelo navegador restaurou a data;
  - só recarregar apagou.
- **Foto da palma:**
  - a foto foi preparada e a pessoa saiu do fluxo para a página inicial;
  - a URL `blob:` foi revogada pela limpeza dos efeitos;
  - mas a prévia, o estado da foto (o `Blob` preparado), o consentimento e
    o recibo **continuaram na memória da aba**;
  - ao voltar, a tela reaparece com a imagem quebrada.

**Correções feitas (só texto, como pedido):**

- **Aviso dos dados de nascimento:** de "somem quando você sai" para "No
  aparelho, eles ficam só na memória desta aba e somem ao recarregar ou
  fechar a página".
  - O teste foi atualizado e também proíbe "quando você sai".
  - `npm test -- src/features/birth-data`: 52 testes passaram.
- **Comentários:** os de `leitura-das-maos/layout.tsx` e
  `palm-photo-context.tsx` afirmavam que o provider é desmontado ao sair.
  Foram corrigidos para descrever o comportamento real.

**Não corrigido, para decisão (item 0 do Bloco 2).** Os textos da foto
continuam dizendo que a cópia "sai \[da memória desta tela\] quando você
descarta a foto ou sai do fluxo". Nas duas formas de corrigir:

- **Recomendado: corrigir o comportamento, não o texto.**
  - Descartar foto, consentimento, recibo, resultado e foto anterior
    quando a rota é escondida: limpeza num `useLayoutEffect` do
    `PalmPhotoProvider`, padrão indicado pela documentação do Next.js.
  - Isso torna a promessa verdadeira, sem mudar a versão do
    consentimento.
  - Efeito para a pessoa: ao voltar ao fluxo depois de sair, recomeça pelo
    consentimento. Esse era o comportamento planejado.
- **Alternativa:** mudar o texto ("…fica na memória desta aba até
  recarregar ou fechar"). Mantém a foto em memória sem necessidade e exige
  nova versão do consentimento.

**O mesmo vale para o formulário de nascimento**, se se quiser que os dados
sumam ao sair. O texto já foi corrigido para a situação atual. Limpar ao
esconder é opcional e é decisão de produto.

## 2. Revisão do HMAC e da origem do IP

**Conferido:**

- **HMAC:** HMAC-SHA256 com `SIDERA_CLIENT_KEY_SECRET` (≥ 32 caracteres).
  O IP não é guardado nem registrado.
- **Bloqueio em produção:** sem `SIDERA_CLIENT_IP_HEADER` nem
  `SIDERA_TRUSTED_PROXY_HOPS`, com os dois definidos ou com valor
  inválido, **não há chave → 503** antes de ler o corpo e de qualquer
  limite.
  - Coberto pelos testes `client-key.test.ts` e `handlers.test.ts`.
  - Confirmado no servidor de produção local, no Bloco 1.
- **Sem segredo em produção:** também dá 503.
- **Origem do IP:** nenhum provedor nem valor de proxy foi presumido.

**Pontos de atenção (nenhum exige mudança agora):**

| #   | Ponto                                                                                                                                                            | Efeito                                           | Proposta                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| R1  | O bloqueio depende de `NODE_ENV=production`. Um ambiente publicado com outro `NODE_ENV` (ex.: homologação em modo de desenvolvimento) usaria o modo falsificável | baixo hoje: não há deploy                        | Na configuração da hospedagem, exigir `NODE_ENV=production` em qualquer ambiente acessível pela internet |
| R2  | O segredo só tem o tamanho conferido (≥ 32), não a aleatoriedade                                                                                                 | baixo                                            | Gerar com fonte aleatória (ex.: 32 bytes em base64); documentado                                         |
| R3  | `::ffff:203.0.113.7` e `203.0.113.7` geram chaves diferentes; IPv6 usa o endereço completo (/128)                                                                | um cliente com bloco /64 pode alternar endereços | Normalizar IPv4 mapeado e agrupar IPv6 por /64, junto com os limites compartilhados (T7)                 |
| R4  | O mesmo segredo de 32+ caracteres pode ser reaproveitado para o recibo e o HMAC                                                                                  | baixo                                            | Documentado: usar segredos diferentes                                                                    |
| R5  | As Server Actions dos dados de nascimento não têm limite de uso                                                                                                  | abuso de CPU, não de privacidade                 | Fora deste bloco; avaliar com os limites compartilhados                                                  |

## 3. Arquitetura recomendada: registro persistente de consentimento

### 3.1 Objetivo e limites

- **O que prova:** que **uma autorização de uma versão definida, com
  finalidades definidas, precedeu cada análise**, sem identificar a
  pessoa.
- **O que não prova:** quem autorizou. É intencional, por minimização.
  Se isso basta, é decisão jurídica (J2).

### 3.2 Armazenamento: Prisma e PostgreSQL existentes

- **Por que o banco:** é o único armazenamento compartilhado que o projeto
  já tem. Funciona com várias instâncias sem nova dependência.
- **Hoje:**
  - o schema tem só `Product`;
  - não há migração;
  - `src/lib/db.ts` cria o cliente sob demanda e ainda não é usado.
- **Primeira migração:** este registro será a primeira migração do
  projeto (`prisma/migrations`).

Modelo proposto, para revisão, ainda não aplicado:

```prisma
/// Evidência de consentimento da leitura das mãos (03G.3).
/// Sem foto, hash da foto, IP, user-agent, mão, resultado ou dado de nascimento.
model PalmConsentRecord {
  id               String          @id @default(cuid())
  /// SHA-256 do código aleatório do recibo (128 bits). O código em si não é guardado.
  receiptHash      String          @unique @db.Char(64)
  /// Versão do texto aceito (ex.: "03g3.1"); os textos ficam versionados no Git.
  consentVersion   String          @db.VarChar(16)
  /// Finalidades autorizadas (lista fechada).
  purposes         ConsentPurpose[]
  adultDeclared    Boolean
  /// Relógio do servidor, UTC (precisão: decisão D3).
  acceptedAt       DateTime
  receiptExpiresAt DateTime
  /// Análises feitas com este recibo (substitui o limite por recibo em memória).
  analysesUsed     Int             @default(0)
  lastUsedAt       DateTime?
  revokedAt        DateTime?
  /// Data a partir da qual o registro é apagado (prazo: decisão D1).
  deleteAfter      DateTime

  @@index([deleteAfter])
}

enum ConsentPurpose {
  PALM_READING
  INTERNATIONAL_TRANSFER
}
```

**Por que SHA-256 do código, e não o código:**

- **Vazamento do banco:** quem vê o banco não consegue montar um recibo.
  Para isso faltaria a assinatura, com segredo separado. Também não
  consegue ligar uma linha a um token que tenha vazado em algum log.
- **Localizar o registro continua possível:** a partir do token que a
  pessoa tem, ou de um código curto derivado dele (D4).

### 3.3 Vínculo com o recibo e com as análises

1. **`POST /consentimento`:**
   - valida a entrada, como hoje;
   - cria o recibo;
   - **grava o registro antes de devolver o token**;
   - se a gravação falhar → **503, sem recibo**. Não há análise sem
     evidência.
2. **`POST /analise`:** depois de verificar a assinatura do recibo, uma
   atualização atômica:

   ```
   UPDATE … SET analysesUsed = analysesUsed + 1, lastUsedAt = now,
                deleteAfter = <recalculado>
   WHERE receiptHash = h AND revokedAt IS NULL AND analysesUsed < 3
   ```

   - **0 linhas** → 401 (revogado ou inexistente) ou 429 (esgotado).
   - **Ganho:** isso substitui o `analysisPerReceipt` em memória. O limite
     por recibo e a revogação passam a valer **em todas as instâncias**.

3. **Falha técnica:** a regra atual de devolver a tentativa vira um
   decremento condicionado (`analysesUsed > 0`).
4. **Cache e deduplicação:** continuam em memória (10 min). Não fazem
   parte da evidência.

**Não se registra a lista de análises**, só a contagem e a última data.

- **Por quê:** o Sidera não guarda as análises. Uma lista de horários
  ligaria o registro mais facilmente aos registros de acesso, sem ganho
  de prova.
- **Alternativa, se o jurídico pedir:** uma tabela filha com horário e
  resultado técnico.

### 3.4 Revogação

- **Pela pessoa, no aparelho:** "Retirar consentimento" passa a chamar
  `POST /consentimento/revogar` com o token, que grava `revokedAt`. O
  descarte local continua igual.
- **Por pedido de titular:** pelo código (D4) ou pelo token.
  - O operador roda um comando administrativo (script com o mesmo
    serviço).
  - Não há painel nesta fase.
- **Efeito:** nenhuma análise nova com aquele recibo, em nenhuma
  instância. O que já foi enviado à Anthropic segue as regras dela, como
  os textos já dizem.
- **O registro não é apagado na revogação:** ele prova o tratamento já
  feito. Confirmar com o jurídico (D2).

### 3.5 Retenção e exclusão

**O prazo não foi definido. Seis meses não é adotado.**

- **Configuração exigida:** o prazo entra por `SIDERA_CONSENT_RETENTION_DAYS`,
  **sem valor padrão**.
- **Em produção:** se a variável faltar, o registro não pode ser
  habilitado, e o consentimento responde 503. Isso mantém o lançamento
  travado até a decisão jurídica.
- **Cálculo:** `deleteAfter = max(acceptedAt, lastUsedAt, revokedAt) + prazo`.

**Opções para a fundamentação jurídica (D1), sem recomendação:**

- (a) o tempo em que o próprio tratamento pode ter efeitos, como a
  retenção do provedor;
- (b) o prazo para o exercício regular de direitos, como a defesa em
  reclamações de consumidor (prazos do CDC, a confirmar);
- (c) outro prazo que o jurídico fundamente.

**Exclusão em duas camadas:**

1. **Junto com o uso, sem infraestrutura nova:**
   - a cada novo consentimento, apaga um lote de vencidos (`deleteAfter <
now()`, `LIMIT 100`);
   - com uso, os vencidos saem no dia.
2. **Agendada, quando houver hospedagem:**
   - rotina diária com o mesmo comando, para não depender de tráfego;
   - o mecanismo depende do provedor (C5) e **não foi presumido**.

**Backups:** o prazo dos backups do banco soma-se ao prazo do registro. A
política precisa declarar o total (H8).

### 3.6 Minimização e proteção

- **Campos:** só os da seção 3.2, sem campo livre e sem JSON aberto.
- **Natureza do dado:** tratado como **dado pessoal pseudonimizado**, já
  que o registro pode ser ligado a uma pessoa pelo código ou pelo token.
  Sem cruzamento com nenhuma outra tabela.
- **Horário:** precisão a decidir (D3).
  - **Minuto:** reduz o cruzamento com os registros de acesso.
  - **Segundo:** dá prova mais forte.
- **Logs:** o Prisma sem log de consultas, e nenhum `console.*` novo. O
  teste de logs continua valendo e passa a cobrir o serviço de
  consentimento.
- **Banco:**
  - conexão com TLS;
  - usuário com permissão só de SELECT, INSERT, UPDATE e DELETE nestas
    tabelas;
  - cifragem em repouso e região conforme a hospedagem (H1, H2, H7).
- **Segredos:**
  - `DATABASE_URL` fica no gerenciador da hospedagem;
  - o segredo do recibo e o do HMAC continuam separados.

### 3.7 Estrutura do código

- `ConsentLedger`, uma interface de serviço:
  - `record`;
  - `use`, atômico;
  - `refund`;
  - `revoke`;
  - `purgeExpired`.
- `PrismaConsentLedger`: a **implementação definitiva**.
- Implementação em memória **só para testes unitários**. Ela é recusada em
  produção.
- `PalmApiDeps.consentLedger`: com o recurso ligado em produção e sem o
  registro ou sem `DATABASE_URL` → 503.
- Testes:
  - unitários com o serviço falso;
  - de integração com PostgreSQL real, opcionais e marcados por variável
    (`SIDERA_DB_TESTS=1`), sem rodar no `check` padrão;
  - de logs.

**Fora do Bloco 2:** os limites por cliente e o global continuam em
memória. O estado compartilhado deles (T7) depende da hospedagem. A mesma
tabela com chave HMAC e janela é uma opção, mas não faz parte desta
proposta.

## 4. Alterações necessárias (para aprovação)

| #   | Alteração                                                                             | Arquivos                                                                   | Depende de                                  |
| --- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------- |
| 0   | Descartar o estado da leitura das mãos quando a rota é escondida                      | `palm-photo-context.tsx`, testes                                           | aprovação (1.3)                             |
| 1   | Modelo `PalmConsentRecord` e primeira migração                                        | `prisma/schema.prisma`, `prisma/migrations/`                               | aprovação                                   |
| 2   | `ConsentLedger` (Prisma) e o comando de limpeza                                       | `src/features/palm-reading/server/consent-ledger.ts`                       | 1                                           |
| 3   | Gravar ao emitir o recibo; uso atômico na análise; devolução da tentativa             | `handlers.ts`, testes                                                      | 2                                           |
| 4   | Rota e cliente de revogação                                                           | `app/api/leitura-das-maos/consentimento/revogar`, `palm-photo-context.tsx` | 2                                           |
| 5   | Configuração e bloqueio em produção (`DATABASE_URL`, `SIDERA_CONSENT_RETENTION_DAYS`) | `config.ts`, `.env.example`                                                | D1 (o valor; o código pode existir sem ele) |
| 6   | Testes de integração opcionais com PostgreSQL                                         | `*.db.test.ts`                                                             | ambiente com PostgreSQL                     |

**Fora:**

- a terceira caixa (J1);
- a página da política;
- o deploy;
- o banco de produção (C5).

O banco de desenvolvimento pode ser local, com PostgreSQL em contêiner,
sem dado real.

## 5. Decisões pendentes

| #   | Decisão                                                                                  | Tipo                | Bloqueia                         |
| --- | ---------------------------------------------------------------------------------------- | ------------------- | -------------------------------- |
| D1  | Prazo de retenção do registro e sua fundamentação                                        | jurídica            | habilitar em produção            |
| D2  | A revogação mantém o registro até o prazo? A contagem e a última data bastam como prova? | jurídica            | — (o desenho já permite ajustar) |
| D3  | Precisão do horário: minuto ou segundo                                                   | jurídica e técnica  | —                                |
| D4  | Mostrar à pessoa um código curto da autorização, para pedidos de titular e revogação     | produto e jurídica  | só a revogação por e-mail        |
| D5  | Ao sair do fluxo: descartar o estado (recomendado) ou mudar o texto                      | produto             | item 0                           |
| D6  | Controlador do registro: Cation Digital, a constituir. CNPJ e enquadramento              | comercial           | política e publicação            |
| D7  | Hospedagem do banco: região, backups, cifragem, rotina agendada                          | comercial e técnica | produção                         |
