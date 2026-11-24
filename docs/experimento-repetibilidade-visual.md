# Experimento de repetibilidade visual — plano operacional

Status: **plano revisado em 24/11/2026; ferramenta de avaliação preparada
e testada só com dados simulados (seção 9).** Aguarda autorização explícita
para o piloto. Nada foi executado:

- nenhuma chamada paga;
- nenhuma foto pedida ou recuperada;
- nenhuma mudança no produto (motor visual, prompt, contrato, validador).

Os ajustes metodológicos feitos **antes de qualquer coleta** estão na
seção 8.

Esta versão substitui a proposta anterior deste mesmo arquivo. O histórico
está no Git.

**Pergunta:** com a **mesma fotografia** e a implementação **atual** sem
nenhuma mudança, o modelo de visão dá observações consistentes o bastante
para sustentar a leitura das mãos vendida pelo Sidera?

Este experimento mede **repetibilidade** (mesma entrada, várias análises).
Ele **não** mede:

- a variação entre fotos diferentes da mesma mão;
- a **exatidão visual** (seção 1.4), que é outra pergunta.

## 0. Histórico recuperado

| Tema                                                   | O que os registros mostram                                                                                                                                                                                                                                                                                                          | Fonte                                                                   |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Avaliações já feitas                                   | **03F.1 rodada 1:** 8 fotos, prompt 03d.1, Haiku e Sonnet. **03F.1 rodada 2:** as mesmas 8 fotos, prompt 03d.2 e contrato 03c.2; Sonnet escolhido como modelo de visão. **03F.2 Etapa A** (Rev1, Rev2): só texto, a partir das observações; sem novas análises visuais. **03F.2 Etapa B:** 3 fotos de ponta a ponta, 1 análise cada | `fase-03f1-avaliacao-visual.md` §9; `fase-03f2-plano.md`                |
| Divergências com a **mesma entrada**                   | foto-05 entre a rodada 2 e a Etapa B (mesmo prompt 03d.2): 3 das 8 características classificadas mudaram. **Formato da palma** retangular → quadrada (declarado "claro" nas duas); **comprimento da linha da cabeça** média → longa (parcial); **arco da linha da vida** fechado → amplo (parcial). foto-01 e foto-04: iguais       | `avaliacao-ia/03f2-etapa-b/consistencia-visual.md` (local, fora do Git) |
| Divergências **não comparáveis**                       | Rodada 1 × rodada 2: o prompt mudou entre elas (calibração), então não servem como medida de estabilidade                                                                                                                                                                                                                           | idem                                                                    |
| Divergências que mudaram a interpretação               | As três. Palma: sensibilidade ↔ praticidade. Cabeça: equilíbrio ↔ pensamento abrangente. Arco da vida: ritmo cuidadoso ↔ entusiasmo. Duas com sentido quase oposto                                                                                                                                                                  | idem                                                                    |
| Consequência já aplicada                               | Palma, comprimento da cabeça e arco da vida estão fora dos capítulos 8 e 9 (D4). Os capítulos 6 e 7 continuam a usá-los, com ressalva                                                                                                                                                                                               | `fase-04d-biblioteca-consolidada.md`                                    |
| Exatidão (não é repetibilidade)                        | Comprimento dos dedos da foto-05: a referência humana e a auditoria divergiram. Formato da palma e comprimento dos dedos são os traços mais frágeis (proporção com perspectiva)                                                                                                                                                     | `fase-03f1-avaliacao-visual.md` §9                                      |
| Configuração usada                                     | `claude-sonnet-5-5`, `effort: medium`, `max_tokens` 4000, sem temperatura definida. Prompt de visão **03d.2**, contrato **03c.2**, validador atual. Preparação `prepareEvalPhoto` (JPEG idêntico em execuções repetidas, verificado). Até 2 tentativas no produto                                                                   | código atual (`VISION_PROMPT_VERSION`, `OBSERVATION_VERSION`)           |
| Consumo real (16 chamadas do Sonnet nas rodadas 1 e 2) | Rodada 2, com cache lido: US$ 0,0064–0,0113 por chamada (média ≈ US$ 0,0083); saída de 321–734 tokens. Gravação do cache: ≈ US$ 0,016 por mão, por janela de 5 min. Etapa B: relatório "frio" ≈ US$ 0,03 e "quente" ≈ US$ 0,01                                                                                                      | `avaliacao-ia/03f-rodada2/restrito/resultados.json` (local)             |
| Qualidade da amostra antiga                            | Na rodada 2, só a foto-05 saiu "completa". 6 parciais, 1 insuficiente. Só **23 das 72** células (foto × característica) tiveram valor classificado. Linha do destino: nenhuma                                                                                                                                                       | idem                                                                    |
| Arquivos excluídos                                     | Em 19/11/2026, 20:26 UTC: as 8 fotos (`p01`–`p08`), o manifesto e o mapa, com tamanho e SHA-256 registrados. Nenhuma cópia no contêiner. O que foi enviado à Anthropic segue a retenção dela                                                                                                                                        | `consistencia-visual.md`, seção "Exclusão"                              |
| Consentimentos                                         | O termo da 03F.1 (minuta, códigos `AUT-03F-NN`) autorizava **até 2 envios por modelo** e exclusão em até 7 dias. **Os 4 participantes precisam de um termo novo e específico.** Os termos assinados ficam fora do Sidera; não consigo verificar se cobriam também a rodada 2 e a Etapa B. Cabe ao responsável confirmar             | `fase-03f1-coleta-de-fotos.md` §1                                       |

**Consequência para o desenho:** as 8 fotos antigas sozinhas dariam pouco
dado classificado. Por isso a ampliação tem uma parte opcional com fotos
novas, que exige autorização própria (seção 2).

## 1. Hipóteses e métricas

### 1.1 Hipóteses (registradas antes dos dados)

- **H1.** Nas células com classificação, o valor se repete em ≥ 90% das
  análises de cada característica usada nos capítulos 6 e 7.
- **H2.** As inversões de sentido (seção 1.2) são raras: ≤ 5% dos pares.
- **H3.** A instabilidade se concentra em traços **limítrofes**: visibilidade
  parcial, ou evidência com "um pouco", "fraco" ou "muitas linhas".
  Observações declaradas "claras" quase não variam.
- **H4.** O estado da leitura (completa, parcial ou insuficiente) e o pedido
  de nova foto são estáveis por foto.

### 1.2 O que se compara (redação × classificação)

- **Unidade:** uma análise é uma chamada de visão independente, com a mesma
  foto, o mesmo JPEG preparado, o mesmo prompt, os mesmos parâmetros e o
  mesmo modelo.
- **Comparado:** só o **resultado estruturado** de cada característica:
  visibilidade, valor e motivo.
- **Fica fora das métricas** o texto livre da "evidência" e qualquer outra
  redação do modelo. A evidência é guardada só para analisar, depois, _por
  que_ algo variou.
- **Leitura que chega à pessoa:** cada observação passa, offline e sem
  custo, pelo motor atual das mãos (`buildPalmInterpretation`). Comparam-se
  os **ids dos itens** dos capítulos 6 e 7. Variações de redação dos
  capítulos não existem nesse caminho: o texto vem da biblioteca, um por
  valor.

**Tipos de divergência entre duas análises da mesma característica:**

| Tipo                       | Definição                                                                                                                                                                                                                                                                                  | Peso                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| **Inversão**               | Os dois classificados, com valores diferentes. Nas binárias (palma, traçado do coração, inclinação e início da cabeça, arco da vida) toda troca é inversão de sentido. Nas de 3 níveis (dedos, comprimentos do coração e da cabeça), curta ↔ longa é **oposta** e vizinhos são **gradual** | Grave: a leitura muda de sentido                               |
| **Oscilação de abstenção** | Um classificado e o outro não interpretado (não visível, ambíguo ou inclassificável)                                                                                                                                                                                                       | Moderado: a leitura perde ou ganha um item, sem se contradizer |
| **Variação de motivo**     | Os dois não interpretados, por motivos diferentes                                                                                                                                                                                                                                          | Irrelevante para a leitura; só registrada                      |
| **Saída inválida**         | Rejeitada pelo validador (1 tentativa por chamada, seção 2)                                                                                                                                                                                                                                | Contada à parte                                                |

### 1.3 Métricas

Calculadas por célula (foto × característica) com N análises válidas, e
agregadas por característica.

| #   | Métrica                                  | Definição                                                                                                                                                                                                                                                                                         |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | **Concordância por característica**      | Fração das análises iguais ao resultado mais frequente (valor ou "não interpretado"). Também no nível estrito (visibilidade + valor + motivo), só descritivo                                                                                                                                      |
| M2  | **Concordância nos capítulos 6 e 7**     | Por foto: fração das análises cujo conjunto de itens do capítulo 6 (e, à parte, do 7) é **idêntico** ao mais frequente. Inclui o tipo de mão, que deriva de palma + dedos                                                                                                                         |
| M3  | **Divergências que mudam o significado** | Taxa de inversão = pares classificados com valores diferentes ÷ pares classificados. Separada em oposta e gradual                                                                                                                                                                                 |
| M4  | **Indeterminadas**                       | Taxa de "não interpretado" por característica e taxa de oscilação de abstenção                                                                                                                                                                                                                    |
| M5  | **Pedido de nova foto**                  | Por foto: frequência de `retakeRecommended` e do estado da leitura; fração de fotos em que ele é igual em todas as análises                                                                                                                                                                       |
| M6  | **Estabilidade entre execuções**         | As análises de cada foto em **duas sessões em dias diferentes** são comparadas (M1 e M3 por sessão). Para as fotos com o mesmo SHA-256, comparação descritiva com a rodada 2 e a Etapa B                                                                                                          |
| M7  | **Custo**                                | Por análise e por foto (consumo real × tabela de preços), com e sem gravação de cache; latência por análise                                                                                                                                                                                       |
| M8  | **Calibração**                           | M1 e M3 separados pela visibilidade declarada (clara × parcial). Testa a H3                                                                                                                                                                                                                       |
| M9  | **Consenso simulado**                    | Offline e gratuito; só informa a decisão, nada é implementado. Sortear 3 análises por foto (1.000 sorteios); manter a característica quando as 3 concordam (variante: 2 de 3); divergência vira indeterminada. Medir a inversão entre dois consensos independentes e a perda de itens e capítulos |

**Intervalos.** Cada taxa sai com dois intervalos de 95% (detalhes na
seção 8.1):

- **Wilson nominal:** trata os pares de análises como independentes. É
  otimista, porque as repetições de uma mesma foto não são independentes.
- **Bootstrap por foto:** reamostra fotografias, a unidade independente.
  Com menos de 5 fotos com dado, vem marcado como "não informativo".

Com 10 análises e poucas fotos por característica, os intervalos serão
largos.

- Um resultado "estável" quer dizer **"sem sinal de instabilidade acima do
  limite nesta amostra"**.
- Não é garantia de confiabilidade em uso real.

### 1.4 Exatidão visual (separada e opcional)

A repetibilidade não diz se a classificação está **certa**. Se for
autorizada uma referência humana:

- **Quem e como:**
  - **duas pessoas revisoras independentes**, que não veem as respostas do
    modelo nem uma a outra;
  - usam só as definições do contrato 03c.2 e o JPEG preparado;
  - para cada característica, marcam um valor ou "indeterminado".
- **Referência:** só as células em que as duas concordam com um valor.
  - Quando discordam, a célula é **ambígua**: fica fora da exatidão e entra
    como variável explicativa da instabilidade (H3).
  - Nenhuma opinião isolada vale como verdade.
  - Auditorias assistidas por IA não contam como referência.
- **Relato:**
  - concordância entre as revisoras;
  - concordância entre o valor mais frequente do modelo e a referência.
  - A exatidão **não** entra nos critérios da seção 3, que tratam só de
    repetibilidade.

## 2. Amostra e número de repetições

**Configuração fixa em todo o experimento:**

- a do produto no commit em que a execução começar;
- **sem mudança no motor, no prompt, no contrato, no validador ou nos
  parâmetros**;
- **1 tentativa por chamada**, sem nova tentativa, para medir a resposta
  crua.

A ordem é em rodadas: cada rodada analisa cada foto uma vez, agrupada por
mão dentro da rodada para aproveitar o cache. Assim, uma deriva no tempo se
distribui entre as fotos. O cache muda o custo, não a resposta (verificado
na 03F.2).

| Etapa                                                                | Fotos                                                                                                                                                                                                  | Análises                                                                                                  | Chamadas   | Sessões                                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------- |
| **Piloto**                                                           | 2 das antigas, reenviadas e conferidas pelo SHA-256: a **foto-05** (a única completa e o caso que motivou o experimento) e uma parcial com classificações (foto-06 ou foto-08, conforme a autorização) | 5 por foto                                                                                                | **10**     | 1                                      |
| **Ampliação A** (histórico)                                          | Todas as antigas reautorizadas: até 8, de 4 pessoas                                                                                                                                                    | 10 por foto, **cumulativas**: as 5 do piloto contam, e as 2 fotos do piloto recebem só mais 5 (seção 8.3) | até **70** | 2, em dias diferentes (5 + 5 por foto) |
| **Ampliação B** (opcional, recomendada, **com autorização própria**) | Fotos **novas**, tiradas com o guia de captura atual: 8, de pelo menos 4 pessoas                                                                                                                       | 10 por foto                                                                                               | **80**     | 2, em dias diferentes                  |

**Por que 10 análises por foto.** É a chance de ver pelo menos uma
inversão numa foto, conforme a taxa real:

| Taxa real de inversão | 5 análises | 10 análises |
| --------------------- | ---------- | ----------- |
| 10%                   | 41%        | 65%         |
| 20%                   | 67%        | 89%         |
| 30%                   | 83%        | 97%         |

**Por que a ampliação B.** As fotos antigas são quase todas parciais.

- Com elas, a maioria das características ficaria com 1 a 3 células
  classificadas: abaixo do mínimo para avaliar (seção 3.2).
- A Ampliação B mede o comportamento nas fotos que o produto pretende
  receber, depois da orientação de captura.
- Sem ela, o resultado mais provável é "inconclusivo" para várias
  características.

**Mínimo para a Ampliação A:** 4 fotos reautorizadas, de pelo menos 2
pessoas. Abaixo disso, só a Ampliação B.

## 3. Critérios de aprovação e reprovação

Fixados **antes** de qualquer execução. Não serão mudados depois de ver os
resultados. Qualquer desvio fica registrado como desvio.

### 3.1 Piloto: só critérios operacionais

O piloto passa quando:

1. as 10 análises são registradas por completo: observação estruturada,
   uso de tokens, custo, latência e SHA-256 da entrada;
2. no máximo **1 em 10** é saída inválida ou erro do provedor;
3. o custo médio por análise com cache lido é **≤ US$ 0,02**, até 2,4 vezes
   a média histórica;
4. nenhuma análise passa de 55 s;
5. nenhuma imagem aparece em registros ou logs, e a exclusão foi feita e
   registrada.

**Os números de estabilidade do piloto são só descritivos.** Eles **não**
decidem a ampliação: isso evitaria parar ou seguir conforme o resultado.

- **Piloto dentro da conta:** se passou sem mudança na ferramenta, as 10
  análises entram na Ampliação A.
- **Piloto fora da conta:** se a ferramenta precisou de correção, ele é
  descartado e refeito com a mesma regra.

### 3.2 Veredito por característica (Ampliação A + B)

**Característica avaliável:** pelo menos **3 fotos** com ≥ 5 análises
classificadas cada.

| Veredito          | Regra                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Estável**       | Avaliável; inversão agregada ≤ 5%; nenhuma inversão **oposta**; concordância (M1) ≥ 90% em pelo menos 85% das células avaliáveis (7 de 8, ou todas quando há até 6) |
| **Instável**      | Inversão agregada > 15%, **ou** alguma célula com inversão ≥ 30%, **ou** inversão oposta em mais de 1 foto                                                          |
| **Intermediária** | Avaliável, mas nem estável nem instável                                                                                                                             |
| **Inconclusiva**  | Não avaliável. **Não pode ser declarada estável** e conta como não aprovada para uso comercial                                                                      |

**Para o produto:**

- **Capítulos 6 e 7 estáveis:** M2 ≥ 90% em pelo menos 85% das fotos com
  o capítulo disponível.
- **Pedido de nova foto e estado da leitura estáveis:** iguais em todas as
  análises em pelo menos 85% das fotos.

## 4. Custo estimado e teto (revisado em 24/11/2026)

**Preços:** documentação oficial da Anthropic consultada em 24/11/2026.
Sonnet 5.5, por milhão de tokens:

| Entrada | Saída  | Gravação do cache (5 min) | Leitura do cache |
| ------- | ------ | ------------------------- | ---------------- |
| US$ 2   | US$ 10 | US$ 2,50                  | US$ 0,10         |

- São iguais à tabela do código (`pricing.ts`, conferida em 11/11).
- A gravação de cache de 1 hora (US$ 4) e o lote com desconto (Batch API)
  **não** são usados, porque mudariam as condições do produto.
- **Câmbio:** R$ 5,50.

| Medida                                    | Valor                                                                                                       | Base                                                                                                                                                                            |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Custo médio observado**, com cache lido | **US$ 0,0083** por análise (faixa US$ 0,0064–0,0113)                                                        | 6 análises do Sonnet com prompt 03d.2 e cache lido (rodada 2 da 03F.1)                                                                                                          |
| Custo médio observado, todas              | US$ 0,0129 por análise (máx. US$ 0,0251)                                                                    | 16 análises do Sonnet (rodadas 1 e 2), incluindo as que gravaram o cache                                                                                                        |
| Gravação do cache                         | ≈ US$ 0,016 por mão e janela de 5 min                                                                       | idem                                                                                                                                                                            |
| **Custo esperado** por análise            | US$ 0,0083 nas fotos antigas; ≈ US$ 0,0145 nas novas, até ~4.800 tokens visuais (+~3.100 tokens de entrada) | consumo real + preços                                                                                                                                                           |
| **Pior custo reservado por chamada**      | **US$ 0,0667**                                                                                              | `visionWorstCaseUsd` com o prompt atual: texto a 2 caracteres por token, imagem no teto, preço de gravação, todo o `max_tokens`. O valor citado antes (US$ 0,0645) era da 03F.1 |

| Etapa       | Chamadas    | Esperado                                                      | Teto da etapa                                                                        |
| ----------- | ----------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Piloto      | 10          | 2 análises frias + 8 com cache ≈ **US$ 0,12**                 | **US$ 0,70 (R$ 3,85)**, que cobre o pior caso das 10 (US$ 0,667; conferido em teste) |
| Ampliação A | até 70      | 70 × 0,0083 + 4 gravações (2 sessões × 2 mãos) ≈ **US$ 0,65** | **US$ 2,00 (R$ 11,00)**                                                              |
| Ampliação B | 80          | 80 × 0,0145 + 4 gravações ≈ **US$ 1,23**                      | **US$ 2,50 (R$ 13,75)**                                                              |
| **Total**   | **até 160** | **≈ US$ 2,00 (≈ R$ 11,00)**                                   | **US$ 5,20 (R$ 28,60)**                                                              |

**Como o teto age:**

- Cada etapa tem orçamento **exclusivo**.
- O pior caso de cada chamada é reservado antes dela, e o gasto é acertado
  pelo consumo real.
- A chamada só começa se o saldo cobre o pior caso. Sem saldo, a etapa para
  e registra o que faltou (`stoppedBy: "budget"`).
- O mesmo vale para o limite de chamadas da etapa (`max_calls`) e para o
  teto de 12 envios por foto (`max_sends`).

**Custo esperado não é reserva máxima.**

- O **esperado** é a estimativa pelo consumo real (≈ US$ 0,0083 ou 0,0145
  por análise).
- A **reserva** é o pior caso de uma chamada (US$ 0,0667), separada antes
  de cada chamada e devolvida no acerto.
- O **teto da etapa** é o gasto máximo aceito; nunca é aumentado
  automaticamente. Um teto maior exige nova autorização.

**Os tetos podem interromper as ampliações antes das chamadas planejadas.**
Uma chamada só começa se o saldo cobre a reserva de US$ 0,0667. Então:

| Etapa       | Interrompe antes da meta se o custo médio real por análise passar de | Margem sobre o esperado |
| ----------- | -------------------------------------------------------------------- | ----------------------- |
| Piloto      | nunca por teto: 10 × 0,0667 = US$ 0,667 ≤ US$ 0,70                   | —                       |
| Ampliação A | ≈ US$ 0,028 ((2,00 − 0,0667) ÷ 69)                                   | ≈ 3,4 × o observado     |
| Ampliação B | ≈ US$ 0,031 ((2,50 − 0,0667) ÷ 79)                                   | ≈ 2,1 × o esperado      |

Se acontecer, a etapa para com `stoppedBy: "budget"`, e o relatório
mostra as análises que faltaram. As fotos com menos de 10 análises entram
como estão: com menos de 5 análises classificadas, a célula não conta como
avaliável. Não há nova tentativa nem aumento de teto sem nova autorização.

**Por fotografia (10 análises):** ≈ US$ 0,08 nas antigas e ≈ US$ 0,15 nas
novas.

**Nenhuma chamada foi feita para testar o orçamento.** O comportamento do
teto foi verificado com o provedor simulado.

## 5. Procedimentos de privacidade

1. **Termo novo e específico**, adaptado da minuta da 03F.1.
   - **Finalidade:** medir a repetibilidade.
   - **Envios:** **até 12 por foto** ao provedor nos EUA (10 do
     experimento + margem de refação do piloto).
   - **Retenção pelo provedor:** política comercial da Anthropic
     (publicada em 01/07/2026). Entradas e saídas da API são apagadas por
     padrão em até 30 dias, com exceções contratuais, legais e de aplicação
     das políticas de uso. Conteúdo sinalizado pode ficar mais tempo. Não se
     promete exclusão individual imediata no provedor. A configuração da
     conta e o DPA serão confirmados antes da coleta (minuta, seções B.8 e
     C).
   - **Dado sensível:** a foto é tratada preventivamente como dado
     biométrico sensível (minuta, pendência J2).
   - **Revisão humana**, se houver a referência da seção 1.4.
   - **Exclusão** em até 7 dias contados do recebimento da foto. Se a
     janela vencer entre etapas, a foto é apagada e só volta com novo
     envio pela própria pessoa (conferido pelo SHA-256).
   - **Retirada** a qualquer momento.
   - **Requisitos:** 18 anos ou mais; só a palma, sem rosto, documentos,
     joias ou tatuagens.
   - **Revisão jurídica:** o termo precisa dela. O controlador precisa ser
     identificado: a empresa ainda não foi constituída (pendência 7 da
     03G).
2. **Reenvio dos arquivos originais:**
   - cada um é conferido pelo SHA-256 registrado na exclusão de 19/11;
   - um arquivo diferente entra como foto nova, sem histórico;
   - **nenhuma foto antiga é usada sem termo novo assinado.**
3. **Guarda temporária:**
   - fotos em `/tmp/sidera-fotos-rep/`, fora do repositório, com acesso
     restrito e nomes neutros (`p01`…);
   - manifesto só com o código da autorização (`AUT-REP-NN`) e a mão;
   - nenhum nome no Sidera;
   - a preparação remove os metadados.
4. **Registros:** em `avaliacao-ia/repetibilidade/restrito/`, fora do Git.
   - **Guardam:** só as observações estruturadas, a evidência textual, o
     consumo e o SHA-256.
   - **Nunca guardam:** imagem, miniatura ou base64.
   - Isso é conferido por teste e por busca antes do encerramento.
5. **Exclusão:**
   - ao fim de cada etapa (ou em até 7 dias), apagar fotos, manifesto e
     mapa;
   - registrar data, hora, tamanho e SHA-256;
   - procurar cópias no contêiner;
   - registrar que a exclusão não alcança o provedor.
   - Se a etapa seguinte não for autorizada, as fotos não são guardadas
     "para depois": pede-se um novo envio quando houver autorização.
6. **Retirada da autorização:** a foto é apagada na hora, e as linhas dela
   saem dos registros. O que já foi enviado segue a política do provedor.

## 6. Decisões possíveis depois dos resultados

Regras fixadas agora. A recomendação final cita a regra aplicada.

| Decisão                                       | Quando                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Manter a análise atual**                    | Todas as características usadas nos capítulos 6 e 7 **estáveis**, sem nenhuma inconclusiva; capítulos 6 e 7, pedido de nova foto e estado da leitura estáveis. O bloqueio comercial de repetibilidade sai, com o aviso de que traços limítrofes podem variar **entre fotos** (outro experimento)                                                                                                                                        |
| **Restringir características instáveis**      | 1 a 3 características **instáveis** e as demais estáveis. A simulação offline mostra que, sem elas, os capítulos 6 e 7 continuam disponíveis em pelo menos 75% das fotos em que estavam. Proposta: tratá-las como sempre indeterminadas (mudança de contrato e prompt, com nova validação)                                                                                                                                              |
| **Melhorar as instruções de captura**         | A instabilidade se concentra nas observações parciais (M8): inversão ≤ 5% nas "claras" e > 15% nas parciais. Ou o pedido de nova foto e o estado oscilam sobretudo nas fotos de qualidade limitada. Proposta: guia de captura e verificação de qualidade mais rígidos, medidos de novo com fotos novas                                                                                                                                  |
| **Investigar múltiplas análises (consenso)**  | Duas ou mais características intermediárias ou instáveis também nas observações claras, **e** a simulação (M9) leva a inversão entre consensos a ≤ 2%, perdendo o capítulo 6 ou o 7 em no máximo 1 das fotos em que estavam. Ressalva: com 3 análises, o pior caso reservado (≈ US$ 0,19) passa do teto atual por relatório (US$ 0,15). A implementação exigiria rever esse teto, a latência (prazo de 55 s) e os textos de privacidade |
| **Reconsiderar o escopo da leitura das mãos** | Mesmo com consenso simulado, inversão > 5% em 2 ou mais características, **ou** o capítulo 7 perdido em mais da metade das fotos em que estava, **ou** inversão > 10% em observações declaradas claras (o "claro" não é confiável). Opções para decisão de produto: só as linhas estáveis; capítulo 6 fora; leitura das mãos como complemento experimental, sem peso na oferta                                                          |

Quando nenhuma regra se aplica por falta de dados (características
inconclusivas), a decisão é **"inconclusivo"**:

- recomenda-se a Ampliação B, ou mais fotos;
- o bloqueio comercial continua.

## 7. O que precisa de autorização (nesta ordem)

1. ~~**Este plano**~~ e ~~**a preparação da ferramenta**~~: aprovados e
   feitos (seção 9).
2. ~~**Decisão sobre o ponto em aberto da seção 8.5**~~: opção 2 adotada
   em 24/11/2026.
3. **Termo novo**, com revisão jurídica, e **pedido de reenvio** aos 4
   participantes (pendências na seção 8.6).
4. ~~**Ponto de entrada**~~: escrito e testado só com entradas sintéticas
   (seção 9.4). A conexão real continua **travada no código**.
5. **Piloto** (teto US$ 0,70) e, depois do relatório dele, **Ampliação A**
   (teto US$ 2,00).
6. **Ampliação B** (fotos novas, teto US$ 2,50), com autorização e termo
   à parte.

Nada disso começa sem autorização explícita.

## 8. Ajustes metodológicos (antes da coleta, 24/11/2026)

Registrados **antes** de qualquer dado. Os limites numéricos das seções 3
e 6 **não mudaram**. Os itens abaixo são esclarecimentos de como as regras
já propostas são aplicadas, e mais um ponto que fica para sua decisão
(8.5).

### 8.1 Análises repetidas × fotografias independentes

- **As 10 análises de uma foto são medições repetidas da mesma entrada.**
  Elas medem a variação do modelo, mas não somam informação sobre outras
  mãos ou outras fotos. A unidade independente é a **fotografia**.
- Por isso:
  - toda contagem por característica traz o número de **fotos** com dado,
    além do número de pares de análises;
  - o veredito exige pelo menos 3 fotos avaliáveis, e não um número de
    pares;
  - o intervalo agrupado reamostra **fotos**. O Wilson nominal fica como
    referência otimista.
- **Limite do tamanho da amostra:**
  - a Ampliação A tem no máximo 8 fotos, e cada característica terá
    tipicamente de 1 a 8 fotos com classificação;
  - com menos de 5 fotos, o intervalo agrupado é marcado como não
    informativo;
  - mesmo com 8, ele é largo.
- **Nenhum resultado será apresentado como taxa de confiabilidade da
  população.** Ele descreve esta amostra.

### 8.2 Diversidade de imagens × diversidade de participantes

- As 8 fotos antigas são de **4 pessoas** (as duas mãos de cada uma). Duas
  fotos da mesma pessoa não são duas pessoas.
- O relatório mostra, por característica, **fotos e pessoas** com dado, e
  por grupo, o número de pessoas.
- O critério "3 fotos" não mudou. Na Ampliação A, 3 fotos implicam pelo
  menos 2 pessoas (no máximo 2 fotos por pessoa).
- Na Ampliação B, o plano já pede pelo menos 4 pessoas. Se as fotos com
  dado de uma característica vierem de uma só pessoa, o relatório diz isso
  ao lado do veredito.

### 8.3 Meta cumulativa por fotografia

- **A meta é de 10 análises por foto no total das etapas.**
- As 5 do piloto contam para as 10 da Ampliação A, se o piloto passar sem
  mudança na ferramenta (seção 3.1). As 2 fotos do piloto recebem só mais 5
  análises.
- A numeração das análises (`index`) é cumulativa entre etapas.
- Análises inválidas **contam** para a meta e para os envios: foram
  enviadas e medem a resposta crua. Por isso uma foto pode ter menos de 10
  análises **válidas**.
- O teto de **12 envios por foto**, coberto pelo termo, vale para a soma de
  todas as etapas.

### 8.4 Originais × fotografias recém-capturadas

- Os arquivos originais reenviados (grupo "original") e as fotos novas
  (grupo "nova") são **analisados e relatados em separado**. Nunca se somam
  numa mesma taxa.
- O veredito final de uma característica é o **pior entre os grupos
  avaliáveis**. Um grupo inconclusivo não melhora nem piora o outro.
- A comparação com a rodada 2 e a Etapa B da 03F.2 só vale para arquivos
  com o mesmo SHA-256, e é descritiva.

### 8.5 Esclarecimentos das regras e um ponto em aberto

Esclarecimentos (não mudam limites):

1. **Inversão oposta.**
   - Nas características binárias (palma, traçado do coração, inclinação e
     início da cabeça, arco da vida), toda troca de valor é inversão
     **oposta**.
   - Consequência: "estável" exige **nenhuma** troca nelas, porque a regra
     já pedia "nenhuma inversão oposta".
   - Nas de 3 níveis, só curta ↔ longa é oposta.
2. **Perda de capítulo no consenso** é o capítulo **desaparecer** (ficar
   sem itens), não perder um item. Conta como perda na foto quando acontece
   em mais da metade dos sorteios.
3. **"Restringir"** exige as demais características **estáveis**, como no
   texto da seção 6. Inconclusiva não conta como estável.
4. **Quando várias decisões se aplicam,** todas são relatadas, e a
   principal segue a ordem escopo > consenso > restringir > captura >
   manter. Sem nenhuma: "inconclusivo".
5. **Custo do piloto:** a média "com cache lido" usa só as análises sem
   gravação de cache.

**Decisão de 24/11/2026: opção 2 adotada** (antes de qualquer coleta).

- **Veredito individual:** características com dados suficientes recebem
  veredito individual.
- **Inconclusivas:** ficam **fora do uso comercial**. Ausência de dado
  **nunca** conta como estabilidade.
- **Capítulos:** o capítulo e a leitura completa **não** são aprovados só
  porque algumas características são estáveis. Um capítulo só é aprovado
  se, sem as características excluídas (inconclusivas, intermediárias e
  instáveis):
  - continuar **disponível** em pelo menos **75%** das fotos em que
    estava;
  - continuar **estável** (mesmos itens em ≥ 90% das análises) em pelo
    menos **85%** dessas fotos;
  - tiver pelo menos **2 características liberadas** (utilidade mínima);
  - e o estado da leitura e o pedido de nova foto forem estáveis.
- **Leitura completa:**
  - "aprovada" só com os dois capítulos aprovados e **nenhuma**
    característica excluída;
  - "aprovada com exclusões" com os dois capítulos aprovados e alguma
    exclusão;
  - "não aprovada" nos demais casos.
- **Manter:** nenhuma característica avaliável instável ou intermediária,
  **e** pelo menos um capítulo aprovado depois das exclusões. Sem capítulo
  aprovado, o resultado é "inconclusivo".
- **Restringir:** 1 a 3 instáveis; as demais estáveis ou inconclusivas
  (estas já ficam excluídas); disponibilidade medida sem as instáveis e as
  inconclusivas.

**Limiares novos.** Os de disponibilidade (75%) e estabilidade (90% e 85%)
são os mesmos já usados na seção 3. O de utilidade (2 características por
capítulo) é novo, registrado agora, antes da coleta.

**Esclarecimento de 24/11/2026 (antes da coleta): o que conta para a
utilidade.**

- **Observação independente:** só as 9 características **observadas** do
  contrato (`FEATURE_IDS`). O **tipo de mão** é derivado de palma + dedos
  e **nunca** conta como observação independente.
- O capítulo 6 tem 2 observações independentes (palma e dedos). Para ser
  aprovado, precisa das duas estáveis. Com isso, o tipo de mão aparece como
  um terceiro item exibido.
- O critério não mudou: a contagem já usava só as características
  observadas. Agora o relatório mostra separadamente:
  - **observações independentes liberadas** (critério de utilidade, ≥ 2);
  - **itens exibidos** (mediana entre as fotos, incluindo derivados;
    informativo);
  - **estabilidade dos itens** (mesmos itens em ≥ 90% das análises, em
    ≥ 85% das fotos);
  - **disponibilidade** (capítulo com itens em ≥ 75% das fotos em que
    estava).
- **Limite conhecido:** no capítulo 7, as três características da linha
  da cabeça (e as duas do coração) são classificações separadas da mesma
  linha. Contam como observações distintas, mas não são estatisticamente
  independentes entre si. O mínimo de 2 é um piso de utilidade, não uma
  medida de força da evidência.
- Continuam valendo: inconclusivas excluídas, e leitura completa não
  aprovada quando só um capítulo é aprovado.

**Testes da decisão:** leitura sem exclusões; destino sem dado (leitura
"com exclusões"); capítulo 6 sem dado (só o 7 aprovado, leitura não
aprovada); capítulo com 1 observação (não aprovado, "inconclusivo");
restrição com inconclusivas. Também: o tipo de mão nunca é observação
independente; capítulo 6 com 3 itens exibidos e 2 observações; palma
estável sem dedos (disponível, mas não aprovado); disponibilidade,
estabilidade e utilidade como critérios separados.

### 8.6 Pendências do consentimento

**Minuta redigida:** `experimento-repetibilidade-termo-minuta.md` (REP-1),
com os pontos de revisão jurídica e as fontes oficiais verificadas.

1. **Termo novo**, a partir da minuta da 03F.1, com:
   - finalidade (repetibilidade);
   - até 12 envios por foto à Anthropic (EUA);
   - **guarda da foto entre duas sessões em dias diferentes**, dentro do
     prazo de 7 dias contados do recebimento;
   - revisão humana, se houver a referência de exatidão;
   - retirada a qualquer momento e canal de contato;
   - 18 anos ou mais; só a palma.
2. **Revisão jurídica do termo:** a minuta da 03F.1 já a exigia.
3. **Controlador dos dados:** a empresa ainda não foi constituída
   (pendência 7 da 03G). Definir quem assina como responsável.
4. **Retenção pelo provedor:** política comercial (até 30 dias por padrão,
   com exceções). Falta confirmar a configuração da conta e o DPA na data
   da coleta (minuta, J4).
5. **Termos anteriores:** confirmar se cobriram os envios da rodada 2 e da
   Etapa B. Eles ficam fora do Sidera; isso não muda o termo novo, mas fecha
   o histórico.
6. **Fotos novas (Ampliação B):** termo próprio, com as mesmas cláusulas e
   a orientação de captura atual.

## 9. Ferramenta de avaliação (preparada em 24/11/2026)

Código em `src/features/palm-reading/evaluation/repetibilidade/`, isolado do
produto: o produto não importa nada dela, e ela não muda nada nele.

| Arquivo                 | Função                                                                                                                                                                                                                                                                                                    |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config.ts`             | Parâmetros pré-registrados: modelo, 1 tentativa, metas, 12 envios por foto, limites e tetos por etapa, critérios do piloto, vereditos, decisões, consenso, intervalos                                                                                                                                     |
| `contract.ts`           | Foto (código opaco, mão, origem, pseudônimo, autorização) e registro por análise: sem imagem, nome de arquivo ou nome de pessoa                                                                                                                                                                           |
| `run.ts`                | Execução em rodadas, agrupadas por mão. Usa o orquestrador do produto com 1 tentativa e o teto de gasto do produto; meta cumulativa; para por teto, chamadas ou envios. Confere o SHA-256 da entrada antes de cada análise e zera os bytes ao fim. **O provedor é sempre injetado**                       |
| `metrics.ts`            | Leitura por característica; tipos de divergência (inversão oposta ou gradual, oscilação, só motivo); concordância de leitura e estrita; itens dos capítulos 6 e 7 pelo motor atual; pedido de nova foto e estado; custo, tokens e duração; sessões; Wilson e bootstrap por foto; consenso 3 de 3 e 2 de 3 |
| `decision.ts`           | Vereditos por característica e grupo; veredito final; decisões da seção 6 com a justificativa; critérios operacionais do piloto                                                                                                                                                                           |
| `report.ts`             | Relatório em Markdown: decisão, consolidado por grupo, por característica, por fotografia e por célula. Só números e códigos: sem evidência textual                                                                                                                                                       |
| `audit.ts`              | Detecção de conteúdo de imagem (base64 de JPEG, PNG ou WebP, data URL, blocos longos); gravação só em `avaliacao-ia/`; conferência do SHA-256 com o registro de 19/11; exclusão registrada (tamanho, SHA-256, data); busca de cópias                                                                      |
| `simulated-provider.ts` | Provedor simulado: roteiro por "foto" (bytes sintéticos) e consumo parecido com o da 03F.1                                                                                                                                                                                                                |

### 9.1 Testes (só dados simulados)

`repetibilidade.test.ts`: **22 testes**, sem rede, sem fotos e sem custo.

| #   | Caso pedido                    | Verificação                                                                                                                       |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Classificações idênticas       | Concordância 100%; nenhuma divergência; capítulos 6 e 7 iguais                                                                    |
| 2   | Divergência gradual            | Comprimento da cabeça média ↔ longa = gradual, não oposta                                                                         |
| 3   | Inversão de significado        | Palma quadrada ↔ retangular = oposta; o capítulo 6 muda em 40% das análises, o 7 não                                              |
| 4   | Clara que vira indeterminada   | Oscilação, sem inversão; 40% indeterminada                                                                                        |
| 5   | Só o motivo muda               | Concordância de leitura 100%, estrita 60%; 6 pares "só motivo"                                                                    |
| 6   | Completa ↔ pedido de nova foto | Estado e pedido de nova foto instáveis (40%)                                                                                      |
| 7   | Saída inválida                 | Registrada, conta como envio, fica fora das métricas                                                                              |
| 8   | Consenso de três               | Divergência vira indeterminada (3 de 3) ou fica com a maioria (2 de 3); sorteios determinísticos; item perdido ≠ capítulo perdido |
| 9   | Amostra insuficiente           | Inconclusiva (2 fotos; ou célula com 4 classificadas); decisão "inconclusivo"                                                     |
| 10  | Interrupção por orçamento      | Para antes de reservar além do teto: 1 chamada, `stoppedBy: "budget"`                                                             |

Também testados:

- meta cumulativa (piloto 5 + Ampliação A até 10, com índice contínuo e
  sessões separadas);
- limite de chamadas e teto de 12 envios;
- ordem em rodadas e registro de tokens, custo e duração;
- separação de originais e novas, com contagem de fotos e de pessoas;
- decisões "manter", "restringir" e "consenso";
- critérios do piloto;
- ausência de imagem nos registros e de evidência no relatório;
- bytes zerados;
- recusa de gravação fora de `avaliacao-ia/`;
- exclusão registrada e busca de cópias (com arquivo sintético);
- o teto do piloto cobre o pior caso das 10 chamadas;
- o teto total é US$ 5,20.

### 9.2 O que a ferramenta não faz (de propósito)

- Não decide a ampliação pelos números de estabilidade do piloto.
- Não usa conexão real: o provedor real só pode ser criado com o portão
  aberto, e o portão está travado no código (seção 9.4).

### 9.3 Requisitos para iniciar o piloto

Checklist completo na seção 10.

### 9.4 Ponto de entrada da etapa (preparado em 24/11/2026)

| Arquivo                      | Função                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `manifest.ts`                | Manifesto das fotos autorizadas, na pasta das fotos (fora do repositório). Valida o experimento e a versão do termo (`REP-1`); fotos por etapa (piloto: até 2); código, arquivo, mão, origem, pseudônimo, autorização; SHA-256 registrado nas originais; consentimento assinado, com data e abrangência; envios autorizados (1 a 12). **Recusa campos não previstos** (nenhum nome ou contato entra) |
| `session.ts`                 | `executeStage` e `recordDeletion`, detalhados abaixo                                                                                                                                                                                                                                                                                                                                                 |
| `repetibilidade.run.test.ts` | Comandos `simular` (provedor simulado, gravando em `avaliacao-ia/repetibilidade-ensaio/`, nunca junto dos registros reais), `executar` (só com o portão aberto) e `excluir`                                                                                                                                                                                                                          |

**`executeStage`.** Falha fechado: qualquer problema recusa a etapa inteira
antes de qualquer análise.

1. Confere a pasta das fotos fora do repositório e os registros em
   `avaliacao-ia/`.
2. Valida o manifesto.
3. Confere o SHA-256 de cada original com o registro de 19/11.
4. Prepara a foto como o produto e zera os bytes originais.
5. Confere se a entrada preparada é a mesma das sessões anteriores.
6. Recusa fotos sem envios restantes.
7. Usa o teto da etapa: um valor informado só pode reduzi-lo.
8. Aplica a meta cumulativa, o limite de chamadas e os envios autorizados
   de cada foto. Uma foto que esgota os envios para sozinha; as outras
   seguem.
9. Grava os registros sem imagem, sem sobrescrever uma sessão.
10. Gera o relatório e, no piloto, os critérios operacionais (a exclusão
    fica pendente).

**`recordDeletion`.**

- Apaga as fotos e o manifesto.
- Procura cópias pelo SHA-256.
- Grava o registro (arquivo, tamanho, SHA-256, data) com a nota de que a
  exclusão não alcança o provedor.

**Conexão real.**

- `REP_REAL_CONNECTION_ENABLED = false` em `session.ts`.
- Além da trava, o portão exige:
  - `SIDERA_REP_REAL=1`;
  - `SIDERA_REP_CONFIRM=autorizo-repetibilidade-<etapa>`;
  - pasta das fotos fora do repositório;
  - credencial no servidor;
  - ambiente fora de produção.
- Nunca lê nem devolve o valor da chave.

**Testes do ponto de entrada (`session.test.ts`, 15), só com imagens
sintéticas de cor sólida geradas no teste:**

- piloto de ponta a ponta (10 análises, registros sem imagem, relatório,
  critérios, exclusão registrada);
- Ampliação A cumulativa (+5 por foto);
- não sobrescreve sessão nem aumenta teto;
- recusas: sem termo assinado; SHA-256 diferente; campo não previsto
  (nome); envios acima de 12; data futura; foto nova no piloto;
  consentimento que não abrange a origem; arquivo ausente; pasta dentro do
  repositório; versão de termo errada; fotos demais; envios esgotados.
  Em todas, nenhuma análise é feita;
- conexão real travada mesmo com todas as variáveis.

**Ensaio feito:** o comando `simular` rodou uma vez com duas imagens
sintéticas e funcionou. Os arquivos do ensaio foram apagados em seguida.

## 10. Checklist mínimo para iniciar o piloto

| #   | Item                                                                                                                                                                                                     | Situação                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | Plano, critérios, opção 2 e esclarecimento das observações independentes                                                                                                                                 | Feito, antes da coleta                                               |
| 2   | Ferramenta offline e ponto de entrada testados com simulador                                                                                                                                             | Feito (46 testes)                                                    |
| 3   | Minuta REP-1 revisada                                                                                                                                                                                    | Feita; **revisão jurídica profissional pendente** (J1–J10 da minuta) |
| 4   | Responsável pelo tratamento e canal de contato (J1)                                                                                                                                                      | **Pendente**; não inventar dados                                     |
| 5   | Classificação como dado sensível e fundamento da transferência internacional (J2, J3)                                                                                                                    | **Pendente** (revisão profissional)                                  |
| 6   | Configuração da conta da API e DPA conferidos; política de retenção reconferida na data (J4)                                                                                                             | **Pendente**                                                         |
| 7   | Prazos dos registros em texto e dos registros mínimos de auditoria (J5, J6)                                                                                                                              | **Pendente**                                                         |
| 8   | Termos REP-1 assinados pelas pessoas das 2 fotos do piloto                                                                                                                                               | **Pendente**: depende de 3 a 7                                       |
| 9   | Reenvio dos arquivos originais pela própria pessoa, conferidos pelo SHA-256                                                                                                                              | **Pendente**: depois de 8                                            |
| 10  | Destrave da conexão real em commit revisado                                                                                                                                                              | **Pendente**: só com a sua autorização da execução                   |
| 11  | No dia: credencial configurada pelo responsável; preços e versões (03d.2 / 03c.2 / Sonnet 5.5 / `medium` / 4000) conferidos; pasta temporária fora do repositório; exclusão em até 7 dias do recebimento | No dia                                                               |
| 12  | Sua autorização específica do piloto: teto US$ 0,70, 10 chamadas, 2 fotos                                                                                                                                | **Pendente**                                                         |
