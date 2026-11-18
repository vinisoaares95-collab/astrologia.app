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

## Etapa A — preparação concluída (18/11/2026, sem chamadas pagas)

**Ferramenta** (`src/features/palm-reading/evaluation/chapters/`): usa o
motor existente sem mudanças (motor 03C → `generatePalmChapters` 03E →
apresentação ao cliente), com o modelo de texto do produto (Haiku 5.5, fixo
na avaliação), orçamento exclusivo (verificação prévia por caso, reserva por
chamada e interrupção) e relatórios em `avaliacao-ia/03f2-etapa-a/`.

**Entrada** (`entrada/observacoes.json`, montada pelo plano): as 8
observações do Sonnet 5.5 da rodada 2, copiadas dos resultados originais
(só leitura) e revalidadas pelo contrato 03c.2, com resultado idêntico, e
2 cenários **sintéticos**. Nenhuma foto é lida nem reenviada; o manifesto
só fornece a mão de cada foto.

| Caso    | Pessoa | Capítulo 6           | Capítulo 7                         |
| ------- | ------ | -------------------- | ---------------------------------- |
| foto-01 | M01    | indisponível         | arco da vida                       |
| foto-02 | M01    | indisponível         | arco da vida                       |
| foto-03 | M02    | indisponível         | coração, cabeça (inclinação), vida |
| foto-04 | M02    | indisponível         | indisponível                       |
| foto-05 | M03    | palma, dedos         | 6 características                  |
| foto-06 | M03    | palma, dedos         | coração, vida                      |
| foto-07 | M04    | palma, dedos         | indisponível                       |
| foto-08 | M04    | indisponível         | cabeça (3), vida                   |
| sint-01 | —      | só a palma (parcial) | indisponível                       |
| sint-02 | —      | indisponível         | só o arco da vida (parcial)        |

Com as observações reais, a pouca informação é frequente: o capítulo 6 fica
indisponível em 5 de 8 fotos (proporções indeterminadas) e o capítulo 7 em 2. foto-01 e foto-02 têm exatamente a mesma entrada: a personalização entre
elas não pode diferir muito por construção (o modelo de texto recebe só as
categorias observadas e as interpretações da biblioteca, nunca a foto nem a
evidência); o revisor avalia esses casos pela fidelidade à observação.

**Verificação automática** (relatório técnico): origem IA × biblioteca e
motivo; tentativas e códigos de reprovação; revalidação do texto final pelo
validador da quiromancia (inclui valores atribuídos a características
indeterminadas); linguagem proibida; frases repetidas em 3+ relatórios;
similaridade entre capítulos de entradas diferentes (alerta ≥ 0,5);
tokens, latência e custo; custo por relatório com a visão da 03F.1.

**Revisão editorial** (`revisao/capitulos.md`, sem origem do texto;
`revisao/ficha-capitulos.csv`; `revisao/guia.md`): seções sem apoio,
invenção, indeterminadas, clareza, naturalidade, personalização,
repetição, segurança e experiência com pouca informação. A apuração
(`SIDERA_PALM_CHAPTERS_EVAL_MODE=score`) aplica os critérios de aprovação
desta fase.

**Plano real (grátis):** 11 capítulos com conteúdo (até 22 chamadas com
novas tentativas); esperado ≈ US$ 0,006 (R$ 0,03); pior caso US$ 0,0509
(R$ 0,28); teto da Etapa A R$ 1,00, parte dos R$ 5,00 da 03F.2.

**Execução paga (só com autorização):**

```bash
SIDERA_PALM_CHAPTERS_EVAL_MODE=run \
SIDERA_PALM_CHAPTERS_EVAL_PAID=1 \
SIDERA_PALM_CHAPTERS_EVAL_CONFIRM=autorizo-capitulos-03f2-etapa-a \
npx vitest run src/features/palm-reading/evaluation/chapters/chapters-eval.run.test.ts
```
