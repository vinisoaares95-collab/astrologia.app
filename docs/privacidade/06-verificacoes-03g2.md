# Fase 03G.2 — verificações externas e decisões de conformidade

**Documento de trabalho (23/11/2026).** Não houve alteração de código,
publicação nem chamada paga.

Este documento repriorizou as pendências de `05-pendencias.md`, que fica
preservado como registro da 03G.1.

**Fontes consultadas nesta etapa:**

| Fonte                                                              | Situação                                                                                            |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `platform.claude.com/docs/en/manage-claude/api-and-data-retention` | **lida** (HTTP 200)                                                                                 |
| `privacy.claude.com/en/articles/7996866-…`                         | **não abriu**: o domínio não resolve nesta sessão                                                   |
| `www.gov.br/anpd/…/transferencia-internacional-de-dados`           | **não abriu**: o domínio não resolve nesta sessão                                                   |
| Lei nº 12.965/2014 (Marco Civil) e LGPD                            | não acessadas (planalto.gov.br não resolve); as referências abaixo são a confirmar no texto oficial |

## 1. Identificação do controlador

Não se presume que "Cation Digital" (nome de marca exibido em
`src/config/brand.ts`) seja a razão social nem o controlador.

| Campo                                                         | Valor                                            | Observação                                                                 |
| ------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| Tipo de pessoa                                                | `[A FORNECER: pessoa jurídica ou pessoa física]` | Muda o texto da política e a aplicação do art. 15 do Marco Civil (seção 3) |
| Razão social (ou nome completo)                               | `[A FORNECER]`                                   | —                                                                          |
| Nome fantasia ou marca                                        | `[A FORNECER]`                                   | Confirmar a relação com "Cation Digital" e "Sidera" (marca provisória)     |
| CNPJ (ou CPF, se pessoa física)                               | `[A FORNECER]`                                   | CPF não deve ser publicado; usar outro meio de identificação               |
| Endereço para comunicações                                    | `[A FORNECER]`                                   | —                                                                          |
| Encarregado (nome) ou canal                                   | `[A FORNECER]`                                   | Depende do enquadramento como agente de pequeno porte (J4)                 |
| E-mail de privacidade                                         | `[A FORNECER]`                                   | Precisa existir e ser monitorado antes do lançamento                       |
| Responsável interno por pedidos de titulares                  | `[A FORNECER]`                                   | Pode ser o próprio encarregado                                             |
| E-mail cadastrado na conta Anthropic para avisos de incidente | `[A FORNECER]`                                   | Seção 4                                                                    |
| Titular dos contratos (Anthropic, hospedagem)                 | `[A FORNECER]`                                   | Deve ser o mesmo controlador; se for outra pessoa ou empresa, registrar    |

## 2. Prova do consentimento: proposta mínima

**Problema.** A lei atribui ao controlador o ônus de provar o
consentimento (LGPD, art. 8º, § 2º; a confirmar). Hoje o servidor emite
um recibo assinado e não guarda nada. Assim, depois que o recibo vence,
não resta prova de que cada análise teve autorização válida.

**Proposta recomendada: registro mínimo, sem foto e sem dado
identificador.**

| Campo             | Valor                                                                                                                           | Por quê                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `receipt_id`      | o código aleatório que o recibo já tem (≥ 128 bits)                                                                             | **Identificador mínimo.** Liga a autorização às análises feitas com ela, sem identificar a pessoa |
| `consent_version` | ex.: `03g.1`                                                                                                                    | Prova qual texto foi aceito; os textos de cada versão ficam no Git                                |
| `purposes`        | lista fechada: `palm_reading`, mais `international_transfer` se a 3ª caixa existir                                              | Prova a finalidade autorizada                                                                     |
| `adult_declared`  | `true`                                                                                                                          | Prova a declaração de 18+                                                                         |
| `accepted_at`     | horário do **servidor**, em UTC, truncado ao minuto                                                                             | O horário do aparelho não é confiável; truncar reduz o cruzamento com registros de acesso         |
| `analyses`        | contagem e horários (ao minuto) das análises feitas com o recibo, e o resultado técnico (concluída, foto insuficiente ou falha) | Prova que cada envio à Anthropic teve consentimento                                               |

**Fica fora do registro:**

- foto e hash da foto;
- IP ou hash de IP;
- user-agent;
- mão;
- resultado;
- texto da leitura;
- qualquer dado de nascimento.

**Pontos que exigem atenção:**

- **Só sentido técnico.** O registro prova que "uma autorização da versão
  X, com as finalidades Y, precedeu as análises Z". Não prova quem
  autorizou, e isso é intencional (minimização). O juízo sobre a
  suficiência jurídica fica para J2.
- **Código visível à pessoa (opcional).** Mostrar o código abreviado da
  autorização na tela de resultado. Assim a pessoa pode citá-lo num pedido
  de titular ou numa revogação, e o registro passa a ser localizável
  **por iniciativa dela**.
- **Ligação indireta com o IP.** Os registros de acesso da seção 3 terão
  IP e horário. Cruzados com `accepted_at`, poderiam ligar uma
  autorização a um IP. Medidas:
  - o horário fica truncado ao minuto;
  - nenhum registro de acesso guarda o cabeçalho do recibo
    (`x-sidera-consent`);
  - o acesso aos dois registros é separado.
- **Revogação.** A pessoa pode revogar informando o código. Isso marca
  `revoked_at` e impede novas análises com aquele recibo. A revogação não
  apaga o registro, porque ele prova o tratamento já feito.
- **Retenção:** **6 meses** após a última análise do recibo, com exclusão
  automática diária. Esse prazo:
  - cobre com folga a retenção do provedor (30 dias por padrão; até 2 anos
    para conteúdo sinalizado, caso raro que não justifica guardar tudo
    por 2 anos);
  - acompanha o prazo do art. 15 do Marco Civil;
  - cobre um período razoável para reclamações.

  O jurídico confirma em J2.

- **Onde fica:** num armazenamento persistente do servidor. O Postgres do
  projeto existe, mas hoje só guarda o catálogo; a escolha depende da
  hospedagem (seção 5). Backups contam para a retenção: o prazo de backup
  precisa estar dentro dos 6 meses mais um prazo curto declarado.

**Alternativa (não recomendada): sem registro.** Só a prova "por desenho":
código versionado, testes e o recibo exigido pelo servidor. É mais
minimalista, mas não comprova nenhuma análise concreta.

## 3. Marco Civil da Internet (Lei nº 12.965/2014) e registros

**Leitura a confirmar no texto oficial:**

- **Art. 15:** o provedor de aplicações de internet **constituído na forma
  de pessoa jurídica** e que exerça a atividade **de forma organizada,
  profissionalmente e com fins econômicos** deve manter os **registros de
  acesso a aplicações**, sob sigilo, em ambiente controlado e de
  segurança, por **6 meses**.
- **Art. 5º, VIII:** registro de acesso é o conjunto de informações
  referentes à **data e hora** de uso de uma aplicação **a partir de um
  determinado endereço IP**.
- **Art. 16:** proíbe guardar dados excessivos em relação à finalidade.
- **Decreto nº 8.771/2016:** detalha os padrões de segurança.
- **Entrega:** os registros só são fornecidos por ordem judicial.

**Aplicação ao Sidera [PENDENTE J3].** Se o controlador for pessoa
jurídica e o Sidera for comercial (venda de leituras, Fase 04), o art. 15
**muito provavelmente se aplica**. Se for pessoa física ou não houver fim
econômico, o enquadramento é duvidoso.

**Recomendação:** planejar o lançamento comercial **como se se
aplicasse**. Custa pouco e evita refazer depois.

**Cada registro tem natureza e regras distintas:**

| Registro                         | Contém                                                                            | Finalidade               | Base legal provável                                 | Prazo proposto               | É o registro do art. 15?                                                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Registro de acesso (art. 15)** | IP (íntegro), porta de origem se disponível, data e hora (UTC), aplicação ou rota | Obrigação legal          | Cumprimento de obrigação legal (LGPD, art. 7º, II)  | **6 meses**, depois exclusão | **Sim**                                                                                                                    |
| Limitador de uso                 | hash do IP, contadores                                                            | Segurança e custo        | Legítimo interesse (art. 7º, IX)                    | 1 h (janela)                 | Não. Não serve para o art. 15 e não deve ser estendido para isso                                                           |
| Cache de resultado               | hash da foto, texto da leitura                                                    | Evitar repetir a análise | A mesma da leitura (consentimento)                  | 10 min                       | Não                                                                                                                        |
| Registro de consentimento        | seção 2                                                                           | Prova do consentimento   | Exercício regular de direitos e prova (a confirmar) | 6 meses                      | Não; fica separado e sem IP                                                                                                |
| Logs de diagnóstico da aplicação | tipo do erro, versão da tzdb; **sem dados pessoais**                              | Operação                 | Legítimo interesse                                  | **[PROPOSTA]**: 30 dias      | Não                                                                                                                        |
| Logs da hospedagem               | variam: costumam guardar IP, URL, user-agent, horário                             | Operação do provedor     | Depende do provedor                                 | `[A VERIFICAR]`              | **Pode ser**, se o provedor guardar IP e horário por 6 meses e o Sidera puder obtê-los; senão, precisa de registro próprio |

**Hash de IP não é anonimização.**

- O hash atual (`SHA-256("client:" + ip)`, sem segredo) é reversível por
  enumeração: os cerca de 4,3 bilhões de IPv4 se testam em minutos.
- **Situação jurídica:** é **dado pessoal pseudonimizado**, não anônimo.
- **Com segredo (HMAC), previsto na 03G.3:** continua pseudonimizado,
  porque quem tem o segredo reverte. Isso só reduz o risco em caso de
  vazamento.
- **Consequências:**
  - a política deve tratá-lo como dado pessoal (é o que a minuta já faz);
  - o prazo de 1 h precisa ser garantido por limpeza ativa (hoje as chaves
    só saem no limite de 10.000 ou no reinício).

**Três requisitos técnicos ligados a esta seção:**

1. **IP confiável.** `clientKey` usa o primeiro valor de
   `x-forwarded-for`. Esse valor **pode ser forjado** pelo cliente, a
   menos que o proxy da hospedagem o substitua. O mesmo vale para o
   registro do art. 15. A hospedagem precisa indicar qual cabeçalho é
   confiável.
2. **Limites em mais de uma instância.** O limitador é em memória, por
   processo. Em hospedagem com várias instâncias ou funções sem servidor,
   os limites não valem de fato. Um armazenamento compartilhado (Redis,
   banco) **passaria a guardar hashes de IP fora da memória**, com prazo
   e exclusão próprios. É uma decisão técnica com efeito de privacidade.
3. **Sem corpo nem recibo nos logs.** Nenhum log pode conter o corpo do
   pedido (foto) nem o cabeçalho do recibo. Hoje a API da palma não tem
   `console.*`; resta confirmar o que a hospedagem registra.

## 4. Anthropic e transferência internacional

### 4.1 Retenção: o que está escrito e o que fica valendo

**Página da plataforma (lida em 23/11/2026, sem data de atualização).**

- **Regra declarada:** "Conversation content (your prompts and Claude's
  outputs) is not retained by default; the exception is Covered Models,
  which require 30-day retention."
- **Covered Models:** Fable 5.2, Mythos 5.2, Fable 5.1, Mythos 5.1,
  Fable 5 e Mythos 5. O Sidera usa Sonnet 5.5 e Haiku 5.5, que não estão
  na lista.
- **Exceções, mesmo com ZDR:** "Anthropic may retain data where required
  by law or where it has been flagged by Anthropic's automated trust and
  safety systems". Conteúdo sinalizado: "up to 2 years".
- **Recursos que o Sidera usa:**
  - **Saída estruturada:** "Only the JSON schema is cached, for up to 24
    hours since last use". O esquema do Sidera não tem dado pessoal.
  - **Cache do prompt:** os prompts e as saídas não são armazenados; o
    cache e os hashes ficam em memória pelo tempo do cache.
- **Recursos que o Sidera não usa:** Files API, Batch e execução de
  código, que têm retenção própria.
- **ZDR:**
  - **O que é:** "Anthropic does not store customer prompts or responses
    at rest after the API response is returned".
  - **Como obter:** é solicitado ao time comercial e habilitado por
    organização.
  - **Restrição:** organizações com ZDR não podem chamar a API pelo
    navegador. O Sidera chama pelo servidor, então isso não o afeta.
- **Residência de dados:** existe o parâmetro `inference_geo` (página
  própria, não lida). A página não diz onde os dados são armazenados.
- **Remissão:** a página remete à "commercial data retention policy"
  (privacy.claude.com), que não abriu aqui.

**O que fica valendo para o Sidera (sua orientação da 03G.1).**

- **Regra adotada:** vale a política comercial, com exclusão padrão em até
  30 dias e exceções. A regra dos Covered Models não a substitui.
- **Divergência entre as páginas:** está registrada como **item a
  esclarecer com a Anthropic ou na conta** (A1). Até lá, os textos
  públicos usam o **limite conservador**: "até 30 dias por padrão, com
  exceções, incluindo até 2 anos para conteúdo sinalizado pelos sistemas
  de segurança e retenção exigida por lei".
- **Sem promessa a mais:** nenhum texto promete retenção zero ou exclusão
  imediata.

### 4.2 O que verificar na conta Anthropic e nos contratos

| #   | Verificar                                                                                                                                                                                            | Onde                                                                                                                     | Por quê                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| A1  | Qual regra de retenção vale para a organização: a política comercial (30 dias), a da plataforma (sem retenção por padrão) ou outra                                                                   | Console (configurações da organização e dos workspaces: "data retention"); se ambíguo, suporte ou comercial da Anthropic | Define o texto público. A página cita a opção "data retention enabled" por organização ou workspace, que pode estar ligada |
| A2  | Se há ZDR ou outro acordo de retenção; se vale pedir                                                                                                                                                 | Console ou comercial                                                                                                     | Reduz o risco da foto. Não é bloqueante: o texto conservador cobre o caso sem ZDR                                          |
| A3  | Entidade contratante (Anthropic, PBC, EUA, esperado para quem está fora do EEE, da Suíça e do Reino Unido) e versão aceita dos Termos Comerciais                                                     | Console (Billing, Legal); termos                                                                                         | Identifica o operador na política                                                                                          |
| A4  | Se o DPA foi incorporado à conta e em que versão; se cita LGPD ou Brasil (a versão lida na 03G não cita)                                                                                             | DPA; Console                                                                                                             | Base do contrato de operador                                                                                               |
| A5  | **Instrumento para o Brasil:** se a Anthropic aceita incorporar as **cláusulas-padrão contratuais da ANPD** ou tem instrumento equivalente aprovado; **as cláusulas da UE do DPA não bastam por si** | Comercial ou jurídico da Anthropic                                                                                       | Define o mecanismo da transferência (4.3)                                                                                  |
| A6  | Lista de suboperadores e locais de processamento                                                                                                                                                     | Página de suboperadores do DPA                                                                                           | Transparência e transferência ulterior                                                                                     |
| A7  | Disponibilidade e região de `inference_geo` para Sonnet 5.5 e Haiku 5.5                                                                                                                              | Documentação de residência de dados                                                                                      | Saber se há processamento fora dos EUA; o Brasil provavelmente não está disponível                                         |
| A8  | E-mail que recebe avisos de incidente (o DPA fala em 48 h)                                                                                                                                           | Console                                                                                                                  | Plano de incidentes                                                                                                        |
| A9  | Se as chaves das avaliações e as do produto estão em workspaces separados                                                                                                                            | Console                                                                                                                  | Separar retenção e custos, e evitar misturar dados de participantes com produção                                           |
| A10 | Política sobre conteúdo sinalizado: o que dispara e se há aviso ao cliente                                                                                                                           | Política de uso, suporte                                                                                                 | Exceção de até 2 anos que afeta a foto                                                                                     |

### 4.3 Hipótese legal ≠ mecanismo de transferência

Os dois são exigidos ao mesmo tempo e não se substituem.

| Pergunta                                                 | Resposta proposta                                                                                                                     | Situação     |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| **Hipótese legal**: por que o Sidera pode tratar a foto? | Consentimento específico e destacado (art. 11, I, por precaução; vale também se a foto não for considerada sensível, como art. 7º, I) | Proposta, J2 |
| **Mecanismo**: por que a foto pode ir aos EUA?           | Uma das hipóteses do art. 33 e da Res. 19/2024 (a confirmar)                                                                          | Pendente, J1 |

**Opções de mecanismo:**

1. **Decisão de adequação da ANPD para os EUA.** Não há registro de que
   exista. Confirmar na página da ANPD, que não abriu.
2. **Cláusulas-padrão contratuais da ANPD**, incorporadas ao contrato com
   a Anthropic. É o mecanismo mais robusto, mas depende de a Anthropic
   aceitar (A5). Um contrato padrão de adesão dificilmente é alterado
   para um cliente pequeno.
3. **Consentimento específico e em destaque para a transferência**
   (art. 33, VIII).
   - **Vantagens:** é viável já e cabe na minuta v03g (3ª caixa).
   - **Limites:** pode ser revogado; deve informar o caráter
     internacional e os riscos; e a ANPD pode restringir seu uso como
     mecanismo geral. Confirmar na Res. 19/2024.
4. **Cláusulas estrangeiras (ex.: as da UE) reconhecidas como
   equivalentes.** Só valem se houver reconhecimento formal da ANPD. Não
   presumir.

**Recomendação para o MVP:** opção 3 desde o lançamento, pedindo a
opção 2 à Anthropic (A5). Se a 2 vier, a 3ª caixa vira aviso. O jurídico
decide (J1).

## 5. Hospedagem: requisitos de seleção ou verificação

Nenhum provedor foi escolhido nem consultado. Os requisitos valem para
qualquer opção.

| #   | Requisito                                  | O que pedir ou verificar                                                                                                                                                                                | Prioridade                                                    |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| H1  | Local do processamento (funções, servidor) | Região configurável; se possível no Brasil (ex.: São Paulo). Se for fora, entra na seção 6 da política e precisa de mecanismo de transferência                                                          | Bloqueante (informação)                                       |
| H2  | Local do armazenamento                     | Banco (registro de consentimento), logs, backups e artefatos de build: onde ficam                                                                                                                       | Bloqueante (informação)                                       |
| H3  | Logs de acesso                             | O que registra (IP, URL, user-agent, horário); por quanto tempo; se o prazo é configurável; se dá para exportar (para os 6 meses do art. 15) ou desligar; **garantia de não registrar corpo de pedido** | Bloqueante                                                    |
| H4  | Logs de aplicação                          | Saída de `console.*`: prazo, quem acessa, se há envio a terceiros (observabilidade)                                                                                                                     | Antes de escala                                               |
| H5  | IP real do cliente                         | Qual cabeçalho o proxy sobrescreve de forma confiável                                                                                                                                                   | Bloqueante (segurança dos limites e art. 15)                  |
| H6  | HTTPS                                      | TLS automático, versão mínima, **HSTS** configurável, redirecionamento de HTTP                                                                                                                          | Bloqueante                                                    |
| H7  | Segurança                                  | Segredos de ambiente cifrados; controle de acesso e 2FA na conta; proteção contra DDoS ou WAF; isolamento entre ambientes                                                                               | Bloqueante (2FA e segredos); demais antes de escala           |
| H8  | Backups                                    | Do banco: frequência, prazo de retenção e região; se a exclusão alcança os backups e em quanto tempo                                                                                                    | Bloqueante só se o registro de consentimento for para o banco |
| H9  | Estado compartilhado                       | Opção de Redis ou banco para os limites, com expiração (TTL) nativa                                                                                                                                     | Bloqueante para uso público com custo de IA                   |
| H10 | Contrato                                   | DPA com papel de operador; cláusulas da ANPD ou instrumento para LGPD; prazo de aviso de incidente; lista de suboperadores; exclusão ao fim do contrato                                                 | Bloqueante (informação); negociação proporcional              |
| H11 | Transferências internacionais              | Se dados (logs, IP) saem do Brasil, inclusive para suboperadores; mecanismo                                                                                                                             | Bloqueante (informação)                                       |
| H12 | Certificações                              | SOC 2 ou ISO 27001                                                                                                                                                                                      | Desejável                                                     |

## 6. Matriz de decisões

**Prioridades:**

- **B — bloqueia o lançamento comercial;**
- **E — antes de escala;**
- **P — proporcional ou desejável.**

### 6.1 Decisões comerciais (do responsável)

| #   | Requisito                                          | Situação atual                                         | Evidência                                       | Informação pendente        | Decisão necessária                                       | Prior.                       | Responsável                 |
| --- | -------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- | -------------------------- | -------------------------------------------------------- | ---------------------------- | --------------------------- |
| C1  | Identificar o controlador                          | Só a marca "Cation Digital" no código                  | `src/config/brand.ts`                           | Todos os campos da seção 1 | Quem é o controlador                                     | **B**                        | Responsável                 |
| C2  | Canal de privacidade e encarregado                 | Inexistente                                            | —                                               | E-mail, pessoa             | Criar e-mail; designar pessoa                            | **B**                        | Responsável (com J4)        |
| C3  | Verificar a conta Anthropic                        | Contas usadas nas avaliações; condições não conferidas | Página da plataforma; DPA e termos lidos na 03G | A1, A3, A4, A8, A9         | Conferir no Console; pedir esclarecimento sobre retenção | **B**                        | Responsável                 |
| C4  | Pedir à Anthropic as cláusulas da ANPD             | Não pedido                                             | —                                               | A5                         | Fazer o pedido                                           | **B** (a resposta decide J1) | Responsável                 |
| C5  | Escolher a hospedagem                              | Não escolhida; sem deploy                              | —                                               | H1–H11                     | Selecionar com base na seção 5                           | **B**                        | Responsável (técnico apoia) |
| C6  | Pedir ZDR                                          | Não pedido                                             | Página da plataforma                            | A2                         | Pedir ou não                                             | P                            | Responsável                 |
| C7  | Retenção das avaliações internas (`avaliacao-ia/`) | Sem prazo; fora do Git                                 | Inventário 03G.1                                | —                          | Aprovar o prazo (proposta: fim da Fase 04 ou 6 meses)    | E                            | Responsável                 |

### 6.2 Decisões jurídicas (assessoria em LGPD)

| #   | Requisito                                                                                         | Situação atual                                    | Evidência                   | Informação pendente                   | Decisão necessária                                       | Prior.                                  | Responsável |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------- | ------------------------------------- | -------------------------------------------------------- | --------------------------------------- | ----------- |
| J1  | Mecanismo da transferência aos EUA                                                                | Só aviso no consentimento                         | Seção 4.3                   | Resposta de A5; texto da Res. 19/2024 | Cláusulas da ANPD ou consentimento específico (3ª caixa) | **B**                                   | Jurídico    |
| J2  | Hipóteses legais, classificação da foto, suficiência da prova do consentimento e prazo de 6 meses | Proposta (matriz 03G.1, seção 2 aqui)             | `01-inventario-e-matriz.md` | —                                     | Validar ou ajustar                                       | **B**                                   | Jurídico    |
| J3  | Aplicação do art. 15 do Marco Civil                                                               | Nenhum registro de acesso guardado pela aplicação | Seção 3                     | Tipo de pessoa (C1); modelo comercial | Aplica-se? Se sim, os logs da hospedagem bastam (H3)?    | **B**                                   | Jurídico    |
| J4  | Agente de pequeno porte e encarregado                                                             | —                                                 | —                           | C1                                    | Enquadramento e efeitos                                  | E (vira B se exigir encarregado formal) | Jurídico    |
| J5  | Revisão final da política, do consentimento e dos avisos                                          | Minutas da 03G.1                                  | `02`, `03`                  | Decisões acima                        | Aprovar textos                                           | **B**                                   | Jurídico    |
| J6  | Relatório de impacto da foto                                                                      | Avaliação de risco em `01`, seção 3               | —                           | —                                     | Formato necessário                                       | E                                       | Jurídico    |
| J7  | Suboperadores e transferência ulterior                                                            | Lista não lida                                    | —                           | A6, H10                               | Suficiência                                              | P                                       | Jurídico    |

### 6.3 Decisões técnicas (implementação, 03G.3)

| #   | Requisito                                                              | Situação atual                        | Evidência                                       | Informação pendente    | Decisão necessária                                  | Prior.                                   | Responsável  |
| --- | ---------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------- | ---------------------- | --------------------------------------------------- | ---------------------------------------- | ------------ |
| T1  | Textos desatualizados (FAQ, aviso dos dados de nascimento, comentário) | Incorretos                            | `como-funciona/page.tsx`, `birth-data-form.tsx` | —                      | Nenhuma: usar o texto conservador sobre a Anthropic | **B**                                    | Técnico      |
| T2  | Registro mínimo de consentimento                                       | Inexistente                           | `consent-receipt.ts`                            | Armazenamento (C5); J2 | Aprovar o desenho da seção 2                        | **B**                                    | Técnico + J2 |
| T3  | Consentimento v03g                                                     | Minuta                                | `03-…minuta.md`                                 | J1 (3ª caixa), C1/C2   | —                                                   | **B**                                    | Técnico      |
| T4  | Página da política e links                                             | Minuta                                | `02-…minuta.md`                                 | C1, C2, J5             | —                                                   | **B**                                    | Técnico      |
| T5  | Hash de IP com segredo e limpeza ativa (1 h)                           | SHA-256 sem segredo; sem limpeza      | `handlers.ts:195`, `rate-limit.ts`              | —                      | Nenhuma                                             | **B** (é o prazo que a política promete) | Técnico      |
| T6  | IP confiável                                                           | Primeiro `x-forwarded-for` (forjável) | `handlers.ts`                                   | H5                     | Cabeçalho certo da hospedagem                       | **B**                                    | Técnico      |
| T7  | Limites compartilhados entre instâncias                                | Memória por processo                  | `rate-limit.ts`                                 | H9                     | Armazenamento com TTL                               | **B** para uso público                   | Técnico      |
| T8  | Registro de acesso do art. 15                                          | Inexistente                           | —                                               | J3, H3                 | Próprio ou via hospedagem                           | **B** se J3 = sim                        | Técnico      |
| T9  | Garantia de que logs não têm corpo nem recibo                          | A API não tem `console.*`             | `handlers.ts` (comentário e código)             | H3, H4                 | Teste automatizado                                  | E                                        | Técnico      |
| T10 | CSP e HSTS                                                             | Sem CSP; HSTS depende da hospedagem   | `next.config.ts`                                | H6                     | —                                                   | E (HSTS: B via H6)                       | Técnico      |
| T11 | Orientação de captura: só a palma                                      | Inexistente                           | —                                               | —                      | —                                                   | E                                        | Técnico      |

### 6.4 O que realmente bloqueia o lançamento

Das 25 pendências da 03G.1, **seis frentes** bloqueiam. As demais podem
vir antes de escala ou ser tratadas de forma proporcional.

1. **Quem é o controlador e como contatá-lo** (C1, C2).
2. **Conta Anthropic verificada** (C3) e **pedido das cláusulas da ANPD**
   (C4), que levam à **decisão do mecanismo** (J1).
3. **Hospedagem escolhida com as informações de H1–H11** (C5), que
   destrava T2, T6, T7 e T8.
4. **Parecer jurídico** sobre hipóteses legais, prova do consentimento e
   Marco Civil (J2, J3), mais a **revisão dos textos** (J5).
5. **Correções sem dependência** (T1, T5): podem ser feitas já.
6. **Implementação dependente** (T2, T3, T4, T6, T7, T8), depois das
   decisões.

**Independentemente da privacidade**, o lançamento comercial continua
condicionado à pendência de reprodutibilidade visual (03F.2).

## 7. Plano mínimo para a 03G.3

**Bloco 1 — sem dependências, pode começar com a sua aprovação.**

1. Corrigir os textos (T1):
   - a FAQ de `/como-funciona`;
   - o aviso dos dados de nascimento;
   - o comentário de `birth-data-form.tsx`.

   A Anthropic é descrita com o limite conservador: "até 30 dias por
   padrão, com exceções".

2. Hash de IP com HMAC e limpeza ativa das chaves vencidas (T5), com
   testes.
3. Teste que garante que nenhuma rota da palma registra corpo ou recibo
   (T9).
4. Orientação de captura: só a palma (T11).

Não muda o fluxo, os modelos nem os testes visuais.

**Bloco 2 — preparar, sem publicar, atrás de configuração.**

1. **Consentimento v03g** (T3), com a 3ª caixa configurável (ligada por
   padrão até J1).
2. **Registro de consentimento** (T2):
   - interface de armazenamento, com versão em memória para
     desenvolvimento e testes;
   - o adaptador persistente fica para quando houver hospedagem.
3. **Página da política** (T4):
   - com os campos `[A FORNECER]`;
   - **fica fora do ar** (sem rota pública) enquanto houver campo
     pendente;
   - um teste impede publicar com marcador pendente.

**Bloco 3 — depende das decisões externas.**

- **Depende de C5 (hospedagem):** IP confiável, limites compartilhados,
  registro do art. 15 e HSTS (T6, T7, T8, T10).
- **Depende de C1, C2 e J5:** publicação da política e do consentimento.

**Gate para seguir ao Bloco 3:** respostas de C1, C2, C3, C4 e C5, e o
parecer J1–J3.

**Rede desta sessão (opcional):** liberar `privacy.claude.com`,
`www.gov.br` e `www.planalto.gov.br` permitiria ler aqui as três fontes
que faltaram.
