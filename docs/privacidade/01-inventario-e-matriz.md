# Privacidade — inventário, fluxos e matriz de tratamento

**Fase 03G.1, documento de trabalho (23/11/2026).** Não é texto público.

O levantamento foi feito no código do commit `912ba91`. Nenhum código foi
alterado.

**Legenda:**

- **[FATO]** comportamento conferido no código;
- **[PROPOSTA]** sugestão para decisão;
- **[PENDENTE]** depende de definição do responsável, de confirmação
  externa ou de revisão jurídica.

**Escopo.** Vale para o produto em modo real, com a análise ligada
(`SIDERA_PALM_ANALYSIS_ENABLED`, motor e Anthropic). Os modos desligado e
simulado tratam menos dados e já têm textos próprios.

## 1. Fluxos

**Fluxo 1 — Leitura das mãos** (`/leitura-das-maos`, API em
`/api/leitura-das-maos/*`).

1. **Aparelho:**
   - a pessoa escolhe a mão e aceita o consentimento;
   - a foto escolhida é redesenhada em canvas e recodificada em JPEG sem
     metadados;
   - a imagem fica com no máximo 2.576 px no lado maior e 2,5 MB;
   - o arquivo original no aparelho não é alterado. **[FATO]**
2. **Recibo:**
   - `POST /consentimento` envia a versão do texto, 18+, a autorização e a
     mão;
   - o servidor devolve um recibo assinado (HMAC) com mão, validade de
     30 min e código aleatório;
   - o servidor não guarda o recibo. **[FATO]**
3. **Análise:** `POST /analise` envia a foto preparada no corpo e o
   recibo no cabeçalho.
   - **Checagens:** o servidor confere a origem, o recibo, os limites, o
     tamanho e se o JPEG tem metadados (recusa EXIF, XMP, IPTC).
   - **Hashes:** calcula o hash da foto e o hash do IP. **[FATO]**
4. **Visão:** a imagem (base64), a mão e as instruções vão à **Anthropic
   (EUA)**, modelo Sonnet 5.5.
   - Volta uma observação estruturada (características, visibilidade,
     evidência textual).
   - Nenhum identificador da pessoa é enviado. A Anthropic recebe o IP do
     servidor, não o da pessoa. **[FATO]**
5. **Capítulos:** só a observação validada vai à **Anthropic**, modelo
   Haiku 5.5. A foto não vai nessa chamada.
   - Volta o texto dos capítulos 6 e 7. Em caso de falha, o texto vem da
     biblioteca local. **[FATO]**
6. **Depois da análise:**
   - o servidor zera a imagem na memória;
   - o resultado (texto, sem foto e sem evidência bruta) fica em cache
     **até 10 minutos**, indexado pelo hash, e é apagado no vencimento;
   - o resultado volta ao aparelho. **[FATO]**

**Fluxo 2 — Dados de nascimento e mapa natal**
(`/dados-de-nascimento`).

- **Envio:** data, hora e local saem do formulário e vão ao servidor por
  Server Actions, para normalização e cálculo. **[FATO]**
- **No servidor:**
  - o local é resolvido em bases locais (IBGE, GeoNames, tzdb);
  - nenhum dado é enviado a terceiros;
  - nada é gravado;
  - o log de erro registra só o tipo do erro ou a versão da base de
    fusos. **[FATO]**
- **Interpretação por IA (Fase 02F):** existe no código atrás de
  `SIDERA_AI_ENABLED`, mas **nenhuma página a usa**. Quando for ligada
  (Fase 04), este inventário precisa ser revisto. **[FATO]**

**Fluxo 3 — Avaliações internas** (`avaliacao-ia/`, fora do Git, contêiner
de desenvolvimento).

- **Participantes:** 4, com pseudônimos M01–M04, autorizados pelo
  responsável. **[FATO]**
- **Fotos:** apagadas em 19/11/2026, com registro. **[FATO]**
- **O que ficou:**
  - observações com evidência textual da palma;
  - textos gerados e fichas de auditoria;
  - impressões digitais (SHA-256) das fotos. **[FATO]**

## 2. Inventário por categoria

| #   | Categoria                    | Dados                                                            | Onde                                                | Quanto tempo                                                                                     | Destinatários                                     | Fonte               |
| --- | ---------------------------- | ---------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------- | ------------------- |
| D1  | Foto da palma                | imagem JPEG preparada, sem metadados                             | aparelho (memória da tela); servidor (memória)      | aparelho: até descartar ou sair; servidor: durante a análise (≤ 55 s)                            | Anthropic (EUA)                                   | [FATO]              |
| D2  | Observação visual            | características, visibilidade e evidência textual da palma       | servidor (memória)                                  | durante a análise; não vai ao aparelho nem ao cache                                              | Anthropic (gerada por ela; vai ao Haiku)          | [FATO]              |
| D3  | Leitura (resultado)          | capítulos, frases "Observado", limitações, mão                   | servidor (cache) e aparelho                         | cache ≤ 10 min; aparelho até sair                                                                | —                                                 | [FATO]              |
| D4  | Hash da foto                 | SHA-256 do conteúdo (chave do cache e da deduplicação)           | servidor (memória)                                  | ≤ 10 min, com o resultado                                                                        | —                                                 | [FATO]              |
| D5  | Consentimento                | versão, 18+, autorização, horário do aparelho e mão              | aparelho (memória); servidor só no pedido do recibo | até sair; **sem registro no servidor**                                                           | —                                                 | [FATO]              |
| D6  | Recibo                       | mão, validade e código aleatório, assinados                      | aparelho                                            | 30 min                                                                                           | —                                                 | [FATO]              |
| D7  | Hash do IP                   | SHA-256 de `client:<ip>`, **sem segredo**                        | servidor (memória, limitador)                       | janela de 1 h; a chave só sai quando o limite de 10.000 chaves é atingido ou o processo reinicia | —                                                 | [FATO]              |
| D8  | Contadores                   | uso por recibo e por hash de IP                                  | servidor (memória)                                  | igual a D7                                                                                       | —                                                 | [FATO]              |
| D9  | Dados de nascimento          | data, hora, local; mapa calculado                                | aparelho; servidor (pedido)                         | servidor: durante o pedido; aparelho: até sair                                                   | —                                                 | [FATO]              |
| D10 | Logs de erro da aplicação    | tipo do erro, versão da tzdb; a API da palma não tem `console.*` | saída do processo, depois a hospedagem              | conforme a hospedagem                                                                            | hospedagem                                        | [FATO] / [PENDENTE] |
| D11 | Logs de acesso da hospedagem | costumam guardar IP, data e hora, URL, user-agent                | hospedagem                                          | **a definir**                                                                                    | hospedagem                                        | [PENDENTE]          |
| D12 | Avaliações internas          | observações com evidência, textos, fichas, pseudônimos, hashes   | contêiner de desenvolvimento                        | **sem prazo definido**                                                                           | Anthropic recebeu as fotos e textos nas execuções | [FATO] / [PENDENTE] |

**O que não existe hoje** **[FATO]**:

- conta ou login;
- nome, e-mail ou telefone da pessoa;
- cookies, `localStorage`, analytics ou pixels;
- banco de dados com dados pessoais (o Prisma só tem o catálogo de
  produtos);
- pagamento;
- uso dos dados para marketing;
- decisão automatizada com efeito jurídico.

## 3. Fotografias das palmas: avaliação de risco

**Enquadramento.** A LGPD trata como sensível o dado biométrico **quando
vinculado a uma pessoa natural** (art. 5º, II). A conferência no texto
oficial está pendente.

Uma foto de mão não é, por si só, um dado biométrico processado. O risco
depende de três coisas:

- a imagem permitir extrair um modelo biométrico;
- a imagem estar vinculada a uma pessoa identificada ou identificável;
- a finalidade do processamento.

| Fator                    | No Sidera                                                                                                                       | Efeito no risco                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Finalidade               | Leitura simbólica de características gerais (proporções, linhas principais); **não** identifica nem autentica                   | reduz                                                                                                        |
| Processamento biométrico | Nenhum modelo biométrico é gerado ou comparado; o modelo de visão devolve categorias e frases                                   | reduz                                                                                                        |
| Resolução                | Até 2.576 px no lado maior; uma palma bem iluminada pode mostrar a textura palmar, e não se pode excluir extração por terceiros | **aumenta**                                                                                                  |
| Vínculo com a pessoa     | Sem conta, sem nome, sem e-mail; a foto não é associada a identificador; o IP vira hash e não acompanha a foto                  | reduz, mas a pessoa continua identificável em tese (a foto pode mostrar anéis, tatuagens, cicatrizes, fundo) |
| Guarda                   | Sidera: só em memória, sem gravação; Anthropic: retenção do provedor (até 30 dias por padrão, com exceções)                     | risco concentrado no provedor                                                                                |
| Transferência            | EUA                                                                                                                             | aumenta                                                                                                      |
| Público                  | Adultos, autodeclarados                                                                                                         | neutro                                                                                                       |

**Conclusão [PROPOSTA]:**

- **Risco:** médio.
- **Classificação:** não afirmar que a foto é dado biométrico sensível,
  mas **tratá-la preventivamente com a proteção de dado sensível**.
- **Por quê:** a classificação final depende de avaliação jurídica.

**Proteção reforçada, já implementada [FATO]:**

- envio só depois de ação explícita;
- metadados removidos;
- sem gravação;
- imagem zerada após o uso;
- cache sem a foto;
- sem reuso para outra finalidade.

**Proteção reforçada, proposta [PROPOSTA]:**

- **Hipótese legal:** consentimento específico e destacado, que é válido
  nos dois cenários (sensível ou não).
- **Orientação de captura:** "mostre só a palma; evite anéis, tatuagens e
  documentos no fundo".
- **Resolução menor:** avaliar reduzir a resolução máxima enviada, se a
  qualidade da leitura permitir. Isso exige medir antes; fica fora da
  03G.1.
- **Retenção do provedor:** confirmar a da conta e avaliar ZDR
  ([PENDENTE]).
- **Relatório de impacto:** simplificado, para esta categoria.

## 4. Matriz de tratamento

A coluna "hipótese legal" é **proposta para revisão jurídica**. A
hipótese legal diz por que o tratamento é permitido. O mecanismo de
transferência diz por que o envio ao exterior é permitido. São decisões
separadas.

| #                             | Finalidade                                      | Hipótese legal proposta                                                                                                                                                                    | Mecanismo de transferência                                                                                                                                                                               | Destinatários                        | Retenção                                                                                          | Exclusão                                                                                                                                                          |
| ----------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1 Foto                       | Produzir a leitura simbólica pedida pela pessoa | Consentimento específico e destacado (art. 11, I; se não sensível, art. 7º, I)                                                                                                             | **[PENDENTE]**: cláusulas-padrão da ANPD (Res. 19/2024) com a Anthropic, se viável; senão consentimento específico e em destaque para a transferência (art. 33, VIII). Cláusulas da UE não bastam por si | Anthropic, PBC (EUA), como operadora | Sidera: duração da análise. Anthropic: até 30 dias por padrão, com exceções **[PENDENTE: conta]** | Sidera: automática (memória zerada). Anthropic: pela regra dela; o Sidera **não consegue** pedir exclusão de uma análise específica (não há vínculo com a pessoa) |
| D2 Observação                 | Etapa intermediária da leitura                  | A mesma de D1 (dado derivado)                                                                                                                                                              | Igual a D1                                                                                                                                                                                               | Anthropic                            | Sidera: duração da análise                                                                        | Automática                                                                                                                                                        |
| D3 Leitura                    | Entregar o resultado; evitar repetir a análise  | A mesma de D1                                                                                                                                                                              | — (saída do provedor, igual a D1)                                                                                                                                                                        | —                                    | Cache ≤ 10 min                                                                                    | Automática no vencimento                                                                                                                                          |
| D4 Hash da foto               | Cache e deduplicação                            | Legítimo interesse (art. 7º, IX), com a mesma retenção do resultado                                                                                                                        | —                                                                                                                                                                                                        | —                                    | ≤ 10 min                                                                                          | Automática                                                                                                                                                        |
| D5/D6 Consentimento e recibo  | Autorizar a análise e limitar tentativas        | Consentimento (é a própria autorização)                                                                                                                                                    | —                                                                                                                                                                                                        | —                                    | 30 min (recibo)                                                                                   | Automática                                                                                                                                                        |
| D7/D8 Hash de IP e contadores | Segurança e prevenção de abuso (custo)          | Legítimo interesse (art. 7º, IX), com avaliação de impacto simples (art. 10)                                                                                                               | —                                                                                                                                                                                                        | —                                    | 1 h (**[PROPOSTA]**: garantir a limpeza e usar HMAC com segredo)                                  | Hoje: só no limite ou no reinício; proposta: automática após 1 h                                                                                                  |
| D9 Nascimento                 | Calcular o mapa pedido                          | Procedimentos preliminares de contrato a pedido do titular (art. 7º, V) **[PENDENTE: jurídico]**; alternativa: consentimento                                                               | —                                                                                                                                                                                                        | —                                    | Duração do pedido                                                                                 | Automática                                                                                                                                                        |
| D10/D11 Logs                  | Operação, segurança; possível obrigação legal   | Cumprimento de obrigação legal, se aplicável (Marco Civil da Internet, art. 15: guarda de registros de acesso a aplicações por 6 meses **[PENDENTE: jurídico]**); senão legítimo interesse | **[PENDENTE]**: depende da hospedagem                                                                                                                                                                    | Hospedagem **[PENDENTE]**            | **[PENDENTE]**                                                                                    | **[PENDENTE]**                                                                                                                                                    |
| D12 Avaliações                | Validação de qualidade do produto               | Consentimento dos participantes (autorizações registradas)                                                                                                                                 | Igual a D1, nas execuções                                                                                                                                                                                | Anthropic (nas execuções)            | **[PROPOSTA]**: até o fim da Fase 04 ou 6 meses, o que vier antes                                 | **[PROPOSTA]**: exclusão registrada; ou pseudonimização reforçada (remover evidências textuais)                                                                   |

**Pontos de atenção para a revisão jurídica:**

1. **Prova do consentimento** (art. 8º, § 2º). O controlador tem o ônus
   da prova, mas hoje o servidor **não registra** o aceite: o recibo não é
   guardado.
   - **Decisão [PENDENTE]:** manter sem registro (minimização) ou guardar
     um registro mínimo, sem foto e sem IP (versão, data, código do
     recibo).
2. **Marco Civil, art. 15.** Se o Sidera se enquadrar como provedor de
   aplicação com fins econômicos, os registros de acesso (IP, data e
   hora) teriam guarda obrigatória por 6 meses.
   - Hoje a aplicação não guarda esses registros. A hospedagem pode
     guardá-los.
   - Isso muda o que a política pode prometer sobre IP.
3. **Operadora ou controladora.** Confirmar o papel da Anthropic. O DPA
   dela a trata como processadora, com exceções para usos próprios
   (segurança, conformidade).
4. **Agente de pequeno porte** (Res. CD/ANPD nº 2/2022). Confirmar se o
   regime simplificado se aplica. Tratamento de dado sensível ou de alto
   risco pode afastá-lo.
