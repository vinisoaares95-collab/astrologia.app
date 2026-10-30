# Sidera — Fase 02C · Localização e fusos históricos

Data: 30/10/2026 · Escopo: normalização dos dados de nascimento, busca de cidades e conversão de horário local para UTC. Não chama o motor astrológico, não persiste dados e não faz deploy.

---

## 1. Fontes de dados e licenças

| Dado                                                                       | Fonte                                                                                                                                                                              | Licença                                                  | Uso                               |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------- |
| 5.571 municípios brasileiros (nome, UF, código IBGE, coordenadas)          | IBGE, via [kelvins/municipios-brasileiros](https://github.com/kelvins/municipios-brasileiros), revisão `503e2f70`                                                                  | MIT (dados públicos do IBGE)                             | Base brasileira                   |
| 4.288 cidades estrangeiras (≥ 100 mil habitantes, mais capitais nacionais) | [GeoNames](https://www.geonames.org), via npm `all-the-cities@3.1.0` (população) e `cities.json@1.1.65` (nomes das regiões)                                                        | **CC BY 4.0**: exige atribuição                          | Base internacional                |
| Fuso IANA de cada localidade                                               | Polígonos do [timezone-boundary-builder](https://github.com/evansiroky/timezone-boundary-builder), via `geo-tz@8.1.10` (conjunto **completo**, `geo-tz/all`, válido antes de 1970) | Código MIT; dados ODbL (OpenStreetMap): exige atribuição | Fuso por coordenada               |
| Zona IANA por estado brasileiro                                            | IANA tzdb `zone1970.tab`                                                                                                                                                           | Domínio público                                          | Conferência dos fusos brasileiros |
| Regras históricas de fuso                                                  | IANA tzdb no ICU do Node.js (tzdata **2025b**, ICU 77.1)                                                                                                                           | Domínio público                                          | Conversão local → UTC             |
| Nomes em português de cidades estrangeiras                                 | Lista curada (`scripts/geo/exonyms-pt.json`, 54 entradas)                                                                                                                          | —                                                        | "Lisboa", "Nova York", "Tóquio"…  |

**Atribuição:** o texto "Localidades: IBGE e GeoNames (CC BY 4.0). Fusos: IANA tzdb e OpenStreetMap (ODbL)." aparece sob o campo de cidade (`src/features/places/attribution.ts`).

**Ferramentas de referência, fora do projeto** (apenas para gerar as expectativas dos testes): Python `zoneinfo` com o pacote `tzdata` 2026.6 (Apache-2.0).

### Por que não importar uma base global no PostgreSQL

O MVP atende sobretudo pessoas nascidas no Brasil. A base completa do GeoNames tem milhões de registros; para este público, os **5.571 municípios** cobrem 100% do Brasil, e as **4.288 cidades estrangeiras** grandes cobrem a maioria dos nascimentos no exterior.

O resultado são ~1,5 MB de JSON estático, carregados **só no servidor**. A busca é feita em memória, em milissegundos, sem banco e sem serviço externo. Migrar para o PostgreSQL (com `pg_trgm`) só se justifica se a cobertura internacional precisar crescer.

## 2. Arquitetura

```
src/features/
  places/                         # LOCALIZAÇÃO
    data/places-br.json           #   gerado — não editar à mão
    data/places-world.json
    data/places-meta.json         #   fontes, versões, contagens, relatório
    types.ts                      #   PlaceRecord, PlaceSummary
    search.ts                     #   busca pura (acentos, nomes alternativos, ranking)
    repository.ts                 #   server-only: carrega a base e indexa
    actions.ts                    #   Server Actions: searchPlacesAction, getPlaceAction
    attribution.ts
  birth-time/                     # TEMPO
    types.ts                      #   LocalDateTime, ResolvedInstant, LocalTimeResolution
    zoned-time.ts                 #   resolveLocalTime, localDayBounds, clockBoundInstant…
  birth-data/                     # NORMALIZAÇÃO (orquestra localização + tempo)
    contract.ts                   #   contrato tipado de entrada e saída
    parse.ts                      #   DD/MM/AAAA e HH:MM (cliente e servidor)
    messages.ts                   #   mensagens únicas de validação
    normalize.ts                  #   normalizeBirthData (pura; dependências injetadas)
    actions.ts                    #   Server Action normalizeBirthAction
    validate-birth-data.ts        #   validação imediata no navegador
    format.ts                     #   formatação para conferência
    demo-cases.ts                 #   casos fictícios de verificação
    components/                   #   PlaceCombobox, TimePrecisionField, NormalizationReview
    birth-data-form.tsx
  astrology/                      # CÁLCULO (Fase 02B) — não é chamado nesta fase
scripts/geo/build-places.mjs      # gerador reproduzível da base de localidades
scripts/reference/generate_zoneinfo_reference.py
```

**Responsabilidades separadas:**

- `places` não sabe nada de tempo.
- `birth-time` não sabe nada de cidades.
- `normalize` só combina os dois.

Nenhum desses módulos importa o motor astrológico ou componentes visuais. A conversão usa sempre o fuso **explícito**, via `Intl`, e nunca depende do fuso do computador.

### Como o fuso de cada município é definido

1. Para 25 UFs, a zona vem da tabela oficial `zone1970.tab` (ex.: PE → `America/Recife`, MT → `America/Cuiaba`). Os polígonos do OpenStreetMap concordaram em **100%** dos 5.365 municípios dessas UFs (0 divergências).
2. **Pará** (rio Xingu: `Belem` × `Santarem`) e **Amazonas** (linha Tabatinga–Porto Acre: `Manaus` × `Eirunepe`) têm divisões internas, decididas pelos polígonos: 119 Belém, 25 Santarém, 56 Manaus, 6 Eirunepé.
3. Fernando de Noronha → `America/Noronha`.

⚠️ **A coluna `fuso_horario` do dataset de municípios não é usada.** Ela agrupa por deslocamento atual (coloca Recife, Salvador e Fortaleza em `America/Sao_Paulo`) e produziria horários UTC errados para datas com regras de horário de verão diferentes.

**Localidades com fuso disputado:** 15 cidades de Xinjiang (China) caem em dois fusos ao mesmo tempo (`Asia/Urumqi` e `Asia/Shanghai`). Ficam na base **sem fuso**, e a normalização as recusa com `PLACE_INCOMPLETE`.

## 3. Contratos (`src/features/birth-data/contract.ts`)

**Entrada (`BirthDataInput`):**

- `date`: `"DD/MM/AAAA"`.
- `time`, um de três formatos:
  - `{ precision: "exact", value: "HH:MM" }`;
  - `{ precision: "approximate", value, marginMinutes: 15 | 30 | 60 | 120 }`;
  - `{ precision: "unknown" }`.
- `placeId`: id escolhido na busca (`"ibge:2611606"`, `"geonames:5128581"`). **Nunca texto livre.**
- `occurrence?`: `"earlier" | "later"`, só quando a pessoa responde a um horário duplicado.

**Saída (`NormalizationResult`):**

- **`{ status: "ok", birth: NormalizedBirth }`**:
  - `place`: id, rótulo inequívoco, região, país, coordenadas, `timeZone` (IANA).
  - `localDate`.
  - `time`, conforme a precisão:
    - exato: horário local + instante;
    - aproximado: horário local + instante + `earliest`/`latest` em UTC;
    - desconhecido: `dayStart`/`dayEndExclusive` + `noonReference`.
  - Cada instante (`ResolvedInstant`) traz `utc` (ISO 8601, com segundos), `offsetSeconds`, `offsetLabel` e `daylightSaving: true | false | null`.
  - `warnings` e `provenance` (versão da tzdb e fonte da localidade).
- **`{ status: "needs-choice", localTime, options: [earlier, later] }`**: horário duplicado; nada foi escolhido.
- **`{ status: "invalid", issues: [{ field, code, message, suggestion? }] }`**.

**Códigos de problema:** `DATE_REQUIRED`, `DATE_FORMAT`, `DATE_NONEXISTENT`, `DATE_BEFORE_MIN`, `DATE_FUTURE`, `TIME_REQUIRED`, `TIME_FORMAT`, `TIME_NONEXISTENT`, `MARGIN_INVALID`, `PLACE_REQUIRED`, `PLACE_NOT_FOUND`, `PLACE_INCOMPLETE`.

**Avisos:** `TZDB_PRE_1970`, `BRAZIL_PRE_1990_SOURCE`, `LOCAL_MEAN_TIME`, `DAYLIGHT_SAVING`, `UTC_DATE_DIFFERS`, `AMBIGUITY_RESOLVED_BY_USER`, `APPROXIMATE_RANGE_HAS_TRANSITION`, `UNKNOWN_TIME_NOON_REFERENCE`.

## 4. Exemplos reais de normalização

Executados no navegador, com as Server Actions reais. O navegador estava configurado em **inglês e no fuso de Tóquio**, para provar a independência do cliente.

| Entrada                                     | Resultado                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Recife — PE, 15/01/1986, 14:30              | `America/Recife`, **UTC−02:00 (horário de verão)** → `15/01/1986 16:30 UTC`                |
| Nova York, 29/09/2001, 22:20                | `America/New_York`, UTC−04:00 (verão) → **`30/09/2001 02:20 UTC`** (data muda)             |
| Bom Jesus — PI, 12/05/1990, 14:30 ± 30 min  | `America/Fortaleza`, janela `17:00 → 18:00 UTC`                                            |
| São Paulo, 02/11/1985, horário desconhecido | Dia local em UTC: `03:00 → 03/11 02:00` (a meia-noite não existiu); meio-dia = `14:00 UTC` |
| São Paulo, 01/01/1910, 12:00                | **UTC−03:06:28 (hora média local)** → `15:06:28 UTC`                                       |
| Rio Branco, 23/06/2008 × 25/06/2008, 12:00  | UTC−05:00 × UTC−04:00 (Lei 11.662/2008)                                                    |
| Kashgar (China)                             | `PLACE_INCOMPLETE`: fronteiras indicam `Asia/Urumqi` e `Asia/Shanghai`                     |

## 5. Cenários de ambiguidade

| Situação                                                              | Comportamento                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cidades homônimas** ("Bom Jesus": PI, PB, RN, RS, SC)               | Todas listadas com UF e país; a pessoa escolhe. **Nunca há seleção automática, nem com um único resultado.** Escolhas diferentes levam a fusos diferentes (PI → `Fortaleza`; RS → `Sao_Paulo`, com horário de verão em 2015). |
| **Horário duplicado** (SP, 14/03/1986, 23:30)                         | `needs-choice`, com "Primeira ocorrência (UTC−02:00) — ainda no horário de verão" e "Segunda ocorrência (UTC−03:00) — já no horário padrão". O botão principal some até a escolha.                                            |
| **Horário inexistente** (SP, 02/11/1985, 00:30)                       | Recusado: "os relógios avançaram 60 minutos (de UTC−03:00 para UTC−02:00); o horário 00:30 não existiu. Confira a certidão: o horário equivalente seria 01:30." A sugestão **não é aplicada** automaticamente.                |
| **Horário aproximado com transição** (SP, 14/03/1986, 22:30 ± 60 min) | Janela calculada pelo **relógio**: de 21:30 (UTC−2) até a **segunda** ocorrência de 23:30 (UTC−3), ou seja, `23:30Z → 02:30Z`, com aviso.                                                                                     |
| **Fuso disputado** (Xinjiang)                                         | Recusado; nenhum fuso é escolhido.                                                                                                                                                                                            |
| **Dia pulado** (Samoa, 30/12/2011)                                    | Qualquer horário do dia é inexistente.                                                                                                                                                                                        |
| **Horário de verão sem metadados** (ex.: 1963)                        | `daylightSaving: null`, exibido como "tipo de horário indeterminado na base". Não há heurística.                                                                                                                              |

## 6. Testes

**411 testes** no total (+90 em relação aos 321 da Fase 02B), todos passando. A suíte passou também com o fuso do sistema em `Pacific/Kiritimati`, `America/Los_Angeles` e `Asia/Kathmandu`.

| Suíte                                                       | Testes | Destaques                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `places/search.test.ts`                                     | 11     | Base completa com fuso válido; fusos por região conferidos contra a tzdb (incluindo Pará, Amazonas e Noronha); homônimas; acentos; nomes alternativos; Kashgar sem fuso                                                                                        |
| `birth-time/zoned-time.test.ts`                             | 45     | **29 casos vs. Python zoneinfo + tzdata** (referência independente do ICU); decretos 91.698/1985 e 9.772/2019 e Lei 11.662/2008; hora média local; limites do dia (23 h, 24 h, 25 h); 3 estados de horário de verão; **mesmo resultado com 4 valores de `TZ`** |
| `birth-data/normalize.test.ts`                              | 21     | Todos os cenários obrigatórios (cidade comum, homônimas, mudança histórica, verão, inexistente, duplicado, exterior, virada de data, datas inválidas, desconhecido, aproximado, localidade insuficiente)                                                       |
| `birth-data/actions.test.ts`                                | 6      | Entrada não confiável vinda do navegador; integração com a base real                                                                                                                                                                                           |
| `birth-data/birth-data-form.test.tsx`                       | 6      | Validação, seleção explícita, conferência, escolha de ocorrência, horário inexistente, horário desconhecido                                                                                                                                                    |
| `birth-data/format.test.ts` + `validate-birth-data.test.ts` | 9      | Formatação e validação no navegador                                                                                                                                                                                                                            |

**Referência independente:** a tabela do Python `zoneinfo` usa outra implementação e outra cópia da base IANA (`tzdata` 2026.6, contra a tzdata 2025b do ICU). Para o Brasil, os casos também foram conferidos com a legislação.

## 7. Limitações conhecidas

- **Base histórica:**
  - A IANA tzdb não garante precisão antes de 1970 (aviso `TZDB_PRE_1970`).
  - Para o Brasil, o próprio arquivo `southamerica` diz que os dados anteriores a ~1990 vêm do atlas Shanks & Pottenger, "com muitos erros e sem fontes"; e que diferenças entre estados (ex.: o horário de verão de 1963 começou em datas diferentes) estão agrupadas em 16 zonas (aviso `BRAZIL_PRE_1990_SOURCE`).
  - A interface sempre mostra o deslocamento aplicado, para conferência.
- **Versão da tzdb:** depende do Node usado no deploy (hoje 2025b). Não houve mudanças brasileiras desde 2019.
- **Cobertura internacional:** só cidades com ≥ 100 mil habitantes e capitais. Quem nasceu numa cidade menor no exterior deve escolher a grande cidade mais próxima: o fuso costuma ser o mesmo, mas as coordenadas mudam o Ascendente e as casas. Isso fica documentado, sem aviso automático por enquanto.
- **Nomes alternativos:** os dados disponíveis do GeoNames quase não têm nomes alternativos. Os exônimos em português vêm de uma lista curada de 54 cidades; Veneza ficou fora da base (51 mil habitantes, abaixo do corte).
- **Coordenadas:** sede do município (IBGE) ou ponto do GeoNames. Para municípios extensos, o local exato do nascimento pode diferir.
- **Ordenação da busca:** usa população quando disponível (1.929 municípios casados com o GeoNames); os demais aparecem em ordem alfabética, sempre com UF.
- **Hora média local:** o instante UTC tem segundos (ex.: `15:06:28Z`). O contrato do motor da 02B aceita só minutos; a integração (02D) precisa incluir os segundos.
- **Rede:** o geonames.org estava bloqueado na sessão; os dados do GeoNames vieram de pacotes npm que os redistribuem (CC BY 4.0).

## 8. Regenerar a base

```bash
mkdir -p .geo-tools && cd .geo-tools && npm init -y && npm pkg set overrides.tslib=2.8.1 && npm i --save-exact geo-tz@8.1.10 all-the-cities@3.1.0 cities.json@1.1.65
```

```bash
GEO_TOOLS_DIR=.geo-tools node scripts/geo/build-places.mjs
```

A geração é determinística: regenerar produziu arquivos com hashes idênticos.
