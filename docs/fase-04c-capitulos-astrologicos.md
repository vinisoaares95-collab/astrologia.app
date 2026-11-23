# Fase 04C — Integração dos capítulos astrológicos (1 a 5)

Estado: **implementada, só interna** (motor sob AGPL; ver
`docs/fase-04a-licenca-motor.md`). Sem deploy, sem chamadas pagas, sem IA.

## 1. O que foi feito

- **Ação de servidor** `src/features/report/journey/sky-actions.ts`
  (`generateSkyChaptersAction`). Reaproveita o pipeline existente:
  `normalizeOnServer` → `buildChartView` (Swiss Ephemeris) →
  `buildInterpretation` → `libraryReport` (biblioteca como fonte padrão) →
  `toClientReport`. Respostas: `ok`, `engine-disabled`, `invalid`,
  `needs-choice`, `engine-error`. Erros do motor viram mensagens amigáveis.
  Um erro inesperado registra só o nome do tipo (inventário de logs
  atualizado).
- **Memória da jornada** (`journey-context.tsx`): novo estado `sky`
  (`loading` | `ready` | `unavailable`) e `beginSky()`. A transferência é
  explícita e filtrada por `toJourneySky`, que copia só o aviso e os capítulos
  (título, introdução, seções, síntese, perguntas, limitações). Data, hora,
  local, identificadores internos e origem não passam. Cada cálculo recebe uma
  "tarefa" ligada à sessão da jornada. Uma resposta que chega depois de sair da
  jornada, ou de uma nova confirmação, é descartada (`settle` → `false`).
- **Formulário de nascimento**: o cálculo só começa depois da conferência
  válida, no botão de confirmação.
  - O botão fica desativado durante o cálculo ("Calculando o mapa…"), o que
    impede cliques duplos.
  - Confirmar de novo os mesmos dados não gera outro cálculo.
  - Dados alterados geram um novo cálculo e ignoram a resposta antiga.
  - O formulário segue sempre para `/relatorio`.
- **Leitura** (`journey-reading.tsx`):
  - os capítulos 1–5 vêm da jornada: carregando (`aria-busy`), prontos ou
    indisponíveis com o motivo;
  - os capítulos 6–7 continuam exatamente como na 04B;
  - os capítulos 8–9 aparecem como "Em definição";
  - o indicador mostra "7 de 9" com tudo pronto;
  - o aviso foi revisto: "Não é o relatório completo".
- **Textos de privacidade**:
  - o aviso do formulário passou a dizer que, ao confirmar, o mapa é
    calculado e só os capítulos do céu (sem data, hora e local) seguem para o
    relatório, em memória da aba;
  - nada é enviado a provedores de IA;
  - a linha D9 do inventário (`docs/privacidade/01`) foi atualizada.

## 2. Como funcionam os capítulos 1 a 7

| Capítulos | Origem                                                   | Quando                                         | Sem dados                                  |
| --------- | -------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------ |
| 1–5       | Motor astronômico + biblioteca interpretativa (sem IA)   | Uma vez, ao confirmar os dados de nascimento   | Indisponível, com o motivo                 |
| 6–7       | Texto da prévia da leitura das mãos (04B), sem alteração | Ao continuar a partir da prévia                | Indisponível, com o motivo                 |
| 8–9       | —                                                        | Não implementados (pendentes de especificação) | "Em definição", só na leitura interna/demo |

Precisão, confiança e limitações do motor são preservadas:

- com horário aproximado, as limitações da margem aparecem;
- com horário desconhecido, a leitura fica sem Ascendente e sem casas, com
  "Limites desta leitura";
- num horário duplicado (fim do horário de verão), a pessoa escolhe a
  ocorrência e o sistema não decide sozinho;
- um horário inexistente não permite confirmar.

Uma falha no cálculo deixa a Parte I indisponível e **não apaga** a leitura
das mãos. Sair da jornada (X), recarregar ou fechar descarta tudo. A limpeza
da foto (D5) continua igual.

## 3. Testes

- `npm run check` (typegen, tsc, eslint e testes): **1231 aprovados, 42
  ignorados** (os pagos e os de avaliação ficam desligados).
- `npm run build`: aprovado.
- Unitários novos ou atualizados:
  - `sky-actions.test.ts`: 7 casos com o motor real:
    - desligado;
    - horário exato, com os 5 capítulos e nenhum dado de nascimento no
      resultado;
    - horário aproximado e desconhecido;
    - cidade ou data inválida;
    - horário duplicado;
    - erro do motor;
    - erro inesperado;
    - nenhum `fetch`.
  - `birth-data-form.test.tsx`:
    - uma única geração;
    - botão desativado;
    - mesma chave sem novo cálculo;
    - motor desligado;
    - erro do motor;
    - resposta tardia ignorada;
    - novo aviso.
  - `journey.test.tsx`: lista do que é copiado; falha ou sucesso do céu não
    apagam as mãos; sair durante o cálculo.
  - `journey-reading.test.tsx`: céu da biblioteca, carregando, indisponível
    com as mãos preservadas.
  - `app-logs.test.ts`: inventário de `console.*`.
- Navegador (`scripts/e2e/04c-relatorio.mjs`, no Chromium do ambiente,
  desktop 1440×900 e iPhone 13, servidor `next dev`):
  - **`com-motor`: 34/34**:
    - jornada completa;
    - 1 chamada por confirmação;
    - 5 capítulos e "7 de 9";
    - 6–7 idênticos à prévia;
    - sem data, hora ou cidade na leitura;
    - Voltar e reconfirmar sem novo cálculo;
    - X apaga tudo;
    - horário aproximado e desconhecido;
    - erro de cidade;
    - horário inexistente;
    - resposta tardia descartada após sair;
    - nenhum armazenamento;
    - nenhum host externo.
  - **`sem-motor`: 18/18**: Parte I indisponível com o motivo, mãos
    preservadas, "2 de 9", nenhuma chamada.
  - Regressão: `scripts/e2e/04b-jornada.mjs` aprovado. A expectativa da Parte
    I sem motor foi atualizada para o novo estado "indisponível, com o
    motivo".

Os 10 cenários pedidos correspondem a:

1. exato;
2. aproximado e desconhecido;
3. cidade válida e erros;
4. cinco capítulos;
5. 6–7 preservados;
6. erro astro sem perder as mãos (unitário e `sem-motor`);
7. sair descarta;
8. Voltar e resposta tardia;
9. armazenamento e envio externo;
10. desktop e mobile.

## 4. Capturas

As capturas estão em `docs/capturas/fase-04c/`, em desktop e mobile:

- `ceu`;
- `com-motor-leitura`;
- `desconhecido`;
- `horario-inexistente`;
- `sem-motor-leitura`.

Foram feitas no servidor de desenvolvimento, por isso aparece o selo "N" do
Next.js. A imagem da mão é sintética.

## 5. Limitações

- **Só interno.** O motor é AGPL. A jornada é testada em `next dev`, porque em
  produção a leitura das mãos devolve 503 enquanto o registro de
  consentimento não estiver pronto para produção.
- A página `/dados-de-nascimento` é estática: o aviso "calcular o mapa" é
  decidido no build pelo `SIDERA_INTERNAL_ENGINE`, e a ação verifica de novo em
  tempo de execução.
- Enquanto a pessoa está na jornada, o formulário mantém os dados digitados na
  memória da aba (as rotas ficam ocultas, não desmontadas), como os textos
  informam.
- Os capítulos 1–5 usam só o texto da biblioteca; não há geração com IA nesta
  fase.
- É possível ter o céu sem as mãos ("5 de 9"), e o contrário.
- A reprodutibilidade visual das mãos (03F.2) continua em aberto.
- Não há vocabulário comum entre os dois lados: os itens da mão não têm
  etiquetas de tema, e os astrológicos têm `ToneTag`.

## 6. Recomendações para a especificação editorial dos capítulos 8 e 9

1. **Fontes fechadas**: usar só itens já selecionados pelos dois motores
   (fatos do mapa e observações da mão), com rastreabilidade por item.
2. **Vocabulário comum de temas**: mapear `ToneTag` para os traços da mão,
   com aprovação editorial antes do código.
3. **Regras de convergência e divergência**: o que conta como "os dois
   apontam para o mesmo tema", o que conta como tensão, e o limite de itens
   por capítulo.
4. **Proibição de correlação inventada**: nenhuma afirmação causal entre céu
   e mão. Isso exige um validador automático, no molde dos validadores atuais,
   e textos de limitação obrigatórios.
5. **Um lado ausente**: definir se o capítulo 8 fica indisponível ou recebe
   uma versão reduzida, com texto próprio.
6. **Capítulo 9**: montar a partir das perguntas de reflexão já existentes
   nos capítulos 1–7, com critérios de seleção e de não repetição.
7. **Plano de avaliação**: casos sintéticos, revisão humana e critérios de
   aceite antes de decidir sobre o uso de IA (e o custo dele).
8. **Aprovação editorial do documento antes de qualquer implementação (04D).**
