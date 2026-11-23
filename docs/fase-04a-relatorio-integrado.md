# Fase 04A — estrutura do relatório integrado

**Registro de 23/11/2026.**

- **O que foi feito:** só a estrutura de leitura, com dados de exemplo.
- **Inalterado:** os motores (astrológico, visual, das mãos), a correção
  D5, os textos editoriais e as travas de produção da 03G.
- **Sem custo e sem publicação:** nenhuma chamada de IA, nenhuma chamada
  paga, nenhum deploy.
- **Base:** plano da Fase 04 (`docs/fase-04-plano.md`).

## 1. Contrato único (`src/features/report/integrated/`)

| Arquivo                           | Papel                                                                    |
| --------------------------------- | ------------------------------------------------------------------------ |
| `contract.ts`                     | `ReportChapterView`, `ReportPartView` e `IntegratedReportView`           |
| `build.ts`                        | adaptadores puros e `buildIntegratedReport`                              |
| `report-reader.tsx`               | interface de leitura                                                     |
| `samples.ts`                      | cenários de exemplo (só servidor)                                        |
| `demo-gate.ts`, `demo-banner.tsx` | trava e faixa da demonstração interna                                    |
| `../part-basis.ts`                | rótulo da base de cada parte, agora compartilhado com o `ReportExplorer` |

**O que cada capítulo preserva:**

- **Número, título, parte e resumo:** vêm de `reportParts`. O texto do
  motor é **conferido** contra essa estrutura; uma divergência é recusada.
- **Conteúdo e seções:** o texto do motor, **sem alteração**, no formato
  do `ChapterArticle`:
  - astrologia: `ClientChapter` → artigo, com as `notes` de precisão;
  - mãos: `ClientPalmChapter` → artigo, com `observed`, `notes` e
    indisponível.
- **Origem da interpretação:** a base editorial da parte ("Cálculo +
  símbolo", "Observação + símbolo", "Síntese simbólica").
  - **Não** se exibe se o texto veio da IA ou da biblioteca (regras da
    02F.2 e da 03E). O teste confere que `source`, `fallbackReason`,
    `itemIds`, `factIds` e `model` não chegam à apresentação.
- **Ressalvas e limitações:**
  - o aviso de não cientificidade de cada parte, que é o texto do motor;
  - as limitações e notas de cada capítulo;
  - os avisos da parte: leitura simulada, leitura parcial, nova foto
    sugerida.
- **Estado:**
  - `content`;
  - `unavailable`, com o motivo do motor ou da etapa;
  - `loading`;
  - `pending`, só para os capítulos 8 e 9.
  - A parte resume em `ready`, `partial`, `unavailable`, `loading` ou
    `pending`.

**Entradas preparadas para a 04B e a 04C:**

- **Céu:** `SkyInput` (`ready`, `loading` ou `unavailable`).
- **Mãos:** `HandsInput` (`ready`, `loading` ou `absent`).
- **Formatos:** são os mesmos que já chegam ao navegador (`ClientReport` e
  `PalmAnalysisResult`). Nenhum formato novo é exigido dos motores.

## 2. Interface: `/relatorio/leitura`

**A página comercial `/relatorio` não mudou.** A leitura fica numa rota
própria e não importa catálogo, preço nem oferta; um teste estático
garante isso.

**Desktop:**

- sumário lateral fixo, com as 3 partes e os 9 capítulos;
- um indicador de estado por capítulo, com texto equivalente para leitor
  de tela;
- o capítulo em leitura marcado com `aria-current="location"`, inclusive
  no fim da página.

**Mobile:**

- sumário compacto no topo, com o estado de cada parte e alvos de toque de
  44 px por capítulo;
- "Voltar ao sumário" ao fim de cada parte;
- leitura em coluna única.

**Hierarquia:**

- `h1` do relatório;
- `h2` por parte, com selos de base e de estado;
- `h3` por capítulo, pelo `ChapterArticle`, reutilizado sem mudança.

**Estados:**

- **Carregando:** esqueleto com `aria-busy` e `role="status"`.
- **Indisponível:** o `Callout` do próprio `ChapterArticle`.
- **Pendente (8 e 9):** só título e resumo, com o selo "Em definição".

**Avisos:**

- caráter simbólico no topo e no rodapé;
- o aviso próprio de cada parte;
- a leitura simulada sinalizada.

**Demonstração interna:** a rota só existe com `SIDERA_REPORT_DEMO=1`.

- **Proteção dupla:**
  - o `src/proxy.ts`, restrito a `/relatorio/leitura`, responde **404
    antes de renderizar**;
  - a página repete a checagem.
- **Indexação:** `noindex` nos dois casos.
- **Faixa de aviso:** "Demonstração interna com dados de exemplo… Não
  apresentar ao público como relatório completo", com os seis cenários
  (`?cenario=`):
  - completo;
  - leitura parcial;
  - foto insuficiente;
  - sem leitura das mãos;
  - mapa indisponível;
  - carregando.

## 3. Dados de exemplo

**Capítulos 1–5:** os relatórios da biblioteca já versionados como
fixtures da 02F.2:

- `library-report.exact.json`;
- `library-report.approximate.json`;
- `library-report.unknown.json`.

Todos foram calculados para um mapa de exemplo.

**Capítulos 6–7:** observações **fictícias** da 03C (`clearHand`,
`partialHand`, `insufficientPhoto`), passadas pelo motor das mãos com um
provedor simulado que sempre falha. Por isso os textos são os da
biblioteca. Não há rede nem foto, e o resultado sai marcado como simulado.

**Capítulos 8–9:** só os títulos e resumos de `reportParts`, sem nenhuma
interpretação, regra ou biblioteca.

## 4. Privacidade

**Nada é armazenado.** Não há foto, dado de nascimento nem resultado real.
A rota não lê o estado da leitura das mãos e não usa o registro de
consentimento, provedores reais nem banco, o que um teste estático
verifica. **A correção D5 não mudou.**

**Pendências registradas para a 04B:**

1. **O que transferir:** só os resultados **textuais** necessários. Da
   leitura das mãos, o `PalmAnalysisResult`, sem foto, sem hash e sem
   recibo. Do nascimento, o resumo normalizado que o relatório exibir.
   Transferir para um estado da jornada só em memória.
2. **Foto:** continua descartada ao sair de `/leitura-das-maos` (D5). Só
   o texto segue.
3. **Descarte do texto:** ao sair da jornada, recarregar ou fechar, pelo
   mesmo padrão de `<Activity>` e remontagem do D5. Tarefas atrasadas não
   restauram nada.
4. **Textos de privacidade:** a prévia e o consentimento dizem hoje que o
   resultado fica "na memória desta tela". Precisam de ajuste junto com a
   mudança. O "Descartar" precisa comunicar o efeito sobre o
   consentimento (pendência 8 da 03G).
5. **Testes:** nada de foto no estado da jornada; descarte ao sair;
   recarregar zera; teste de logs.
6. **Entrada no leitor:** a rota de leitura recebe `SkyInput` e
   `HandsInput` do estado da jornada no lugar dos exemplos. Os exemplos
   ficam só na demonstração interna.

## 5. Licença do motor

Ver `docs/fase-04a-licenca-motor.md`: `sweph` 2.10.3-8, Swiss Ephemeris
2.10.03, Astrodienst AG, licença AGPL ou profissional, e as opções A–E. O
relatório completo continua restrito ao ambiente interno.

## 6. Validação

| Verificação                                                            | Resultado                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contratos e adaptadores (`build.test.ts`)                              | **12 testes**: texto preservado, estrutura de `reportParts`, recusa de divergência, estados (completo, parcial, insuficiente, simulado, sem mãos, carregando, mapa indisponível), capítulos 8 e 9 só com título e resumo, sem origem interna; todos os cenários de exemplo |
| Componente (`report-reader.test.tsx`)                                  | **7 testes**: hierarquia h1/h2/h3, avisos, "Observado na foto", motivo de indisponível, pendentes, carregamento acessível, dois sumários com os 9 links e o estado em texto, nada de preço ou checkout                                                                     |
| Isolamento e trava (`isolation.test.ts`)                               | **6 testes**: sem checkout, sem estado da foto, consentimento, provedores ou banco; exemplos só com o simulador; `SIDERA_REPORT_DEMO`; o proxy responde 404 sem a variável e cobre só a leitura                                                                            |
| Navegador (`scripts/e2e/04a-leitura.mjs`, Chromium, build de produção) | **45/45**: desktop 1440×900, iPhone 13 e iPhone SE × 6 cenários, sem rolagem horizontal e **axe-core WCAG 2.0/2.1 A/AA sem violações**; teclado: o link do capítulo 6 é alcançável por Tab, o foco fica visível e Enter leva ao capítulo                                   |
| Trava no servidor de produção                                          | sem a variável: `/relatorio/leitura` **404**; `/relatorio` e `/` **200**; com a variável: 200                                                                                                                                                                              |
| `npm run check` e `npm run build`                                      | ver o registro da entrega                                                                                                                                                                                                                                                  |

Capturas em `docs/capturas/fase-04a/`, com dados de exemplo e build de
produção:

- desktop: completo, parcial, carregando, Parte II e Parte III;
- iPhone 13 e iPhone SE: completo, foto insuficiente, sumário, Parte II
  indisponível.
