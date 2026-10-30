# Sidera — Fase 02C.1 · Consolidação da normalização

Data: 30/10/2026 · Escopo: cobertura internacional, controle da base de fusos, precisão de segundos no motor e datas civis inexistentes. Sem alterações visuais, sem persistência e sem deploy.

---

## 1. Problemas identificados e soluções

| #   | Problema                                                                                                                                                 | Solução                                                                                                                                                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Cobertura internacional limitada a cidades com ≥ 100 mil habitantes; nascidos em cidades menores no exterior não encontravam a localidade                | **Catálogo estendido offline** do GeoNames (cities1000): +128.913 localidades estrangeiras, com coordenadas e fuso IANA próprios. Busca com contexto "cidade, estado ou país". Sem serviço externo.                                                      |
| 2   | Runtime com **tzdb 2025b**; a versão oficial é a **2026f**, com correções no Brasil (1965 e 1966) e em mais 11 fusos usados pela base                    | Base **fixada em 2026f** via arquivos oficiais do ICU (`tzdata/2026f`, `ICU_TIMEZONE_FILES_DIR`); bloqueio quando a versão diverge; snapshot de regressão com as 757 transições brasileiras; ferramenta `npm run tz:diff`                                |
| 3   | O motor aceitava só minutos; a hora média local tem segundos (ex.: `15:06:28Z`)                                                                          | `UtcInstant.second` opcional (aceita fração, sem arredondar; recusa 60 e valores fora da faixa) + adaptador `utcInstantFromIso`                                                                                                                          |
| 4   | **Bug:** datas civis inteiramente puladas (Samoa, 30/12/2011; Kiritimati, 31/12/1994) eram **aceitas** com horário desconhecido, gerando um "dia" de 0 h | `localDayBounds` devolve `null`; a normalização recusa a data (`DATE_NONEXISTENT_IN_ZONE`) com qualquer precisão de horário                                                                                                                              |
| —   | Encontrados durante a implementação                                                                                                                      | O script de comparação truncava a saída (`process.exit` com pipe); o JSON de 7 MB importado como módulo deixava a primeira busca lenta (troca para `JSON.parse`); o acesso dinâmico a arquivos fazia o build rastrear `src/` inteiro (`turbopackIgnore`) |

## 2. Cobertura internacional

### Alternativas avaliadas

| Opção                                   | Decisão         | Motivo                                                                                                                                                                                                                                                          |
| --------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nominatim (OSM), API pública            | **Não adotada** | A [política de uso](https://operations.osmfoundation.org/policies/nominatim/) proíbe autocompletar e uso intensivo, limita a 1 req/s e não tem SLA; a cidade de nascimento seria enviada a terceiros (LGPD); bloqueado na rede desta sessão, então não testável |
| Photon (komoot), API pública            | **Não adotada** | Sem garantia de disponibilidade; mesmo problema de privacidade                                                                                                                                                                                                  |
| Geocodificadores pagos (Google, Mapbox) | **Não adotada** | Custo recorrente; fora do escopo do MVP                                                                                                                                                                                                                         |
| **GeoNames cities1000 offline**         | **Adotada**     | Mesma fonte e licença (CC BY 4.0) da base atual; mesmo gerador reproduzível; sem custo nem rede em produção                                                                                                                                                     |

### Implementação

- `places-world-extended.json`: 128.913 localidades (7,4 MB; 2,6 MB comprimido), em formato compacto (tabelas de regiões e fusos + linhas). Lido no servidor **sob demanda** com `JSON.parse`; a primeira busca leva ~0,9 s (inclui a carga), as seguintes ~0,3 s (inclui a espera de digitação e a ida e volta).
- **Fuso:** polígonos `geo-tz/all` na coordenada da própria localidade. **302** localidades com fuso disputado ficam **sem fuso** e são recusadas (`PLACE_INCOMPLETE`).
- **Busca com contexto:** "Venice, Itália", "Venice, Florida", "Santa Maria, RS" (estado/região, UF, código ou nome do país).
- **Sem substituição automática:** se a localidade não estiver no catálogo, a interface diz que o Sidera não calcula com segurança e **não sugere nem aplica outra cidade**.

### Limitação restante

Localidades estrangeiras com menos de ~1.000 habitantes (ou ausentes do GeoNames) continuam sem cobertura. A próxima alternativa seria um geocodificador próprio (Nominatim auto-hospedado ou Photon) ou um serviço pago com termos comerciais claros; nenhum se justifica no MVP.

## 3. Controle da base de fusos

### Versões

| Componente                             | Versão                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| Base embutida no Node 22.22 (ICU 77.1) | 2025b — **não usada**                                                         |
| **Base fixada no Sidera**              | **2026f** (IANA, 27/10/2026), arquivos ICU de `unicode-org/icu-data@6eac2f4d` |
| Referência independente nos testes     | Python `zoneinfo` + `tzdata` 2026.6 (= IANA 2026f)                            |

### Diferenças 2025b → 2026f (`npm run tz:diff -- runtime tzdata/2026f --all`)

27 dos 337 fusos da base de localidades mudaram entre 1900 e 2030:

- **Os 16 fusos brasileiros:**
  - o fim do horário de verão de 1965 passa de 31/03 00:00 para **31/03 24:00**, então o **dia 31/03/1965 inteiro** muda de UTC−3 para UTC−2;
  - o de 1966 passa de 01/03 00:00 para **01:00**.
- **Demais:**
  - Marrocos e Saara Ocidental (UTC permanente desde 20/09/2026);
  - Colômbia (1992) e Irã (1979);
  - Canadá: Edmonton, Vancouver e Winnipeg;
  - Cuba, Baja California (1953, 1961–75), Moldávia (2022+) e Irlanda (1925).

Exemplo verificado no navegador: **São Paulo, 31/03/1965, 12:00**. Com a 2025b o resultado seria `15:00 UTC`; com a 2026f é `14:00 UTC`. Sem a correção, haveria **1 h de erro** no instante, o que deslocaria o Ascendente em ~15°.

### Mecanismo

1. **Registro:**
   - `TZDB_EXPECTED_VERSION` em `src/features/birth-time/tzdb.ts`;
   - a versão efetiva (`process.versions.tz`) vai na `provenance` de cada normalização e aparece na conferência.
2. **Carregamento:** `scripts/with-tzdata.mjs` define `ICU_TIMEZONE_FILES_DIR` para `dev`, `build`, `start` e `test`. Arquivos conferidos por SHA-256 (`tzdata/README.md`).
3. **Bloqueio:** se a versão do processo for outra, `normalizeBirthAction` responde `TZDB_VERSION_MISMATCH` e registra o erro no log do servidor. Nunca converte com outra base.
4. **Regressão:** `tzdb.test.ts` compara as **757 transições** dos 16 fusos brasileiros (1900–2030) com um snapshot versionado. Qualquer mudança falha o teste; aceitar exige `npm test -- -u` e revisão do diff. O snapshot foi conferido contra a implementação independente (Python): **0 divergências**.
5. **Comparação entre versões:** `npm run tz:diff -- <A> <B> [--all]`, onde A e B são `runtime` ou um diretório com arquivos `.res`. Cada lado roda em processo separado.

### Produção (Vercel), a configurar no deploy

- Variável de ambiente `ICU_TIMEZONE_FILES_DIR=tzdata/2026f`.
- `tzdata/**` já está incluído no pacote da função (`outputFileTracingIncludes`).
- Sem a variável, a normalização fica **bloqueada**, e não incorreta.

### Limitações anteriores a 1970 (inalteradas)

- A IANA não garante precisão antes de 1970.
- No Brasil, os dados anteriores a ~1990 vêm em parte do atlas Shanks & Pottenger, e diferenças entre estados estão agrupadas em 16 zonas.
- O nome do tipo de horário (verão ou padrão) não existe no ICU para vários períodos antigos. Nesses casos o campo `daylightSaving` fica `null` ("indeterminado") e não é deduzido.
- Avisos `TZDB_PRE_1970` e `BRAZIL_PRE_1990_SOURCE` continuam ativos.

## 4. Precisão de segundos no motor

- `UtcInstant.second?: number` (0 ≤ s < 60, fração permitida). O campo é opcional, então chamadas antigas continuam válidas.
- Segundos inválidos (60, negativos, `NaN`) → `INVALID_DATE`. **Nenhum arredondamento.**
- `utcInstantFromIso("1910-01-01T15:06:28Z")` → `{ …, second: 28 }`.
- Novos casos de referência JPL DE421: `sao-paulo-1910-lmt-segundos` e `recife-2020-segundos`. Os 12 casos anteriores ficaram **idênticos**.
- **Evidência:** no caso de 1910, o Ascendente com segundos fica dentro da tolerância de 36″; **sem os 28 s, sai da tolerância**.

## 5. Datas civis inexistentes

| Caso                                        | Antes                                         | Agora                      |
| ------------------------------------------- | --------------------------------------------- | -------------------------- |
| Samoa (Apia), 30/12/2011, horário exato     | `TIME_NONEXISTENT` (mensagem sobre o horário) | `DATE_NONEXISTENT_IN_ZONE` |
| Samoa, 30/12/2011, horário **desconhecido** | **Aceito** (dia de 0 h)                       | `DATE_NONEXISTENT_IN_ZONE` |
| Samoa, 30/12/2011, aproximado               | `TIME_NONEXISTENT`                            | `DATE_NONEXISTENT_IN_ZONE` |
| Kiritimati, 31/12/1994                      | Aceito sem horário                            | `DATE_NONEXISTENT_IN_ZONE` |
| Samoa, 29/12 e 31/12/2011                   | Aceitos                                       | Aceitos                    |

## 6. Testes

**491 testes** (+80 em relação aos 411 da 02C), todos passando com a base 2026f.

| Suíte                                           | Novos | Conteúdo                                                                                                                            |
| ----------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `birth-time/tzdb.test.ts`                       | 5     | Versão fixada; snapshot das 757 transições brasileiras; fim do horário de verão em 2019 em todos os fusos; correções de 1965 e 1966 |
| `birth-time/zoned-time.test.ts`                 | +9    | 6 novos casos na referência independente (1965, 1966, Samoa, Kiritimati); dias pulados e vizinhos                                   |
| `birth-data/normalize.test.ts`                  | +5    | Samoa com horário exato, aproximado e desconhecido; dias vizinhos; Kiritimati                                                       |
| `birth-data/actions.test.ts`                    | +1    | Bloqueio quando a tzdb diverge                                                                                                      |
| `places/search.test.ts`                         | +4    | Catálogo estendido sem duplicatas; Sintra; Venice (homônimas e contexto); fusos válidos ou ausentes                                 |
| `astrology/domain/utc-instant.test.ts`          | 6     | ISO → instante com segundos e fração; formatos recusados                                                                            |
| `astrology/engine/swiss-ephemeris.test.ts`      | +46   | 2 casos com segundos vs. JPL DE421, oráculo e Astronomy Engine; JD exato com segundos; Ascendente sem segundos sai da tolerância    |
| `astrology/service/compute-natal-chart.test.ts` | +4    | Segundos 60, negativo e `NaN` recusados; instante normalizado de 1910 aceito                                                        |

## 7. Fontes de dados (versões)

| Fonte              | Versão                                                                    |
| ------------------ | ------------------------------------------------------------------------- |
| IANA tzdb (ICU)    | 2026f — `unicode-org/icu-data@6eac2f4d`                                   |
| Municípios do IBGE | `kelvins/municipios-brasileiros@503e2f70`                                 |
| GeoNames           | `all-the-cities@3.1.0`, `cities.json@1.1.65`                              |
| Polígonos de fuso  | `geo-tz@8.1.10` (timezone-boundary-builder)                               |
| Referências        | Skyfield 1.55 + JPL DE421 (`skyfield-data` 7.0.0); Python `tzdata` 2026.6 |
