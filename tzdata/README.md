# Base de fusos horários (IANA tzdb) fixada

O Node.js traz a tzdb embutida no ICU, numa versão que depende da versão do
Node (o Node 22.22 traz a **2025b**). Para que os resultados não mudem em
silêncio a cada atualização do Node, o Sidera fixa uma versão explícita e
carrega os arquivos oficiais do ICU pela variável `ICU_TIMEZONE_FILES_DIR`.

| Item        | Valor                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Versão IANA | **2026f** (publicada em 27/10/2026)                                                                     |
| Origem      | `unicode-org/icu-data`, `tzdata/icunew/2026f/44/le/`, commit `6eac2f4d349d9f4a0825103bb41845d8e5ab7add` |
| Licença     | Unicode License v3 (`2026f/LICENSE`)                                                                    |

SHA-256:

```
cc9d283bb2797813a17c00d80c2a86d27bc80da5e1cd24da846e8b4af6dbd860  metaZones.res
5e77ce5afb7374a36cbe3be197d0a6deaa919e6f672c2a372f7a9d91b7f8534f  timezoneTypes.res
377691d021bbdd7012806d8188412d13e587a76b64ecc7b79fec4dc36a419deb  windowsZones.res
d9382726ee8a499514310e63a9e97f1dbdd7fc2db328e1a785dde05f2afbb7e6  zoneinfo64.res
```

Os scripts `dev`, `build`, `start` e `test` passam por `scripts/with-tzdata.mjs`,
que define a variável. Em produção (Vercel), a variável precisa ser
configurada no projeto com **caminho absoluto** (exigência do ICU) e os arquivos incluídos na função
(`outputFileTracingIncludes` em `next.config.ts`).

## Atualizar para uma nova versão

1. Comparar as transições: `npm run tz:diff -- <dir-da-nova-versão>` (veja
   `docs/fase-02c1-consolidacao.md`).
2. Revisar as diferenças relevantes (especialmente fusos brasileiros).
3. Copiar os arquivos para `tzdata/<versão>/`, atualizar `TZDB_EXPECTED_VERSION`
   em `src/features/birth-time/tzdb.ts` e regenerar o arquivo de regressão
   `src/features/birth-time/__fixtures__/brazil-transitions.json`.
