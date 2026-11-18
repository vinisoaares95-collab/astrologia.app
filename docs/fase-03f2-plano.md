# Fase 03F.2 — Capítulos 6 e 7 com IA real: plano

Status: **proposta, aguardando aprovação.** Nenhuma chamada paga foi feita
para esta fase.

## Objetivo

Validar, com IA real e as observações reais da 03F.1, se os capítulos 6
("As características das suas mãos") e 7 ("As linhas da sua palma"):

1. são personalizados pelo que foi de fato observado;
2. são fiéis à observação (nada além dela, nada contrário a ela);
3. tratam bem o que ficou indeterminado ou não visível;
4. têm qualidade editorial e coerência;
5. não inventam características;
6. funcionam quando há poucas linhas classificáveis (capítulo 7 parcial ou
   indisponível);
7. cabem no custo comercial por relatório.

## Configuração avaliada

- Visão: **Sonnet 5.5** (decisão da 03F.1), contrato 03c.2, prompt 03d.2.
- Texto dos capítulos: modelo de texto do Sidera (**Haiku 5.5**, decisão
  da 02F.1), prompt 03e.1, validador da quiromancia, biblioteca como
  reserva. Sem fallback pago entre modelos.
- Teto por relatório: US$ 0,15; orçamento exclusivo da avaliação.

## Etapas

### A — Texto a partir das observações já auditadas (sem novas fotos)

- Entrada: as 8 observações **validadas do Sonnet na rodada 2**
  (`avaliacao-ia/03f-rodada2/restrito/resultados.json`), que já têm
  evidências conferidas. Nenhuma imagem é reenviada.
- Saída: os capítulos 6 e 7 das 8 observações (até 16 chamadas; os
  capítulos sem itens não chamam a IA). Fotos 04 e 07 servem como casos de
  "capítulo 7 indisponível".
- Mais 2 observações **fictícias** derivadas, com poucas linhas (só a
  mão; uma única linha parcial), para a experiência de pouca informação.
- Auditoria: ficha de leitura com observação, itens e texto final de cada
  capítulo; o revisor marca fidelidade, personalização, tratamento das
  limitações e qualidade editorial. Trilha de auditoria (origem IA ou
  biblioteca, motivos, tentativas, custo) fica separada.

### B — Ponta a ponta (3 fotos)

- 3 das fotos existentes (uma com boa cobertura de linhas, uma com poucas,
  uma sem linhas), pelo **mesmo fluxo do endpoint** (visão + capítulos),
  com os tetos do produto, para medir o custo real por relatório, a
  latência total e a experiência na tela.
- Só se as autorizações dos participantes cobrirem este novo envio.

### Ferramenta

Pequena extensão da avaliação 03F.1 (sem infraestrutura nova): reaproveita
`generatePalmChapters`, a apresentação ao cliente e o orçamento exclusivo;
grava relatórios em `avaliacao-ia/` (fora do Git); bloqueada por padrão;
testes só com simuladores.

## Critérios de aprovação

| Critério                                                                               | Aprovação                                |
| -------------------------------------------------------------------------------------- | ---------------------------------------- |
| Afirmações sobre característica não observada, indeterminada ou contrária à observação | **0** (bloqueante)                       |
| Previsões, saúde, longevidade, destino traçado, atributos pessoais                     | **0** (bloqueante)                       |
| Cada seção apoiada pelas observações citadas (revisor)                                 | ≥ 90% das seções                         |
| Indeterminadas e não visíveis aparecem só como limitação, sem interpretação            | 100%                                     |
| Capítulo indisponível com mensagem e orientação corretas                               | 100% dos casos                           |
| Personalização: capítulos de mãos diferentes distinguíveis e ligados às observações    | ≥ 7 de 8 (revisor)                       |
| Qualidade editorial (clareza, fluidez, sem repetição; escala 1–5)                      | média ≥ 4                                |
| Capítulos que precisaram da biblioteca                                                 | ≤ 25% (registrar motivos)                |
| Custo real por relatório (visão + capítulos)                                           | ≤ US$ 0,03; pior caso ≤ teto de US$ 0,15 |

Não aprovar só porque o validador aceitou: fidelidade e qualidade vêm da
leitura do revisor. A amostra continua pequena e exploratória.

## Orçamento previsto

Calculado com as funções do orçamento (pior caso = valor reservado) e os
custos reais da 03F.1.

| Etapa                                        | Esperado                   | Pior caso                  |
| -------------------------------------------- | -------------------------- | -------------------------- |
| A — 16 capítulos (Haiku) + 2 casos fictícios | ≈ US$ 0,02                 | ≈ US$ 0,09                 |
| B — 3 relatórios ponta a ponta               | ≈ US$ 0,05                 | ≈ US$ 0,45                 |
| **Total**                                    | **≈ US$ 0,07 (≈ R$ 0,40)** | **≈ US$ 0,54 (≈ R$ 3,00)** |

Proposta: **teto absoluto de R$ 5,00** para a 03F.2, uma execução de cada
etapa, sem repetição em caso de falha. Uma comparação de texto com o Sonnet
só se o Haiku falhar nos critérios (pior caso ≈ US$ 1,50 para os 16
capítulos: exigiria nova autorização).

## Fotos e retenção

- Etapa A não usa imagens: só as observações já validadas (texto).
- Etapa B usa 3 das fotos em `/tmp/sidera-fotos-03f` (fora do Git), se
  autorizado; depois dela, todas as fotos são apagadas do contêiner.
- Se a 03F.2 não for aprovada em breve, apagar as fotos e, se for preciso,
  pedir novo envio só das 3 da etapa B.

## Pendências fora desta fase

Estado compartilhado (limites e teto diário) antes de uso público, revisão
jurídica do consentimento, retenção do provedor e integração final dos 9
capítulos (Fase 04).
