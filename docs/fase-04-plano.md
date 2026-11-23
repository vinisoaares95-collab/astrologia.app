# Fase 04 — Relatório integrado dos nove capítulos: diagnóstico e plano

**Para aprovação (23/11/2026).**

- **Nada implementado:** nenhum código alterado, nenhuma chamada paga,
  nenhum deploy.
- **Base:** inspeção do repositório no commit `f01efc9`.
- **Restrições de produção da 03G:** continuam valendo
  (`docs/privacidade/11-pendencias-antes-do-lancamento.md`).

## 1. Diagnóstico da arquitetura atual

### 1.1 Capítulos 1 a 5 (Parte I, "Seu Céu")

**Caminho dos dados:**

1. **Dados de nascimento:** `normalizeBirthAction` e `normalizeOnServer`
   fazem a normalização, com tzdb fixada e bases locais de cidades (02C).
2. **Cálculo do mapa:** `computeChartAction` e `buildChartView` → `ChartView`,
   com Swiss Ephemeris (02B e 02D). A amostragem cobre horário aproximado ou
   desconhecido.
3. **Motor de interpretação** (02E, `features/interpretation/engine.ts`):
   - `buildInterpretation(chart)` gera um `InterpretationReport` com
     5 capítulos (`identidade`, `emocional`, `mente`, `relacionamentos`,
     `talentos`);
   - cada capítulo tem itens (observação calculada × leitura simbólica),
     limitações e tensões;
   - vem com o aviso padrão (`DISCLAIMER`).
4. **Redação** (02F e 02F.2, `interpretation/ai/generate.ts`):
   - `generateReport` faz uma chamada por capítulo, em paralelo, com Haiku
     5.5 e esforço médio;
   - tudo passa por validador;
   - se a IA falhar, o capítulo usa o texto determinístico da biblioteca
     (`libraryReport`).
5. **Para o cliente:** `toClientReport` entrega um `ClientReport` com
   `ClientChapter`: introdução, seções com `notes` de precisão, síntese,
   perguntas e limitações.
   - Um capítulo astrológico **nunca fica indisponível**: o que falta vira
     limitação.

**Estado atual:**

- **Cálculo:** só em ambiente interno (`SIDERA_INTERNAL_ENGINE=1`).
  - Motivo: a licença AGPL do Swiss Ephemeris impede serviço público até a
    decisão de licenciamento (`docs/DECISIONS.md`).
- **Redação com IA:** existe, mas **nenhuma página a usa**.
- **O que o fluxo de nascimento faz hoje:** só confere os dados e mostra a
  mandala no ambiente interno. Ao avançar, **nada é levado** para
  `/relatorio`.
- **Carga enviada à IA:** só fatos calculados e itens selecionados (signos,
  casas, aspectos). **Não leva data, hora nem local de nascimento**
  (`ai/payload.ts`).
- **Efeito no aviso:** ainda assim, o aviso atual dos dados de nascimento
  ("não os repassa a outros serviços") deixaria de ser verdadeiro quando os
  capítulos forem redigidos pela IA.

### 1.2 Capítulos 6 e 7 (Parte II, "Suas Mãos")

**Caminho dos dados:**

1. Foto preparada no aparelho.
2. Consentimento e recibo; com o registro ligado, gravação da evidência.
3. Visão com Sonnet 5.5.
4. Validação da observação.
5. Motor `buildPalmInterpretation`: 2 capítulos (`maos` e `linhas`).
6. Redação com Haiku 5.5, ou texto da biblioteca.
7. Para o cliente: `PalmAnalysisResult`, com status (`complete`, `partial`
   ou `insufficient`), `retakeRecommended`, `disclaimer` e dois
   `ClientPalmChapter`. Cada capítulo traz `status`, `observed` separado da
   leitura, `notes` e `unavailableMessage`.

**Estado atual:**

- **Avaliação:** validado ponta a ponta na 03F.2.
- **Reprodutibilidade:** **não validada**. Na foto-05, três traços
  inverteram com a mesma entrada. Isso continua em aberto e condiciona o
  lançamento.
- **Onde o resultado vive:** **só na memória do provider** de
  `/leitura-das-maos`.
- **Ao sair do segmento (D5):** são descartados foto, resultado,
  consentimento e recibo.
  - Por isso, **hoje o resultado das mãos não chega à etapa de nascimento**
    nem a nenhum relatório.

### 1.3 Capítulos 8 e 9 (Parte III, "Sua Jornada")

O que existe é **só a estrutura editorial** de `src/content/report-chapters.ts`:

| Nº  | Título                               | Resumo                                                    |
| --- | ------------------------------------ | --------------------------------------------------------- |
| 8   | Conexões simbólicas entre céu e mãos | "Onde as duas leituras conversam — e onde divergem."      |
| 9   | Seu guia pessoal de reflexão         | "Perguntas e práticas para levar a leitura ao cotidiano." |

**Não existe:**

- motor;
- biblioteca;
- regras;
- validador;
- prompt;
- avaliação.

**Vocabulário comum:** nenhum entre as duas leituras. Os itens
astrológicos têm marcas de tom (`ToneTag`, ex.: `ritmo:cautela`) e os das
mãos (`PalmItem`) não têm marca nenhuma.

**Conclusão:** **não há definição** de como os capítulos 8 e 9 são
produzidos. Eles **não serão inventados**: a definição é uma decisão
editorial (seção 6, decisão 2).

### 1.4 Jornada e páginas

**Jornada atual (`config/routes.ts`):**

```
Mão (/leitura-das-maos → consentimento → foto) → Prévia → Nascimento → Relatório
```

**O que é a página `/relatorio`:**

- é a **página de oferta**: sumário editorial dos 9 capítulos
  (`ReportExplorer`), preço e `OfferSummary` com order bumps;
- **não exibe nenhum resultado**.

**PDF:** citado no catálogo e na página de oferta, mas não existe.

### 1.5 O que pode ser reutilizado

| Peça                                                                            | Uso na Fase 04                                                                                                                                                                                        |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ChapterArticle` e `ChapterArticleData` (`features/report/chapter-article.tsx`) | Já foi feito para servir aos 9 capítulos: número, título, introdução, seções (com `observed` opcional), síntese, perguntas, limitações e estado indisponível. O rótulo `observedLabel` é configurável |
| `ClientChapter` (astrologia) e `ClientPalmChapter` (mãos)                       | Viram `ChapterArticleData` por adaptadores triviais. A astrologia não tem `observed`, e suas `notes` são de precisão                                                                                  |
| `reportParts`                                                                   | Fonte única de números, títulos, partes e origem (`sky`, `hands`, `journey`)                                                                                                                          |
| `ReportExplorer`                                                                | Padrão de abas acessível, já existente, para navegar pelas partes                                                                                                                                     |
| `ActionDock`, `FlowHeader`, `JourneySteps`, `Callout`, `Badge`                  | Estrutura de jornada mobile-first já usada                                                                                                                                                            |
| `generateReport`, `libraryReport`, `toClientReport`                             | Geração dos capítulos 1 a 5, com biblioteca sem custo                                                                                                                                                 |
| `normalizeOnServer`, `buildChartView`, `buildInterpretation`                    | Sem mudança                                                                                                                                                                                           |
| `NatalChartView` (mandala)                                                      | Só no ambiente interno, junto com o cálculo                                                                                                                                                           |
| Padrão do D5 (`beginTask`, descarte ao sair, remontagem)                        | Mesmo cuidado para o estado do relatório                                                                                                                                                              |

## 2. Proposta técnica de integração

### 2.1 Contrato único do relatório (só no cliente, só texto)

```ts
type IntegratedReport = {
  sky: {
    status: "ready" | "unavailable";
    disclaimer: string;
    chapters: ChapterArticleData[];
  }; // 1–5
  hands: {
    status: ReadingStatus | "absent";
    disclaimer: string;
    chapters: ChapterArticleData[];
    retakeRecommended: boolean;
    simulated: boolean;
  }; // 6–7
  journey: { chapters: ChapterArticleData[] }; // 8–9: só depois da decisão 2
  basis: { precision: "exact" | "approximate" | "unknown" };
};
```

- **Adaptadores puros e testáveis:**
  - `ClientChapter → ChapterArticleData` com `status: "content"`;
  - `ClientPalmChapter → ChapterArticleData` sem mudança de conteúdo.
- **Títulos e números:** vêm de `reportParts`, conferidos contra os
  capítulos recebidos. Uma divergência quebra o teste.
- **Avisos:** cada parte mantém o **seu** aviso de não cientificidade (o
  da astrologia e o das mãos). Nenhum texto editorial é reescrito.

### 2.2 Preservar o que já foi produzido (sem novas análises)

- **Leitura das mãos:**
  - o `PalmAnalysisResult` que a pessoa viu na prévia **é o que entra no
    relatório**, sem nova chamada à visão nem à redação;
  - a foto **não** entra.
- **Capítulos astrológicos:**
  - são gerados **uma vez** por envio dos dados de nascimento, numa única
    chamada do servidor (normalizar → mapa → interpretação → redação ou
    biblioteca);
  - o resultado fica no aparelho;
  - mudar os dados gera nova geração; voltar ao relatório não gera.
- **Onde guardar (decisão 3):**
  - **Recomendado:** um provider no layout de `(jornada)`, **só em
    memória**, com o texto dos capítulos e o resumo normalizado do
    nascimento.
  - **Regras de descarte:** some ao recarregar ou fechar, e ao sair da
    jornada para o site, pelo mesmo padrão do D5 com `<Activity>`.
  - **Sem banco nem armazenamento do navegador.**
  - **O que muda no D5:** a foto continua descartada ao sair de
    `/leitura-das-maos`, mas o **texto** do resultado passa a seguir para
    as etapas seguintes da jornada. Isso muda os textos de privacidade, que
    hoje dizem que o resultado fica "na memória desta tela".
  - **Alternativa não recomendada:** guardar no servidor (como o
    resultado compartilhado da D8). Isso amplia dado pessoal persistido e
    está bloqueado em produção.

### 2.3 Fotos insuficientes, capítulos indisponíveis e falhas parciais

| Situação                                       | Capítulos 1–5                                               | Capítulos 6–7                                                   | Capítulos 8–9                                   | Relatório                                                                     |
| ---------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Tudo disponível                                | conteúdo                                                    | conteúdo                                                        | conforme a decisão 2                            | completo                                                                      |
| Leitura das mãos parcial                       | conteúdo                                                    | um com conteúdo, outro indisponível com a mensagem já existente | conforme a decisão 2 (ex.: só o que tiver base) | parcial, com indicação clara                                                  |
| Foto insuficiente                              | conteúdo                                                    | os dois indisponíveis ("precisamos de outra foto")              | sem base das mãos                               | **decisão 6**: liberar só com nova foto ou exibir com a Parte II indisponível |
| Pessoa não fez a leitura das mãos              | conteúdo                                                    | ausentes                                                        | sem base                                        | idem                                                                          |
| IA dos capítulos 1–5 falha                     | biblioteca (já existente, sem custo)                        | —                                                               | —                                               | completo; a origem não é exibida (regra da 02F.2)                             |
| Cálculo indisponível (motor desligado ou erro) | indisponíveis, com mensagem                                 | —                                                               | —                                               | Parte I indisponível                                                          |
| Horário desconhecido ou aproximado             | conteúdo com limitações e notas de precisão (já existentes) | —                                                               | —                                               | completo                                                                      |

**Inconsistência visual:**

- **Não é tratada como resolvida.** O relatório mostra a mesma ressalva
  dos capítulos 6 e 7 e não esconde nada.
- **Lançamento comercial:** continua condicionado à pendência da 03F.2.

### 2.4 Experiência em desktop e mobile

**Uma rota nova de leitura** (nome em aberto, decisão 5), separada da
página de oferta.

- **Topo:**
  - aviso geral;
  - situação de cada parte (pronta, parcial ou indisponível).
- **Navegação:**
  - **mobile:** abas das 3 partes (padrão do `ReportExplorer`, com setas,
    Home e End) e capítulos em sequência, com âncoras;
  - **desktop:** sumário lateral fixo com os 9 capítulos e o estado de
    cada um, e leitura na coluna principal.
- **Capítulos:** todos com `ChapterArticle`.
  - O bloco de observação usa rótulos próprios: "Observado na foto" nas
    mãos e "Calculado no mapa" na astrologia, se aprovado; a astrologia hoje
    só tem `notes`.
- **Mandala:** só no ambiente interno (AGPL).
- **Fora do escopo:** PDF, checkout e contas.
- **Testes:** acessibilidade (foco, títulos, `aria`) e capturas em
  telefone pequeno, telefone grande e desktop (Playwright, como na 03F.2).

### 2.5 Isolamento

- **Checkout:**
  - a rota de leitura **não importa** `catalog`, `OfferSummary` nem preço;
  - a página `/relatorio` (oferta) não muda;
  - um teste estático impede a importação.
- **Privacidade:**
  - o registro de consentimento, o recibo e as travas de produção da 03G
    não mudam;
  - a leitura das mãos continua pelos mesmos endpoints;
  - nada novo é persistido.
- **Motor astrológico:**
  - a nova chamada do servidor para os capítulos 1–5 **respeita
    `SIDERA_INTERNAL_ENGINE`**: desligada, a Parte I fica indisponível;
  - a IA real só funciona com as variáveis da 02F;
  - em desenvolvimento, o padrão é a biblioteca, sem custo.
- **Logs:** a nova chamada entra no teste de logs da 03G. Nada de dados de
  nascimento nem de capítulos no console.

## 3. Jornada prevista

```
1. Leitura das mãos (inalterada até a prévia)
   intro → consentimento → foto → análise → prévia dos capítulos 6–7
      (a foto é descartada ao sair do segmento; o TEXTO segue — decisão 3)
2. Nascimento
   dados → conferência → (servidor) mapa + capítulos 1–5, uma vez
3. Relatório (rota nova de leitura)
   Parte I (1–5) · Parte II (6–7, com indisponíveis explicados) · Parte III (8–9, conforme a decisão 2)
4. Sair, recarregar ou fechar → tudo descartado do aparelho
```

- **Ordem:** a atual, mãos e depois nascimento, é mantida. Mudá-la não é
  necessário para a integração.
- **Página `/relatorio` (oferta):** continua como está.
- **Checkout:** a ligação entre oferta e leitura fica para a fase de
  checkout.

## 4. Etapas da Fase 04

| Etapa                              | Entrega                                                                                                                                                                                                                                                                                        | Depende de                 | Custo              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------ |
| **04A — Contrato e leitor**        | `IntegratedReport`, adaptadores, rota de leitura renderizando **fixtures** (capítulos 1–5 da biblioteca a partir do exemplo `example-report.sao-paulo-1990.json`, 6–7 dos resultados simulados), estados indisponíveis, desktop e mobile, testes de acessibilidade e de isolamento do checkout | decisões 5 e 6             | —                  |
| **04B — Estado da jornada**        | provider de `(jornada)` só com texto, passagem do resultado das mãos (sem foto), descarte ao sair e ao recarregar (padrão do D5), textos de privacidade ajustados ao novo comportamento                                                                                                        | decisão 3                  | —                  |
| **04C — Capítulos 1–5 na jornada** | chamada do servidor (normalizar → mapa → interpretação → biblioteca ou IA), uma vez por envio, atrás de `SIDERA_INTERNAL_ENGINE`; biblioteca por padrão; testes com provedor simulado; teste de logs                                                                                           | decisão 4                  | —                  |
| **04D — Capítulos 8–9**            | **só depois** da especificação editorial aprovada (decisão 2): regras, fontes de conteúdo, validador e textos                                                                                                                                                                                  | decisão 2                  | a definir          |
| **04E — Validação ponta a ponta**  | jornada completa no navegador (simulado), capturas em desktop e mobile, falhas parciais; avaliação paga só se autorizada e com teto                                                                                                                                                            | 04A–04C (e 04D, se houver) | só com autorização |

**Fica fora da Fase 04:**

- checkout e pagamento;
- PDF;
- contas;
- painel;
- order bumps;
- resolução das pendências da 03G e da 03F.2.

## 5. Riscos

| Risco                                                      | Efeito                                                                                    | Mitigação                                                                                          |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Licença AGPL do motor astrológico                          | Sem a decisão de licenciamento, **não há capítulos 1–5 em serviço público**               | A Fase 04 funciona no ambiente interno; o lançamento depende da decisão 1                          |
| Instabilidade visual (03F.2)                               | Relatórios diferentes para a mesma mão                                                    | Não esconder; ressalva mantida; lançamento condicionado ao experimento                             |
| Capítulos 8–9 sem definição                                | Inventar conteúdo violaria as regras editoriais                                           | Etapa própria, só com especificação aprovada                                                       |
| Resultado das mãos passando para outras etapas             | Contradiz o texto atual ("na memória desta tela")                                         | Decisão 3 e ajuste de texto na 04B                                                                 |
| IA nos capítulos 1–5                                       | Fatos do mapa vão à Anthropic; o aviso atual de nascimento ("não repassa") fica incorreto | Biblioteca por padrão; o texto muda quando a IA for ligada; a política entra na pendência 6 da 03G |
| Latência dos capítulos 1–5 com IA (5 chamadas em paralelo) | Espera na etapa de nascimento                                                             | Biblioteca imediata como alternativa; medir na 04E                                                 |

## 6. Decisões que precisam de aprovação

1. **Motor astrológico em serviço público (AGPL).** Confirmar que a Fase
   04 avança só no ambiente interno até a decisão de licenciamento. Ela já
   está registrada, mas bloqueia o lançamento do relatório completo.
2. **Capítulos 8 e 9.** Escolher uma opção:
   - (a) ficam fora do MVP, com a Parte III marcada "em preparação";
   - (b) abrir uma especificação editorial própria (fontes, regras,
     validador), aprovada antes de qualquer código.

   Nada será inventado nos dois casos.

3. **Estado entre etapas.** O texto do resultado das mãos (sem foto) e os
   capítulos 1–5 ficam em memória na jornada inteira e são descartados ao
   sair, recarregar ou fechar. Recomendado. Isso implica ajustar os textos
   de privacidade.
4. **Capítulos 1–5 na jornada.** Biblioteca por padrão, sem custo. IA
   (Haiku 5.5) só com as variáveis da 02F e uma avaliação paga autorizada à
   parte.
5. **Rota da leitura.** Nome e lugar (ex.: `/relatorio/leitura`), separada
   da página de oferta.
6. **Leitura das mãos insuficiente ou não feita.** Escolher uma opção:
   - (a) o relatório sai com a Parte II indisponível, explicada;
   - (b) exige nova foto antes do relatório.
