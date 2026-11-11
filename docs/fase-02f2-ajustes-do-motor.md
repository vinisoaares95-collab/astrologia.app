# Fase 02F.2 — Ajustes finais do motor de interpretação

Correções dos três problemas prioritários encontrados na avaliação cega real
da Fase 02F.1, sem mudar a arquitetura (um capítulo por chamada → validação →
biblioteca como alternativa segura). Nenhuma chamada paga foi feita nesta
fase.

## Decisão de modelo

| Modelo     | Relatórios | Média (de 50) | Custo por relatório | Capítulos da IA |
| ---------- | ---------- | ------------- | ------------------- | --------------- |
| Haiku 5.5  | A, D, E    | **36,0**      | **R$ 0,06**         | 15 / 15         |
| Sonnet 5.5 | B, C, F    | 32,0          | R$ 0,55             | 14 / 15         |

- Padrão do MVP: `claude-haiku-5-5`, esforço `medium` (`config.ts`).
- Sonnet 5.5 continua suportado (`SIDERA_AI_MODEL=claude-sonnet-5-5`), com
  preço, adaptador e testes, para comparações futuras.
- **Sem fallback pago automático:** o fallback do servidor entre modelos ficou
  desligado por padrão; só `SIDERA_AI_REFUSAL_FALLBACK=1` o liga (e mesmo assim
  nunca é enviado ao Haiku 5.5, que não o suporta). A alternativa em caso de
  falha continua sendo a biblioteca, sem custo.
- A amostra é pequena (3 relatórios por modelo); a escolha será validada de
  novo depois destes ajustes.

## 1. Validador e novas tentativas

Diagnóstico (a partir dos códigos registrados na 02F.1; os rascunhos
reprovados não são guardados):

| Erro na 02F.1                                                           | Causa                                                                                                                |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `UNSUPPORTED_POINT` "Lua" (F, emocional, 2×), "Sol", "Vênus", "Saturno" | A seção citava um ponto sustentado por OUTRO item do mesmo capítulo; a instrução de correção não dizia como resolver |
| `FORBIDDEN_LANGUAGE` "garantias"                                        | Termo negado ("sem garantias") tratado como promessa                                                                 |
| `UNSUPPORTED_DEGREE` "90°"                                              | Ângulo usado para explicar a quadratura tratado como posição do mapa                                                 |
| `HEALTH_FINANCE_RELATIONSHIP` "enriquecer"                              | Sentido figurado ("enriquecer a experiência") tratado como finanças                                                  |

Correções (`validate.ts`, `generate.ts`):

- **Referência cruzada (`CROSS_REFERENCE`).** Quando a seção menciona algo que
  outro item do capítulo sustenta, o erro aponta o item mais específico e traz
  uma instrução objetiva, enviada na tentativa seguinte, por exemplo:
  _"Na seção 5, inclua o item referente à Lua (emocional:body-sign:moon) nos
  itemIds utilizados ou remova essa referência."_ A seção continua reprovada
  até a referência ficar explícita.
- **Correção determinística, só na última tentativa:** se TODOS os problemas
  forem referências cruzadas, o itemId sugerido é acrescentado à seção e o
  rascunho passa de novo pela validação completa. A correção fica registrada
  em `metrics.attempts[].repairs`.
- **Rigor mantido:** posições, signos, casas, aspectos e graus continuam
  conferidos contra os itens citados. "Lua em Leão" (a Lua está em Sagitário),
  pontos/casas fora do capítulo e Ascendente/Meio do Céu/casas sem horário
  continuam reprovados; nada disso vira referência cruzada.
- **Negação:** "sem garantias", "não determina", "nada aqui é cientificamente
  comprovado" passam; "não só determina", "isso garante" continuam
  reprovados. "Uma determinada fase" (adjetivo) passa.
- **Sentido figurado:** "enriquecer a experiência", "vínculos
  enriquecedores" passam; "enriquecer", "enriquecer o patrimônio" continuam
  reprovados.
- **Graus:** o ângulo que define um aspecto nomeado na mesma frase
  (quadratura 90°, trígono 120°…) é aceito; ângulo solto ou trocado
  ("quadratura, de 180°") é recusado. O número não casa mais dentro de outro
  ("16°" em "1,16°"). **Novo:** o grau precisa pertencer à observação do
  ponto nomeado na frase ("Mercúrio está a 21°43′", grau do Sol, é recusado).
- Todas as mensagens têm `fix` (instrução de correção) e local legível
  ("Na seção 2", "Na síntese").

## 2. Fallback invisível ao cliente

- `presentation.ts`: `toClientReport` / `renderClientReport` entregam o
  mesmo formato para capítulos da IA e da biblioteca, sem origem, motivo de
  fallback, itemIds, modelo nem custo.
- `auditTrail` mantém internamente a origem de cada capítulo, o motivo do
  fallback e as tentativas com métricas.
- O relatório cego da avaliação usa o mesmo layout do cliente: o título não
  traz mais "texto da biblioteca (geração reprovada)". As verificações
  automáticas continuam no rodapé, separadas, para o avaliador.

## 3. Intervalos e precisão astrológica

- O modelo **não** recebe a janela de incerteza, as ressalvas nem as
  limitações; recebe só a posição calculada (`modelObservation`) e
  `certainty`. O prompt (versão `02f.2`) proíbe falar de horário, precisão,
  janelas, margens, intervalos e do que ficou de fora.
- O validador recusa esse tipo de explicação (`PRECISION_CLAIM`), por exemplo
  "calculado com precisão dentro de uma janela de incerteza pequena".
- `precision.ts` monta as notas a partir dos fatos calculados, ligadas ao
  ponto do próprio fato e anexadas à seção que o cita (`sections[].notes`),
  uma vez por capítulo:
  - aproximado: _"Com o horário de nascimento aproximado, a posição do Sol pode
    estar entre 21°38′ de Touro e 21°48′ de Touro; a leitura usa a posição
    calculada para o horário informado (21°43′ de Touro)."_
  - desconhecido: _"Sem o horário de nascimento, a posição do Sol varia ao
    longo do dia, entre 21°08′ de Touro e 22°06′ de Touro; a leitura usa a
    posição calculada para o meio-dia (21°37′ de Touro)."_
  - exato: nenhuma nota de intervalo.
- A ressalva oficial dos itens incertos (motor 02E) é anexada como nota; a
  segunda do capítulo usa a forma curta, sem repetição literal.
- Horário desconhecido: mencionar Ascendente, Meio do Céu, Descendente, Fundo
  do Céu ou casas continua proibido, agora também em frases que "explicam" a
  ausência — essa explicação é a lista de limitações do motor.
- A biblioteca segue o mesmo padrão (texto simbólico + notas do sistema).

## Testes

- `regression-02f2.test.ts`: referência cruzada do Relatório F (erro,
  instrução, nova tentativa, correção revalidada, recusa quando há outro
  problema), negação e sentido figurado, graus, apresentação ao cliente e
  trilha interna, precisão nos três horários (exato, aproximado,
  desconhecido), restrições de horário desconhecido e configuração do modelo.
- Testes existentes atualizados onde o comportamento mudou de propósito
  (padrão Haiku, fallback pago opcional, explicações de limitação pelo
  sistema, ressalva como nota) e snapshots da biblioteca regenerados.

## Riscos e limitações

- A validação continua **léxica**: não prova correção semântica.
- As listas de negação e de sentido figurado são heurísticas; frases fora dos
  padrões previstos podem ser recusadas (falso positivo) ou, mais raramente,
  aceitas.
- A proibição de falar de precisão pode aumentar reprovações do modelo até
  que ele siga a regra; o efeito real só aparece numa nova avaliação paga.
- A correção automática de referências cruzadas acrescenta itens à seção sem
  reescrever o texto; a rastreabilidade fica correta, mas a seção pode citar
  um item que só menciona de passagem.
- Os rascunhos reprovados continuam sem ser guardados; a análise de falhas
  depende dos códigos e mensagens registrados.
- As limitações do motor (02E) não foram reescritas nesta fase.
