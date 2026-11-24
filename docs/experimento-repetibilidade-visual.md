# Experimento de repetibilidade visual — plano operacional

Status: **plano revisado em 24/11/2026, aguardando autorização explícita.**
Nada foi executado:

- nenhuma chamada paga;
- nenhuma foto pedida;
- nenhuma mudança no produto ou na ferramenta.

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

**Intervalos.** Cada taxa sai com intervalo de Wilson de 95%. Com 10
análises e poucas fotos por característica, os intervalos serão largos.

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

| Etapa                                                                | Fotos                                                                                                                                                                                                  | Análises                                                                       | Chamadas   | Sessões                                |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ---------- | -------------------------------------- |
| **Piloto**                                                           | 2 das antigas, reenviadas e conferidas pelo SHA-256: a **foto-05** (a única completa e o caso que motivou o experimento) e uma parcial com classificações (foto-06 ou foto-08, conforme a autorização) | 5 por foto                                                                     | **10**     | 1                                      |
| **Ampliação A** (histórico)                                          | Todas as antigas reautorizadas: até 8, de 4 pessoas                                                                                                                                                    | 10 por foto. As 2 do piloto ganham +5, se o piloto entrar na conta (seção 3.1) | até **70** | 2, em dias diferentes (5 + 5 por foto) |
| **Ampliação B** (opcional, recomendada, **com autorização própria**) | Fotos **novas**, tiradas com o guia de captura atual: 8, de pelo menos 4 pessoas                                                                                                                       | 10 por foto                                                                    | **80**     | 2, em dias diferentes                  |

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

## 4. Custo estimado e teto

Base:

- **preços do código:** Sonnet 5.5 a US$ 2 / 10 / 2,50 / 0,10 por milhão
  de tokens (entrada / saída / gravação do cache / leitura do cache),
  conferidos em 11/11/2026. **Reconferir antes da execução**;
- **consumo real** da seção 0;
- **câmbio:** R$ 5,50.

**Reserva do pior caso.** O orçamento separa o pior caso de cada chamada
(`visionWorstCaseUsd` ≈ US$ 0,0645) antes de ela começar e acerta pelo
consumo real. Ao atingir o teto, para e registra o que faltou.

| Etapa       | Chamadas    | Esperado                                                                                          | Teto da etapa                                    |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Piloto      | 10          | 10 × US$ 0,0083 + 2 gravações de cache ≈ **US$ 0,12**                                             | **US$ 0,70 (R$ 3,85)**: cobre o pior caso das 10 |
| Ampliação A | até 70      | ≈ US$ 0,58 + gravações (2 sessões × 2 mãos) ≈ **US$ 0,65**                                        | **US$ 2,00 (R$ 11,00)**                          |
| Ampliação B | 80          | Fotos novas podem ser maiores (até ~4.800 tokens visuais): ≈ US$ 0,015 por análise ≈ **US$ 1,30** | **US$ 2,50 (R$ 13,75)**                          |
| **Total**   | **até 160** | **≈ US$ 2,10 (≈ R$ 11,50)**                                                                       | **US$ 5,20 (R$ 28,60)**                          |

- **Por fotografia:** ≈ US$ 0,08 nas antigas e ≈ US$ 0,15 nas novas (10
  análises).
- **Orçamento:** exclusivo, separado do produto, uma execução por etapa.
- **A simulação de consenso** e a passagem pelo motor das mãos são locais e
  gratuitas.

## 5. Procedimentos de privacidade

1. **Termo novo e específico**, adaptado da minuta da 03F.1.
   - **Finalidade:** medir a repetibilidade.
   - **Envios:** **até 12 por foto** ao provedor nos EUA (10 do
     experimento + margem de refação do piloto).
   - **Retenção pelo provedor:** até 30 dias por padrão, com exceções, como
     informado em 19/11. Confirmar para a conta usada antes de coletar.
   - **Revisão humana**, se houver a referência da seção 1.4.
   - **Exclusão** em até 7 dias depois da última sessão.
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

1. **Este plano**, com os critérios das seções 3 e 6.
2. **Preparação da ferramenta de avaliação, sem custo:**
   - repetições, 1 tentativa, rodadas, sessões, métricas M1–M9 e consenso
     simulado;
   - testes só com o simulador.
   - O produto não muda.
3. **Termo novo**, com revisão jurídica, e **pedido de reenvio** aos 4
   participantes.
4. **Piloto** (teto US$ 0,70) e, depois do relatório dele, **Ampliação A**
   (teto US$ 2,00).
5. **Ampliação B** (fotos novas, teto US$ 2,50), com autorização à parte.

Nada disso começa sem autorização explícita.
