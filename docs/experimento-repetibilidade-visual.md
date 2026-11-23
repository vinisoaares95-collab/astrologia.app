# Experimento de repetibilidade visual — plano

Status: **proposta, aguardando aprovação.** Nenhuma chamada paga, nenhuma
foto pedida, nenhuma mudança de código.

## Pergunta

Com a **mesma foto** e a **mesma configuração do produto**, com que
frequência o Sonnet 5.5 dá a mesma classificação a cada característica?
Isso afeta a leitura que chega à pessoa?

A prioridade são as três características que inverteram na foto-05:

- formato da palma;
- comprimento da linha da cabeça;
- arco da linha da vida.

As outras seis são medidas também, sem custo extra.

Este experimento **não** mede a variação entre fotos diferentes da mesma
mão. Isso fica para um segundo experimento, se este passar.

## Desenho

| Elemento              | Definição                                                                                                                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Amostra               | As **8 fotos da 03F.1** (4 pessoas, as duas mãos), reenviadas pelos participantes com nova autorização                                                                                                                             |
| Identidade da entrada | Cada arquivo reenviado é conferido pela impressão digital SHA-256 registrada na exclusão (`avaliacao-ia/03f2-etapa-b/consistencia-visual.md`): mesmo arquivo = mesmo histórico (rodada 2 e Etapa B entram como observações extras) |
| Preparação            | A do produto (`prepareEvalPhoto`), uma vez por foto; o **mesmo JPEG** vai em todas as repetições                                                                                                                                   |
| Configuração          | A do produto, sem alteração: Sonnet 5.5, `effort: medium`, `max_tokens` 4000, prompt 03d.2, contrato 03c.2, validador                                                                                                              |
| Repetições            | **10 por foto** (80 chamadas), independentes, **sem nova tentativa** (1 tentativa por chamada), para medir a resposta crua; uma saída inválida é registrada como tal                                                               |
| Mínimo aceitável      | 5 por foto (40 chamadas), se o orçamento ou o tempo exigirem                                                                                                                                                                       |
| Ordem                 | Agrupada por mão, para o cache do prompt não variar o custo; a ordem não afeta a resposta                                                                                                                                          |
| Registro              | Observação completa de cada repetição (estado, valor, motivo, evidência textual), em `restrito/`, fora do Git; nenhuma imagem gravada                                                                                              |

**Por que 10 repetições.** A tabela mostra a chance de ver pelo menos uma
inversão numa foto, conforme a taxa real de inversão da característica.

| Taxa real de inversão | 5 repetições | 10 repetições |
| --------------------- | ------------ | ------------- |
| 10%                   | 41%          | 65%           |
| 20%                   | 67%          | 89%           |
| 30%                   | 83%          | 97%           |

Somando as 8 fotos, cada característica tem 80 observações. A margem de
erro (95%) da concordância fica perto de ±7–9 pontos.

## Métricas

1. **Concordância modal** por característica e foto: fração das
   repetições iguais à resposta mais frequente. É calculada em dois
   níveis:
   - **estrito**: estado + valor + motivo;
   - **de leitura**: o que chega à pessoa, que é o valor interpretado ou
     "não interpretado".
2. **Taxa de inversão:** entre pares de repetições em que a característica
   foi classificada nas duas, a fração com valores diferentes (ex.:
   retangular × quadrada). Mede contradição de sentido.
3. **Estabilidade do capítulo:** fração das repetições em que o capítulo
   (6 ou 7) teria exatamente os mesmos itens que a resposta mais frequente,
   e em que a disponibilidade é a mesma.
4. **Calibração:** concordância separada por visibilidade declarada
   (claro × parcial). Responde se "claro" significa estável; na foto-05,
   não significou.
5. **Simulação de consenso, offline e gratuita** (só para informar a
   decisão; nada é implementado):
   - sortear 2 ou 3 repetições e manter a característica quando concordam
     ("indeterminada" quando divergem);
   - medir a inversão entre duas leituras de consenso independentes e a
     perda de capítulos.

## Custo (tabela de preços do produto e uso medido)

|                                                                  | Por chamada                                                    | 80 chamadas                 |
| ---------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------- |
| Esperado                                                         | US$ 0,006–0,011 (média 0,0082) + leitura do cache (US$ 0,0007) | ≈ US$ 0,72                  |
| Gravações do cache (por mão e janela de 5 min)                   | US$ 0,016 cada                                                 | ≈ US$ 0,03–0,10             |
| **Total esperado**                                               |                                                                | **≈ US$ 0,8 (≈ R$ 4,50)**   |
| Pior caso por chamada (4000 tokens de saída + gravação do cache) | US$ 0,061                                                      | reservado chamada a chamada |

Proposta de **teto absoluto: R$ 10,00**, com orçamento exclusivo. O pior
caso de cada chamada é reservado antes de ela começar. Sem saldo, o
experimento para e registra o que faltou. Execução única.

## Critérios de decisão (definidos antes de ver os dados)

Uma característica é **estável** quando:

- a concordância de leitura é ≥ 90% em pelo menos 7 das 8 fotos; e
- a taxa de inversão é ≤ 5%.

| Resultado                                                                                                                                                                    | Decisão                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **D1.** As três prioritárias e as demais estáveis                                                                                                                            | A instabilidade da 03F.2 foi pontual: retirar o bloqueio comercial, com aviso de que traços limítrofes podem variar entre fotos        |
| **D2.** Alguma característica instável, mas a simulação com 3 observações leva a inversão entre leituras independentes a ≤ 2%, com perda de no máximo 1 capítulo nas 8 fotos | Implementar consenso (3 observações em paralelo; divergência vira indeterminado) e revalidar                                           |
| **D3.** Alguma característica com concordância < 70% mesmo no consenso, ou consenso que derruba capítulos em mais de 2 das 8 fotos                                           | Revisar o prompt e o contrato dessa característica (regra de limítrofe, ou tratá-la como sempre indeterminada) e repetir o experimento |

**Lançamento comercial:** só depois de D1, ou de D2/D3 implementados e
revalidados.

## Impacto na disponibilidade dos capítulos

O experimento mede:

- a disponibilidade atual por repetição: em quantas das 10 o capítulo 6 ou
  7 existe;
- a disponibilidade sob consenso simulado: características divergentes
  saem.

**Exemplo:** se o formato da palma ficar indeterminado, o capítulo 6
continua com os dedos e perde a combinação palma + dedos (tipo de mão).

**Risco a medir:** o consenso pode aumentar o número de capítulos
indisponíveis. A 03F.2 já tinha 7 de 16 capítulos reais indisponíveis, por
captura.

## Pré-requisitos (nada disso foi pedido ainda)

1. **Nova autorização** dos 4 participantes, cobrindo o reenvio das
   fotos e **10 envios de cada foto** à Anthropic.
2. **Reenvio dos mesmos arquivos originais**, conferidos pela impressão
   digital; um arquivo diferente entra como foto nova, sem histórico.
3. **Pequena extensão da ferramenta da 03F.1:**
   - repetições;
   - uma tentativa por chamada;
   - métricas;
   - simulação de consenso;
   - testes com simulador.

   O produto não muda.

4. **Exclusão das fotos** ao fim, com registro.
