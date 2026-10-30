# Sidera — Fase 02B · Prova de viabilidade do motor astrológico

Data: 30/10/2026 · Escopo: módulo experimental isolado, sem integração com a jornada, sem persistência e sem deploy.

> **Licenciamento.** O Swiss Ephemeris está em uso sob **AGPL‑3.0**, apenas para desenvolvimento e testes internos (decisão da Fase 02A). **Nenhum serviço público pode usar este motor** antes de o licenciamento ser resolvido.

---

## 1. Dependências adicionadas

| Pacote                                | Versão (fixa)                             | Licença                                                             | Tipo                    | Uso                                      |
| ------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------- | ----------------------- | ---------------------------------------- |
| `sweph`                               | 2.10.3-8 (Swiss Ephemeris 2.10.03)        | AGPL-3.0-or-later **ou** LGPL-3.0-or-later com licença profissional | produção (servidor)     | Motor de efemérides e casas              |
| `astronomy-engine`                    | 2.1.19                                    | MIT                                                                 | desenvolvimento         | Checagem cruzada independente nos testes |
| Arquivos `sepl_18.se1`, `semo_18.se1` | do repositório oficial `aloistr/swisseph` | iguais ao Swiss Ephemeris                                           | dados (não versionados) | Efemérides de 1800 a 2399                |

Os arquivos de efemérides **não ficam no repositório**: o comando `npm run ephe:fetch` baixa e confere o SHA-256 de cada um (veja `src/features/astrology/engine/ephemeris-files.ts`). O `npm test` executa essa verificação antes dos testes (`pretest`).

**Ferramentas de referência, fora do projeto** (num ambiente Python isolado, apenas para gerar os valores esperados):

| Ferramenta                       | Versão | Licença                            |
| -------------------------------- | ------ | ---------------------------------- |
| Skyfield                         | 1.55   | MIT                                |
| skyfield-data (inclui JPL DE421) | 7.0.0  | MIT (dados JPL de domínio público) |

O gerador é `scripts/reference/generate_de421_reference.py`, e os valores gerados estão em `src/features/astrology/__fixtures__/de421-reference.json`.

## 2. Arquitetura do módulo experimental

```
src/features/astrology/
  domain/                      # funções puras, sem motor e sem React
    types.ts                   # contratos: ChartRequest, NatalChart, BodyPosition, Aspect…
    zodiac.ts                  # normalização, signo/grau/minuto truncados, casa, limite de signo
    orbs.ts                    # ORBS_V1 (configuração versionada)
    aspects.ts                 # aspectos maiores, orbe, aplicativo/separativo
  engine/
    ephemeris-provider.ts      # interface que qualquer motor deve cumprir
    swiss-ephemeris.ts         # adapter `sweph` (server-only)
    ephemeris-files.ts         # manifesto dos arquivos .se1 (tamanho, SHA-256, faixa)
    errors.ts                  # ChartError com códigos tipados
  service/
    compute-natal-chart.ts     # validação + orquestração; não interpreta nada
  __fixtures__/de421-reference.json
src/app/api/dev/astro-poc/route.ts  # diagnóstico — desligado por padrão
scripts/fetch-ephemeris.mjs         # download + verificação dos .se1
scripts/reference/                  # gerador das referências independentes
```

**Regras implementadas no contrato:**

- **Horário desconhecido** (`timePrecision: "unknown"`): sem Ascendente, Meio do Céu, casas e aspectos com ângulos; `unavailable` informa o motivo.
- **Placidus indefinido** (latitudes polares): ASC e MC mantidos, `houses: null`, aviso `PLACIDUS_UNDEFINED`. Nunca outro sistema de casas.
- **Fallback silencioso do Swiss Ephemeris:** sem os arquivos `.se1`, a biblioteca calcula em modo Moshier sem erro. O adapter **recusa** esse resultado (`EPHEMERIS_FALLBACK`) e verifica a presença dos arquivos antes (`EPHEMERIS_FILES_MISSING`).
- **Troca silenciosa para Porfírio:** acima do círculo polar o Swiss Ephemeris troca o sistema de casas sozinho. O adapter descarta essas cúspides.
- **Erros tipados:** `INVALID_DATE`, `DATE_OUT_OF_RANGE`, `INVALID_COORDINATES`, `EPHEMERIS_FILES_MISSING`, `EPHEMERIS_FALLBACK`, `ENGINE_FAILURE`.
- **Versionamento:** `calcVersion` = algoritmo + motor + arquivos + orbes, ex.: `chart-0.1.0-experimental+swiss-ephemeris-2.10.03+sepl_18.se1+semo_18.se1+orbs-v1`.
- **Limite de signo:** planeta a menos de 1′ de um limite gera o aviso `NEAR_SIGN_BOUNDARY`.

**Fora do escopo** (fases seguintes): conversão de horário local em UTC e fusos históricos (02C), horário aproximado (`range`), busca de cidades, persistência, mandala real, interpretação.

## 3. Convenções de cálculo

| Item            | Convenção                                                                                                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zodíaco         | Tropical                                                                                                                                                                   |
| Referencial     | Geocêntrico, posição **aparente** (tempo de luz, aberração, deflexão), eclíptica e equinócio **verdadeiros da data**                                                       |
| Escala de tempo | Entrada em UTC → `swe_utc_to_jd` → JD(UT) e JD(TT); ΔT pelo Swiss Ephemeris. **Antes de 1972** (quando não havia UTC com segundos bissextos) a entrada é tratada como UT1. |
| UT1 − UTC       | Ignorado pelo Swiss Ephemeris (`                                                                                                                                           | DUT1 | < 0,9 s`): efeito de até ~13″ no tempo sideral. É irrelevante perto da precisão de um horário de nascimento informado ao minuto (1 min ≈ 15′ no tempo sideral). |
| Efemérides      | Swiss Ephemeris `sepl_18`/`semo_18` (derivados das efemérides JPL), 1800–2399                                                                                              |
| Casas           | Placidus (`houses_ex2`, sistema `"P"`), longitude geográfica leste positiva                                                                                                |
| Exibição        | Grau e minuto truncados                                                                                                                                                    |
| Orbes           | `orbs-v1`: conjunção e oposição 8°, quadratura e trígono 7°, sextil 5°, +2° com Sol ou Lua, 5° com ASC/MC                                                                  |

## 4. Referências independentes e tolerâncias

| O que valida                | Referência                                                                  | Independência                      | Tolerância aprovada |
| --------------------------- | --------------------------------------------------------------------------- | ---------------------------------- | ------------------- |
| Sol a Plutão                | JPL **DE421** via Skyfield (aparente, eclíptica verdadeira da data)         | Outras efemérides e outro software | ≤ 18″               |
| Lua                         | JPL DE421 via Skyfield                                                      | Idem                               | ≤ 36″               |
| ASC, MC                     | Fórmulas clássicas em Python, com GAST e obliquidade verdadeira do Skyfield | Código e insumos independentes     | ≤ 0,01° (36″)       |
| Cúspides Placidus           | Iteração clássica pelo semiarco, mesmo oráculo                              | Idem                               | ≤ 1′                |
| Planetas (checagem cruzada) | Astronomy Engine (VSOP87/ELP próprios, ±1′ declarado)                       | Algoritmo independente             | ≤ 1′                |

O JPL Horizons (fonte prevista na Fase 02A) estava **bloqueado na rede da sessão** (HTTP 403). O DE421 é uma efeméride oficial do JPL, distribuída pelo PyPI, e serve como substituto equivalente para este período (1900–2050).

## 5. Resultados numéricos

12 casos **fictícios**, com o instante já em UTC:

| Caso                   | Sol                | Lua                | ASC               | MC                 | Δ planetas máx. | Δ Lua | Δ ASC / MC  | Δ cúspides máx. | Δ Astronomy Engine máx. |
| ---------------------- | ------------------ | ------------------ | ----------------- | ------------------ | --------------- | ----- | ----------- | --------------- | ----------------------- |
| sao-paulo-1990         | 21°43′ Touro       | 23°35′ Sagitário   | 24°45′ Virgem     | 26°24′ Gêmeos      | 0.02″           | 0.00″ | 0.7″ / 0.5″ | 0.7″            | 0.08′                   |
| recife-1986            | 25°17′ Capricórnio | 0°53′ Áries        | 14°13′ Gêmeos     | 15°04′ Peixes      | 0.03″           | 0.00″ | 0.0″ / 0.0″ | 0.0″            | 0.14′                   |
| rio-branco-2009        | 10°46′ Gêmeos      | 23°16′ Virgem      | 19°42′ Aquário    | 21°51′ Escorpião   | 0.02″           | 0.00″ | 0.4″ / 0.4″ | 0.5″            | 0.30′                   |
| lisboa-1975-meia-noite | 1°04′ Sagitário    | 1°45′ Leão         | 29°22′ Leão       | 24°18′ Touro       | 0.03″           | 0.00″ | 0.0″ / 0.0″ | 0.0″            | 0.24′                   |
| nova-york-2001         | 7°04′ Libra        | 10°38′ Peixes      | 18°52′ Câncer     | 29°58′ Peixes      | 0.01″           | 0.00″ | 0.4″ / 0.5″ | 0.5″            | 0.20′                   |
| ushuaia-1960           | 12°19′ Câncer      | 9°46′ Escorpião    | 12°57′ Touro      | 2°02′ Peixes       | 0.05″           | 0.09″ | 0.0″ / 0.0″ | 0.0″            | 0.18′                   |
| reykjavik-1980         | 29°46′ Gêmeos      | 4°58′ Libra        | 3°53′ Capricórnio | 9°05′ Sagitário    | 0.03″           | 0.00″ | 0.2″ / 0.2″ | 0.5″            | 0.23′                   |
| tromso-1999-polar      | 29°09′ Sagitário   | 11°36′ Gêmeos      | 2°27′ Aquário     | 17°07′ Capricórnio | 0.01″           | 0.00″ | 0.0″ / 0.0″ | indefinido ✓    | 0.18′                   |
| equinocio-2000-limite  | 29°59′ Peixes      | 1°26′ Libra        | 3°44′ Peixes      | 4°42′ Sagitário    | 0.01″           | 0.00″ | 0.1″ / 0.1″ | 0.1″            | 0.18′                   |
| mercurio-retro-2016    | 18°12′ Virgem      | 29°31′ Sagitário   | 17°59′ Escorpião  | 9°01′ Leão         | 0.04″           | 0.00″ | 0.2″ / 0.2″ | 0.2″            | 0.28′                   |
| porto-alegre-1905      | 10°14′ Peixes      | 17°26′ Capricórnio | 15°08′ Áries      | 16°02′ Capricórnio | 0.24″           | 0.02″ | 0.0″ / 0.0″ | 0.0″            | 0.13′                   |
| manaus-2024-bissexto   | 10°53′ Peixes      | 10°28′ Escorpião   | 10°02′ Libra      | 8°17′ Câncer       | 0.07″           | 0.00″ | 1.7″ / 1.4″ | 1.7″            | 0.19′                   |

**Máximos:**

| Grandeza                            | Máximo medido                   | Tolerância |
| ----------------------------------- | ------------------------------- | ---------- |
| Planetas vs. JPL                    | **0,24″** (Urano, 1905)         | 18″        |
| Lua vs. JPL                         | **0,09″**                       | 36″        |
| ASC vs. oráculo                     | **1,7″**                        | 36″        |
| MC vs. oráculo                      | **1,4″**                        | 36″        |
| Cúspides vs. oráculo                | **1,7″**                        | 60″        |
| Planetas vs. Astronomy Engine       | **17,9″** (0,30′; Netuno, 2009) | 60″        |
| Signo, casa e aspecto (categóricos) | idênticos em todos os casos     | —          |

A diferença de ASC/MC/cúspides em 2024 (1,7″) é compatível com o UT1−UTC ignorado pelo Swiss Ephemeris (veja a seção 3).

**Desempenho local:**

- `calc_ut`: ~13 µs por corpo.
- Mapa completo: 1,6 ms na primeira chamada e 0,26 ms nas seguintes.
- Carga do módulo nativo: 11,7 ms na primeira chamada.

## 6. Testes

| Suíte                                 | Testes | Conteúdo                                                                                                                                    |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `domain/zodiac.test.ts`               | 8      | Normalização, separação angular, truncamento, limite de signo, casas (incluindo intervalo que cruza 0°)                                     |
| `domain/aspects.test.ts`              | 4      | Orbes, bônus de luminares, limite de ângulos, ASC×MC, aplicativo/separativo                                                                 |
| `engine/swiss-ephemeris.test.ts`      | 267    | 12 casos × (ΔT, 10 corpos vs. JPL, 10 corpos vs. Astronomy Engine, ASC/MC/cúspides vs. oráculo), data inexistente, polar, arquivos ausentes |
| `service/compute-natal-chart.test.ts` | 13     | Mapa completo, horário desconhecido, Placidus indefinido, limite de signo, retrogradação, 8 entradas inválidas                              |

## 7. Compatibilidade com a Vercel (sem deploy)

| Verificação                         | Resultado                                                                                                                                                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Binários pré-compilados do `sweph`  | linux-x64, linux-arm64, darwin-arm64 e win32-x64 (N-API). **Não há binário para macOS Intel**: nessas máquinas a instalação compila do zero e exige Python, make e um compilador.                                    |
| Requisito de glibc (linux-x64)      | Símbolos até `GLIBC_2.14`. A imagem atual da Vercel (Amazon Linux 2023, glibc 2.34) atende, segundo a documentação pública da plataforma; a confirmar num preview privado.                                           |
| Runtime                             | Node.js padrão. Com Cache Components não se usa `export const runtime`; o Edge (descontinuado) não carrega addons nativos.                                                                                           |
| `serverExternalPackages: ["sweph"]` | Aplicado: o addon é carregado com `require` do Node, sem bundling.                                                                                                                                                   |
| **Rastreamento do binário**         | ⚠️ **O rastreador do Next não detecta o `sweph.node`**, porque o `node-gyp-build` escolhe o arquivo em tempo de execução. Corrigido incluindo `node_modules/sweph/prebuilds/linux-*` em `outputFileTracingIncludes`. |
| **Rastreamento do projeto inteiro** | ⚠️ O `existsSync` com caminho dinâmico fazia o Turbopack incluir 245 arquivos (86 de `src/`). Corrigido com `/*turbopackIgnore: true*/`: o trace caiu para 132 arquivos, nenhum de `src/`.                           |
| Efemérides no pacote                | `ephe/sepl_18.se1` e `ephe/semo_18.se1` incluídos via `outputFileTracingIncludes`.                                                                                                                                   |
| **Simulação isolada**               | Build `output: "standalone"` numa **cópia** do projeto, que leva só os arquivos rastreados (80 MB): a rota respondeu 200 com o cálculo correto; 404 sem `SIDERA_ASTRO_POC=1`.                                        |
| Tamanho da função                   | Binários Linux (~1,6 MB) + efemérides (~1,7 MB): bem abaixo do limite de 250 MB descompactados da Vercel.                                                                                                            |
| Build na Vercel                     | Precisa dos `.se1`: o comando de build deve ser `npm run ephe:fetch && npm run build`. A configurar quando houver deploy.                                                                                            |

## 8. Dificuldades encontradas

1. **JPL Horizons, astro.com e geonames.org bloqueados** na rede da sessão. Substituídos pelo JPL DE421 (PyPI) para os planetas. Preço da licença e campos do GeoNames continuam a confirmar.
2. **Referência errada para datas antes de 1972** no primeiro gerador. O Skyfield interpretava o horário como UTC com segundos bissextos, deslocando o UT1 em até ~37 s; o ASC de 1905 divergiu 0,13°. Corrigido tratando a entrada como UT1 antes de 1972, a mesma convenção do Swiss Ephemeris. Isso vira regra para a Fase 02C.
3. **Fallback silencioso para Moshier** sem os arquivos `.se1`, e **troca silenciosa para Porfírio** nas latitudes polares. Ambos bloqueados no adapter e cobertos por testes.
4. **Empacotamento do binário nativo** e **rastreamento do projeto inteiro** no build (seção 7), ambos corrigidos.
5. O pacote `de421` do PyPI usa um formato antigo; foi preciso usar o `skyfield-data`, que traz o arquivo `de421.bsp` no formato SPICE.
6. O arquivo `finals2000A.all` do `skyfield-data` gera um aviso de expiração. Ele só afeta datas posteriores à última atualização do arquivo; os casos de referência estão cobertos.

## 9. Limitações e riscos

- **Licença AGPL:** enquanto não houver licença profissional, nenhum deploy público pode usar o motor.
  - **O repositório no GitHub está público** e agora depende de um componente AGPL. Recomendo avaliar torná-lo privado e definir explicitamente a licença do código do Sidera.
- **Fusos e horário local:** ainda não implementados (02C). O módulo recebe o instante já em UTC.
- **Horário aproximado** (`range`) e **intervalo da Lua para horário desconhecido** dependem da conversão de fuso (02C).
- **Faixa de datas:** o motor aceita de 1800 a 2399 (arquivos `_18`); o produto continua limitado a 1900 em diante pela validação da Fase 01. As referências DE421 cobrem 1900–2050.
- **Rede no `npm test`:** o `pretest` baixa os `.se1` se estiverem ausentes; ambientes sem acesso ao GitHub precisam dos arquivos no cache.
- **Rota de diagnóstico** `/api/dev/astro-poc`: existe no build, mas responde 404 sem a variável. Deve ser removida antes de qualquer deploy público ou na integração definitiva (02D).
