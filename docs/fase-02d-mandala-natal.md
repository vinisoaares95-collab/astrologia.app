# Sidera — Fase 02D · Mandala natal real e interativa

Data: 30/10/2026 · Escopo: integração formulário → normalização → motor → mandala, só em ambiente interno. Sem interpretação, sem persistência, sem deploy.

> **Licenciamento.** O Swiss Ephemeris continua sob AGPL, restrito a desenvolvimento interno. O cálculo só executa com `SIDERA_INTERNAL_ENGINE=1` no servidor; sem a variável (o padrão em qualquer deploy), a Server Action responde `engine-disabled` **antes de processar qualquer dado**.

---

## 1. Auditoria inicial

| Item                          | Resultado                                                                                                                                                                                                                                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Commit `fc4df38`              | Confirmado; árvore limpa e sincronizada                                                                                                                                                                                                                                                                     |
| Contrato normalização → motor | `NormalizedBirth.time.*.utc` (ISO 8601 com segundos) → `utcInstantFromIso` → `UtcInstant` com segundos. Sem perda.                                                                                                                                                                                          |
| `ICU_TIMEZONE_FILES_DIR`      | O guia do ICU exige **caminho absoluto**. O launcher só garantia isso no valor padrão. Medido em processos novos: absoluto → 2026f; relativo com cwd fora da raiz → **2025b, em silêncio**. **Corrigido:** o launcher converte qualquer valor em absoluto. A documentação de produção também foi corrigida. |
| Processo novo usa 2026f       | Sim; agora coberto por teste (`tzdb.test.ts`, "carregamento da base em processos novos")                                                                                                                                                                                                                    |
| Bloqueio por versão           | Preservado: o cálculo passa pela mesma normalização (`normalizeOnServer`)                                                                                                                                                                                                                                   |

## 2. Arquitetura da integração

```
BirthDataForm (cliente)
  ├─ normalizeBirthAction ─┐
  └─ computeChartAction ───┤   (Server Actions, runtime Node.js)
                           ▼
        birth-data/server-normalize.ts   ← um único código de normalização
          (valida entrada, bloqueia tzdb ≠ 2026f, resolve localidade, local → UTC)
                           ▼
        natal-chart/engine-gate.ts       ← SIDERA_INTERNAL_ENGINE=1?
                           ▼
        natal-chart/build-chart.ts       ← NormalizedBirth → ChartView
          └─ astrology/service/compute-natal-chart.ts (02B, inalterado)
               └─ astrology/engine/swiss-ephemeris.ts (sweph, server-only)
                           ▼
        ChartView (dados serializáveis) → NatalChartView (cliente)
          ├─ NatalWheel (SVG)    ├─ BodyDetails    ├─ ChartTables
          ├─ ChartLegend         └─ ChartParameters
```

- **Sem duplicação.** As duas Server Actions usam `normalizeOnServer`; o mapa usa `computeNatalChart` (02B) sem alterações; a mandala só desenha o `ChartView`.
- **Só no servidor.** O motor é importado dinamicamente depois do interruptor, então com o motor desligado o addon nativo nem é carregado. Nenhum dado é persistido ou enviado a terceiros; o log de erro registra só o tipo do erro.
- **Empacotamento.** A rota `/dados-de-nascimento` inclui os binários Linux do `sweph`, `ephe/`, `tzdata/` e a base de localidades. O trace tem 166 arquivos, **nenhum de código-fonte**.
- **Rota de diagnóstico da 02B** (`/api/dev/astro-poc`) removida, como previsto, porque agora há integração real.
- **Visibilidade do botão.** A página é estática, então a visibilidade do botão "Calcular mapa natal" é decidida **no build** (`SIDERA_INTERNAL_ENGINE=1 npm run build`). A autorização real é verificada **na execução** pela Server Action. Teste: o mesmo build, servido sem a variável, recusa o cálculo.

## 3. Componentes

| Criados (`src/features/natal-chart/`)                                                                                 | Função                                                         |
| --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `contract.ts`                                                                                                         | `ChartView`, `ChartResult` e intervalos de incerteza           |
| `build-chart.ts`                                                                                                      | Monta o mapa para horário exato, aproximado ou desconhecido    |
| `actions.ts`, `engine-gate.ts`                                                                                        | Server Action e interruptor do ambiente interno                |
| `geometry.ts`                                                                                                         | Convenção geométrica, setores e afastamento de símbolos (puro) |
| `labels.ts`                                                                                                           | Nomes em português e formatação                                |
| `glyph-paths.ts` (gerado) + `components/glyph.tsx`                                                                    | 22 símbolos vetoriais                                          |
| `components/natal-wheel.tsx`                                                                                          | Mandala SVG interativa                                         |
| `components/body-details.tsx`, `chart-tables.tsx`, `chart-legend.tsx`, `chart-parameters.tsx`, `natal-chart-view.tsx` | Detalhes, tabelas acessíveis, legenda, parâmetros e composição |

| Reutilizados                                                        |                 |
| ------------------------------------------------------------------- | --------------- |
| `computeNatalChart`, `utcInstantFromIso`, `ChartError` (astrologia) | Cálculo e erros |
| `normalizeBirthData` (02C) via `server-normalize.ts`                | Normalização    |
| `Card`, `Badge`, `Callout`, `Stat`, `Switch` (design system)        | Interface       |
| `formatCoordinates`, `formatUtc`, `describeOffset` (02C)            | Parâmetros      |

**A mandala decorativa (`components/visuals/mandala.tsx`) não foi alterada** e continua sendo ornamento nas telas institucionais. A mandala real é um componente separado, que nunca exibe posições simuladas.

### Símbolos

Os caracteres Unicode dos signos são exibidos como **emoji** em vários sistemas (iOS). Por isso os contornos foram **extraídos das fontes Noto Sans Symbols e Noto Sans Symbols 2** (SIL OFL 1.1; texto em `src/features/natal-chart/GLYPHS-OFL.txt`) e desenhados como `<path>`. Não há fonte para carregar nem risco de emoji. A Noto Sans Symbols não tem o Sol (U+2609), que vem da Symbols 2. Gerador reproduzível, com URLs e SHA-256 fixados: `scripts/glyphs/extract_glyphs.py`.

## 4. Convenção geométrica

- **Orientação:**
  - com Ascendente (horário exato, ou o centro da janela no horário aproximado), o **Ascendente fica às 9 h**;
  - sem horário, **0° de Áries fica às 9 h**, e isso é identificado na mandala ("Sem horário: sem Ascendente e casas").
- **Sentido:** a longitude cresce no sentido **anti-horário**. Ângulo de tela `θ = 180° + (λ − orientação)`, medido a partir de +x, anti-horário. Em SVG: `x = cx + r·cos θ`, `y = cy − r·sen θ`. Com isso as casas 1–3 ficam abaixo do horizonte e o Meio do Céu na metade superior.
- **Anéis** (`viewBox` 1000):

| Raio    | Elemento                                                                                                              |
| ------- | --------------------------------------------------------------------------------------------------------------------- |
| 448–378 | Zodíaco: 12 setores de 30° a partir de 0° Áries, com símbolo no centro do setor                                       |
| 378–392 | Escala de graus (1°, 5° e 10°)                                                                                        |
| 378–330 | Números das casas, na metade de cada casa (casas de tamanhos diferentes são respeitadas)                              |
| 378–188 | Linhas das cúspides; angulares (1, 4, 7 e 10) em destaque                                                             |
| 276     | Símbolos dos planetas                                                                                                 |
| 232     | Grau e minuto (ocultos abaixo de 448 px de largura, onde ficariam ilegíveis; os dados continuam na tabela e no toque) |
| ≤ 188   | Linhas de aspecto, ligando as **longitudes reais**                                                                    |

- **Planetas próximos:** a posição **real** é sempre a marca laranja na escala de graus. Só o símbolo é afastado, com ao menos 9° de separação, preservando a ordem zodiacal e centralizando cada grupo na média das posições reais; uma linha de conexão liga símbolo e marca. O algoritmo corta o círculo no maior vão, então grupos que atravessam 0° funcionam.
- **Aspectos:**
  - quadratura e oposição em cobre; trígono e sextil em azul;
  - a opacidade e a espessura aumentam conforme o orbe fica mais apertado;
  - aspectos incertos ficam tracejados;
  - conjunções não têm linha (os pontos coincidem) e aparecem na tabela;
  - ao selecionar um planeta, os aspectos dele são destacados e os demais esmaecidos; um interruptor oculta todas as linhas.

## 5. Interatividade e acessibilidade

- Cada planeta é um botão SVG (`role="button"`, `aria-pressed`) com rótulo completo, por exemplo: "Sol em 21°43′ de Touro, casa 8".
- **Teclado:** um Tab entra na mandala (_roving tabindex_); as setas percorrem os planetas em ordem zodiacal; Home e End vão às pontas; Enter ou Espaço selecionam; Esc limpa a seleção. O foco é desenhado na própria mandala.
- **Detalhes:** nome, posição, longitude decimal, casa (ou motivo da ausência), velocidade, latitude eclíptica, retrogradação, intervalo na janela e aspectos com orbe, fase e incerteza. **Nenhuma interpretação.**
- As tabelas de posições, cúspides e aspectos são o equivalente textual completo da mandala.
- As camadas decorativas não recebem eventos de ponteiro, então toques sempre atingem os planetas.
- Escala com a largura e com o zoom do navegador; sem rolagem horizontal em 360, 390, 768 e 1440 px.

## 6. Horários incertos

| Precisão              | Ângulos                                                               | Casas                                                                                                        | Planetas                                                                           | Aspectos                                                                        |
| --------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Exato                 | Eixos ASC/DSC e MC/IC                                                 | Placidus (se definido)                                                                                       | Posição                                                                            | Todos                                                                           |
| Aproximado (± margem) | **Faixas** de ASC e MC (extremos da janela) e eixos tracejados "ASC≈" | **Não determinadas**; a casa do planeta só aparece se for igual nos dois extremos, senão "varia entre 7 e 8" | Posição no centro + intervalo na janela                                            | Sem ASC/MC; os que não ocorrem em toda a janela ficam **incertos** (tracejados) |
| Desconhecido          | **Nenhum**                                                            | **Nenhuma**                                                                                                  | Meio-dia local + **intervalo no dia inteiro** (Lua ≈ 12–15°, desenhada como faixa) | Os que não ocorrem em todo o dia ficam **incertos**                             |

Nenhuma posição ausente é completada com valores fictícios. Latitudes polares mantêm ASC e MC e omitem as casas (aviso "Casas Placidus indefinidas").

## 7. Exemplos de mapas calculados

Nascimentos **fictícios**:

| Entrada                             | Resultado                                                                                                                                                              |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| São Paulo (IBGE), 12/05/1990, 14:30 | UTC `17:30`. Sol 21°43′ Touro (casa 8), Lua 23°35′ Sagitário, ASC 24°44′ Virgem, MC 26°24′ Gêmeos; Mercúrio, Saturno, Urano, Netuno e Plutão retrógrados; 22 aspectos. |
| Mesmo local e data, sem horário     | Orientação por 0° Áries; Lua de ~13° no dia local (UTC `03:00` → `02:59:59` do dia seguinte); sem ângulos nem casas                                                    |
| Mesmo local e data, 14:30 ± 1 h     | Faixa do ASC com ~30°; casas não determinadas                                                                                                                          |
| Tromsø, 21/12/1999 (teste)          | ASC e MC presentes; casas Placidus indefinidas                                                                                                                         |

## 8. Testes de correspondência

**537 testes** (+46 em relação aos 491 da 02C.1).

| Suíte                                         | Testes | Conteúdo                                                                                                                                                                                                                                                    |
| --------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `natal-chart/geometry.test.ts`                | 10     | Orientação às 9 h; sentido anti-horário; ida e volta ponto ↔ longitude (erro < 1e-9°); setores; afastamento de símbolos (distância mínima, ordem, grupo que atravessa 0°, _stellium_ de 10 corpos)                                                          |
| `natal-chart/build-chart.test.ts`             | 19     | **Cadeia completa** (12/05/1990 14:30 em São Paulo → 17:30 UTC): os 10 corpos vs. **JPL DE421**; ASC, MC e as 12 cúspides vs. **oráculo independente**; horário desconhecido, aproximado, polar e intervalos                                                |
| `natal-chart/components/natal-wheel.test.tsx` | 10     | Cada marca de planeta, setor de signo, cúspide, eixo e linha de aspecto convertida de volta em longitude: **≤ 0,01°** do valor calculado; ASC à esquerda e MC em cima; símbolos sem sobreposição; mandala sem horário; teclado; rótulos acessíveis; tabelas |
| `natal-chart/actions.test.ts`                 | 4      | Desligado por padrão (sem processar dados); cálculo com a base real; erros de normalização; erros do motor traduzidos                                                                                                                                       |
| `birth-time/tzdb.test.ts`                     | +3     | Processos novos: caminho absoluto → 2026f; relativo fora da raiz cai na base embutida; o launcher converte para absoluto                                                                                                                                    |

**Verificação visual no navegador real** (Chromium, build de produção): as marcas renderizadas foram medidas com `getBoundingClientRect`, convertidas em ângulo em torno do centro da mandala e comparadas com as longitudes do motor. **Desvio máximo: 0,000°** (3 casas decimais) em 360, 390, 768 e 1440 px. Sem rolagem horizontal; teclado real (Tab, setas e Enter) funcionando; servidor sem a variável recusando o cálculo.

Capturas: `docs/capturas/15` a `20`.

## 9. Limitações

- **Licença:** nenhum deploy público com o motor antes da decisão de licenciamento.
- **Intervalos:** ~~calculados pelos extremos e pelo centro da janela~~. **Corrigido na Fase 02E:** a janela passou a ser amostrada a cada 30 min; estações planetárias e todas as casas visitadas entram no intervalo (ver `docs/fase-02e-motor-de-interpretacao.md`, §1).
- **Orientação no horário aproximado:** usa o centro da janela; os ângulos são mostrados como faixas e identificados com "≈".
- **Rótulos de grau:** ocultos em telas estreitas (< 448 px); a informação continua no toque e na tabela.
- **Desktop:** a mandala fica limitada à largura da coluna do formulário (~470 px).
- **Pontos fora do MVP:** Nodos, Quíron, Vértice e partes árabes; conjunções sem linha (apenas na tabela).
- **Glifos:** extraídos de fontes Noto (OFL), dependentes do desenho original dessas fontes.

## 10. Como executar no ambiente interno

```bash
SIDERA_INTERNAL_ENGINE=1 npm run dev
```

Para produção local, com o botão visível no build:

```bash
SIDERA_INTERNAL_ENGINE=1 npm run build
```

```bash
SIDERA_INTERNAL_ENGINE=1 npm start
```
