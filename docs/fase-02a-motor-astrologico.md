# Sidera — Fase 02A · Análise técnica e arquitetura do motor astrológico

Data: 30/10/2026 · Escopo: pesquisa, auditoria e planejamento (nenhum código, pacote ou configuração foi alterado)

---

## Decisões aprovadas (revisão da Fase 02A)

Registradas após a revisão do documento; prevalecem sobre as recomendações abaixo quando houver diferença.

1. Swiss Ephemeris com o pacote `sweph` adotado **provisoriamente** como primeira opção.
2. **A licença profissional não será adquirida por enquanto.** Uso restrito a desenvolvimento e testes internos, respeitando a AGPL. **Nenhum serviço público com Swiss Ephemeris** pode ser ativado sem resolver antes o licenciamento.
3. Motor isolado por uma interface (`EphemerisProvider`) que permita trocar a implementação.
4. Astrologia ocidental tropical, casas Placidus.
5. Orbes propostos aceitos provisoriamente, guardados como configuração ajustável e versionada.
6. GeoNames e IANA TZDB para a futura localização e os fusos históricos.
7. Nenhum dado pessoal persistido nesta fase.
8. Registro deste documento em `docs/` aprovado.
9. Horários desconhecidos e aproximados previstos na arquitetura, sem inventar posições astrológicas.

**Correção técnica posterior (Fase 02B):** com Cache Components ativo, o Next.js 16 **não aceita** `export const runtime` em rotas. O Node.js já é o runtime padrão e o Edge foi descontinuado. Onde este documento menciona `runtime = "nodejs"`, entenda "runtime Node.js padrão, sem a exportação".

---

## Sumário executivo

- **Motor recomendado:** Swiss Ephemeris via pacote npm `sweph` (addon nativo N-API, tipos TypeScript inclusos), executado **apenas no servidor** (runtime Node.js da Vercel), com os arquivos de efemérides `sepl_18.se1` e `semo_18.se1` empacotados no deploy.
- **Licença:** comprar a **Swiss Ephemeris Professional License** antes de qualquer serviço público. Sem ela, o uso cai na AGPL‑3.0, que exigiria abrir o código-fonte de todo o Sidera para os usuários do serviço.
- **Validação independente:** usar o JPL Horizons como referência para os planetas, implementar as fórmulas de livro-texto como oráculo de teste para Ascendente, Meio do Céu e casas, e usar o Astronomy Engine (MIT) como checagem cruzada. Os dois últimos ficam só no ambiente de testes.
- **Plano B, sem custo de licença:** Astronomy Engine (MIT, TypeScript puro, ±1′ de precisão) com Ascendente, Meio do Céu e Placidus implementados por nós. É viável, mas transfere para o nosso código o risco de correção das casas.
- **Localização e fusos:** base local de cidades importada do GeoNames (CC BY 4.0) para o PostgreSQL, cada cidade com seu fuso IANA. A conversão de hora local para UTC usa a base de fusos IANA embutida no runtime, por meio de um módulo próprio que trata explicitamente horários inexistentes e ambíguos. Sem serviços pagos.
- **Dados insuficientes:** sem horário confiável, o sistema **não calcula** Ascendente, Meio do Céu nem casas. Isso é regra do contrato de dados, não da interface.

---

## 1. Diagnóstico da arquitetura atual

| Camada                                                                                               | Estado                                                                                                                                                                                   | Relevância para a Fase 02                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js 16.4.3 (App Router, Cache Components, Partial Prefetching), React 19.3, TS 5.9, Tailwind 4.3 | Estável; build com 11 rotas estáticas                                                                                                                                                    | O cálculo entra como **Route Handler/Server Action no runtime Node.js**. Nada roda no navegador.                                                              |
| Prisma 7.10.1 + `@prisma/adapter-pg`                                                                 | `schema.prisma` só com `Product`; `src/lib/db.ts` cria o cliente sob demanda e marca `server-only`                                                                                       | Pronto para a tabela de cidades (`Place`). Dados pessoais continuam fora até a política de LGPD.                                                              |
| `src/features/birth-data/`                                                                           | `input-masks.ts` (DD/MM/AAAA, HH:MM 24 h), `validate-birth-data.ts` (valida dia/mês; datas futuras e anteriores a 1900), `birth-data-form.tsx` (campos, interruptor “não sei o horário”) | **Reaproveitável integralmente.** A validação vira a primeira etapa da normalização no servidor. O campo de cidade em texto livre será substituído por busca. |
| `src/components/visuals/mandala.tsx`                                                                 | Decorativa: escala de graus, 12 setores com símbolos dos elementos, hexagrama/dodecagrama; helpers `polar()`, `arc()` e `star()`                                                         | A **geometria** é reaproveitável (helpers e estilo). O conteúdo atual não representa nenhum mapa e precisa continuar rotulado como ornamento.                 |
| `src/features/report/`                                                                               | Abas de capítulos (`ReportExplorer`) e oferta                                                                                                                                            | O conteúdo editorial já separa a origem: “Cálculo + símbolo”, “Observação + símbolo”.                                                                         |
| Design system (`components/ui`)                                                                      | `Badge`, `Callout` (tons `demo`/`info`), `Stat`, `Card`, `ActionDock` etc.                                                                                                               | Avisos de precisão (“Ascendente indisponível sem horário”) usam `Callout tone="info"`; dados técnicos usam `Stat`.                                            |
| Testes                                                                                               | Vitest + Testing Library, 29 testes                                                                                                                                                      | Ganha suítes de dados de referência (fixtures JSON) e testes de propriedade.                                                                                  |
| Runtime de fusos                                                                                     | Node 22.22, ICU 77.1, **tzdata 2025b**                                                                                                                                                   | Já resolve o histórico brasileiro (verificado nesta auditoria; ver seção 6).                                                                                  |

**Pontos de atenção:**

- A validação atual roda só no cliente. A Fase 02 precisa repetir a validação no servidor; nunca confiar no cliente.
- `robots: noindex` e o rótulo de protótipo continuam enquanto não houver cálculo validado.
- O “Fotos anotadas*” da tela de relatório depende da fase de imagem, não desta.

---

## 2. Estado do Git

Verificado em 30/10/2026:

- **Branch:** `claude/upbeat-pasteur-x5y1k2`, sincronizada com `origin` (0 commits à frente ou atrás). É também a branch padrão (HEAD) do repositório remoto.
- **Commit `145592a`:** presente localmente e no GitHub (`145592a736a314e1a11b40f307336d0095f5de98`). Histórico: `15be9ca` → `2657981` → `145592a`.
- **`mandala.tsx` e `birth-data-form.tsx`:** **sem alterações não commitadas** (`git diff HEAD` vazio).
- **Árvore de trabalho:** limpa, sem stash.
- **Recomendação:** criar uma branch `main` a partir de `145592a` e fazer a Fase 02 em branches de feature com pull requests. Não executei nada disso.

---

## 3. Comparação dos motores

### 3.1 Candidatos avaliados

| Critério              | **Swiss Ephemeris** (`sweph`)                                                                                                                                | **Astronomy Engine** (`astronomy-engine`)                         | **Moshier** (`circular-natal-horoscope-js`)                                             | **astronomia** (Meeus/VSOP87)                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Precisão              | Referência do setor. Com os arquivos `.se1`, deriva das efemérides do JPL (alta precisão; ver nota). Modo Moshier embutido sem arquivos, com precisão menor. | ±1′ (declarado pelo autor)                                        | Moshier: segundos de arco para planetas (estimado)                                      | VSOP87 completo é muito preciso; Plutão e Lua com algoritmos de Meeus |
| Sol → Plutão, Lua     | ✅                                                                                                                                                           | ✅                                                                | ✅                                                                                      | ✅ (Plutão: Meeus cap. 37, válido de 1885 a 2099)                     |
| ASC / MC              | ✅ `houses_ex`                                                                                                                                               | ❌ Implementar (há tempo sideral e obliquidade como insumos)      | ✅                                                                                      | ❌ Implementar                                                        |
| Placidus              | ✅ (e mais de 20 sistemas)                                                                                                                                   | ❌ Implementar                                                    | ✅ (7 sistemas)                                                                         | ❌ Implementar                                                        |
| Aspectos              | ❌ Implementar (trivial)                                                                                                                                     | ❌ Implementar                                                    | ✅ (orbes configuráveis)                                                                | ❌ Implementar                                                        |
| Retrogradação         | ✅ (velocidade)                                                                                                                                              | Derivar por diferença finita                                      | ✅                                                                                      | Derivar                                                               |
| Node / TS / Next      | Addon nativo N-API, `index.d.ts` incluso; precisa do runtime **Node.js** (não Edge) e de `serverExternalPackages`                                            | TS puro, zero dependências, roda em qualquer runtime              | JS + tipos; depende de `moment`, `moment-timezone` e `tz-lookup`                        | JS sem tipos oficiais                                                 |
| Vercel                | Viável: binários pré-compilados via `node-gyp-build`, ou compilação no build. Exige rodar um protótipo de deploy antes.                                      | Trivial                                                           | Trivial                                                                                 | Trivial                                                               |
| Binários e arquivos   | Binário nativo + arquivos `.se1` (≈ 2 MB para 1800–2399; conferir) via `outputFileTracingIncludes`                                                           | Nenhum                                                            | Nenhum                                                                                  | Nenhum                                                                |
| Manutenção            | Biblioteca C mantida pela Astrodienst desde 1997. O `sweph` 2.10.3‑8 foi publicado em ago/2026.                                                              | v2.1.19, última publicação em dez/2023 (estável, pouca atividade) | v1.1.0, última publicação em abr/2022; dependência `moment` em modo legado              | v4.2.0, ago/2025                                                      |
| Licença               | **AGPL‑3.0 ou licença profissional paga** (ver seção 5)                                                                                                      | **MIT**                                                           | Unlicense (a parte Moshier deriva de código C de Moshier; verificar a cadeia de origem) | MIT                                                                   |
| Complexidade para nós | Baixa em matemática, média em infraestrutura (nativo)                                                                                                        | Média-alta: implementar e validar ASC/MC/Placidus                 | Baixa, mas biblioteca parada e de autoria única                                         | Alta                                                                  |

**Notas:**

- **Precisão do Swiss Ephemeris:** os valores exatos, tanto com arquivos `.se1` quanto no modo Moshier, estão na documentação da Astrodienst (`astro.com/swisseph`). O domínio está **bloqueado na rede desta sessão**, então não pude confirmar os números. Em qualquer caso, a precisão é ordens de grandeza superior ao necessário para exibir graus e minutos.
- **WebAssembly:** existem pacotes WASM (`sweph-wasm`, AGPL‑3.0; `@fusionstrings/swisseph-wasm`, que se declara MIT mas “implica conformidade com a licença do Swiss Ephemeris”). Eles evitam o binário nativo, mas não mudam o licenciamento e são menos maduros. Ficam como alternativa caso o binário nativo falhe na Vercel.

### 3.2 O que cada opção entrega e o que precisaremos implementar

| Item                                                                    | Swiss Ephemeris fornece              | Implementamos                                                    |
| ----------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------- |
| Longitude eclíptica aparente geocêntrica (equinócio verdadeiro da data) | ✅ `calc_ut` com flags padrão        | —                                                                |
| Velocidade e retrogradação                                              | ✅ (`SEFLG_SPEED`)                   | Regra “R” quando a velocidade é menor que 0                      |
| ΔT (TT − UT)                                                            | ✅ automático                        | —                                                                |
| ASC, MC, cúspides Placidus, ARMC                                        | ✅ `houses_ex(jd_ut, lat, lon, 'P')` | Tratar o erro em latitudes polares                               |
| Signo, grau e minuto                                                    | —                                    | Função pura: `floor(lon/30)`, grau truncado                      |
| Casa de cada planeta                                                    | ✅ `house_pos`                       | Ou cálculo próprio por intervalo entre cúspides (ambos testados) |
| Aspectos e orbes                                                        | —                                    | Função pura sobre longitudes e velocidades                       |
| Hora local → UTC, fuso histórico                                        | —                                    | Módulo `time/` (seção 6)                                         |
| Interpretação                                                           | —                                    | Camada separada (fase de IA)                                     |

### 3.3 Fontes

- Swiss Ephemeris, licença dupla (AGPL ou Professional; a escolha deve ser feita antes de distribuir ou ativar um serviço público): https://github.com/aloistr/swisseph/blob/master/LICENSE
- Página oficial e preços: https://www.astro.com/swisseph/swephinfo_e.htm e https://www.astro.com/swisseph/swephprice_e.htm (bloqueados nesta sessão; conferir no navegador)
- Contrato da licença profissional (modelo que cita CHF 700, projetos ilimitados, validade de 6 anos): https://www.astro.com/swisseph/secont_e.pdf
- `sweph` (N-API; AGPL‑3.0 a partir da 2.10.1; LGPL‑3.0 para quem tem a licença profissional): https://github.com/timotejroiko/sweph
- Astronomy Engine (MIT, ±1′, Plutão incluso, `Ecliptic()` converte para eclíptica verdadeira da data): https://github.com/cosinekitty/astronomy
- CircularNatalHoroscopeJS (Unlicense, Moshier, 7 sistemas de casas): https://github.com/0xStarcat/CircularNatalHoroscopeJS
- Pacotes WASM: https://www.jsdelivr.com/package/npm/sweph-wasm e https://jsr.io/@fusionstrings/swisseph-wasm
- Metadados npm (versões, licenças, datas) consultados via `npm view` nesta auditoria.

---

## 4. Recomendação tecnológica

**Principal: Swiss Ephemeris (`sweph`) com Professional License, no servidor (runtime Node.js), com os arquivos `sepl_18.se1` e `semo_18.se1`.**

Justificativa:

1. **Precisão e confiança.** É a base de grande parte do software astrológico profissional. ASC, MC e Placidus vêm de código testado há décadas. Reduz o maior risco técnico do produto: errar casas e ângulos.
2. **Menos código crítico nosso.** Implementamos só o que é trivial e testável (signos, aspectos, fusos).
3. **Custo baixo e previsível.** O contrato-modelo indica CHF 700 para projetos ilimitados, com validade de 6 anos (confirmar valor vigente). Para um produto comercial, é menor que o custo de validar uma implementação própria de casas.
4. **Compatível com a arquitetura.** Fica isolado atrás de uma interface `EphemerisProvider`, no servidor, sem tocar nos componentes visuais.

**Ferramentas de validação (apenas em testes):**

- **JPL Horizons:** referência independente para as posições planetárias.
- **Fórmulas de livro-texto** (Meeus, _Astronomical Algorithms_) implementadas em TS como oráculo de ASC/MC/Placidus.
- **Astronomy Engine:** checagem cruzada automática de longitudes planetárias com tolerância de 1′.

**Plano B:** se a licença não for adquirida ou o binário nativo se mostrar inviável na Vercel, usar o Astronomy Engine em produção com ASC/MC/Placidus próprios, validados pela mesma bateria de testes. A interface `EphemerisProvider` permite a troca sem afetar o restante.

**Descartadas como principal:**

- **CircularNatalHoroscopeJS:** sem atividade desde 2022, dependência `moment` e fuso resolvido internamente sem controle sobre horários ambíguos.
- **astronomia:** exigiria implementar tudo, com Plutão limitado a 1885–2099.

---

## 5. Licenciamento comercial

| Opção                            | Obrigações                                                                                                                                   | Compatível com o Sidera fechado?                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Swiss Ephemeris sob **AGPL‑3.0** | O projeto inteiro sob AGPL ou licença compatível. Como é um serviço em rede, os **usuários têm direito ao código-fonte** do serviço.         | ❌ Não, a menos que vocês aceitem abrir o código. |
| Swiss Ephemeris **Professional** | Assinar o contrato com a Astrodienst e pagar (modelo: CHF 700, projetos ilimitados, 6 anos). Com ela, o `sweph` pode ser usado sob LGPL‑3.0. | ✅                                                |
| Astronomy Engine **MIT**         | Manter o aviso de copyright                                                                                                                  | ✅                                                |
| GeoNames **CC BY 4.0**           | Atribuição visível (ex.: rodapé ou página “Créditos”)                                                                                        | ✅                                                |
| tzdb (IANA)                      | Domínio público                                                                                                                              | ✅                                                |
| `geo-tz` (opcional)              | Código MIT; dados de fronteira derivados do OpenStreetMap (ODbL, segundo o projeto timezone-boundary-builder; confirmar)                     | ✅ com atribuição                                 |

**Cuidados:**

- **A escolha entre AGPL e Professional precisa ser feita antes de ativar qualquer serviço público** que use o Swiss Ephemeris (cláusula do LICENSE). Desenvolvimento e testes locais não configuram serviço público, mas **nenhum deploy acessível ao público** pode usar o motor antes da compra.
- **Confirmar com a Astrodienst** se a licença cobre uso em servidor (SaaS) e qual entidade jurídica será a titular (Cation Digital?).
- **Não sou advogado:** recomendo revisão jurídica do contrato antes da assinatura.

---

## 6. Localização e fusos históricos

### 6.1 Resolução de cidades

| Opção                                  | Custo             | Prós                                                                                                                                                                                       | Contras                                                                                              |
| -------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **GeoNames, dump local** (recomendado) | Grátis, CC BY 4.0 | Cada localidade traz lat/lon, código de estado (admin1), país, população e **fuso IANA**. Arquivo do Brasil completo, mais `cities15000` para o mundo. Busca offline e rápida no Postgres. | Precisa de importação e atualização periódica (script). Qualidade boa, mas não oficial.              |
| IBGE (API de localidades)              | Grátis            | Lista oficial dos 5.570 municípios e UFs                                                                                                                                                   | Sem coordenadas na API de localidades. Útil para conferir a cobertura brasileira.                    |
| Nominatim (OSM) público                | Grátis            | Cobertura mundial                                                                                                                                                                          | A política de uso **proíbe autocompletar** e uso intensivo. Inadequado como dependência de produção. |
| Google Places / Mapbox                 | Pago por uso      | Excelente busca                                                                                                                                                                            | Custo recorrente, dado pessoal enviado a terceiro, desnecessário no MVP                              |

**Proposta:**

- Tabela `Place` no Postgres (id GeoNames, nome, nome ASCII, nomes alternativos, UF ou admin1, país, lat, lon, fuso IANA, população).
- Índice trigram (`pg_trgm`) e `unaccent` para autocompletar tolerante a acentos.
- Ordenação por população, com prioridade para o Brasil.
- **Desambiguação obrigatória:** a pessoa escolhe “Santa Maria — RS” ou “Santa Maria — DF”; nunca adivinhamos pelo texto. Há muitos homônimos no Brasil (Bom Jesus, São Domingos, Santa Maria…).
- O sistema guarda `placeId` + coordenadas + fuso usados no cálculo.
- **Atribuição** “Dados geográficos: GeoNames (CC BY 4.0)”.
- Observação: www.geonames.org está bloqueado na rede desta sessão; licença e campos informados conforme a documentação pública do GeoNames, a reconfirmar na implementação.

### 6.2 Fuso horário

- **Fonte de verdade:** o fuso IANA vem da cidade escolhida (campo do GeoNames). O `geo-tz` (MIT) fica como opção apenas para coordenadas digitadas manualmente (fora do MVP).
- **Conversão:** a base de fusos IANA (tzdb) do próprio runtime, via `Intl` (Node 22: ICU 77.1, tzdata 2025b). Sem dependência nova.
- Testes executados nesta auditoria:

| Data e local                        | Deslocamento retornado | Observação                                 |
| ----------------------------------- | ---------------------- | ------------------------------------------ |
| 15/01/1986, São Paulo               | UTC−2                  | Horário de verão 1985/86 ✔                 |
| 15/01/1986, Recife                  | UTC−2                  | Nordeste com horário de verão em 1985/86 ✔ |
| 15/01/2012 e 15/01/2013, Bahia      | UTC−2 e UTC−3          | Horário de verão só em 2011/12 ✔           |
| 15/01/2008 e 15/01/2009, Rio Branco | UTC−5 e UTC−4          | Mudança do Acre em 2008 ✔                  |
| 15/12/2019, São Paulo               | UTC−3                  | Fim do horário de verão em 2019 ✔          |
| 01/01/1910, São Paulo               | UTC−03:06:28           | Hora média local (LMT) antes de 1914 ✔     |

**Limitação conhecida (tzdb, arquivo `southamerica`):**

- Os dados brasileiros anteriores a 1990 vêm em grande parte de Shanks & Pottenger, que o próprio tzdb chama de pouco confiável.
- Antes de 1970, regras diferiam por estado (por exemplo, o horário de verão de 1963 começou em datas diferentes para MG, ES, RJ e SP e para os demais estados).
- A tzdb agrupa regiões em 16 zonas brasileiras, então algumas cidades podem herdar regras de outra cidade da mesma zona.

**Política proposta:**

- Mostrar à pessoa **o deslocamento aplicado** (“Em 14/03/1992, em Recife, o horário oficial era UTC−3”) e permitir corrigir.
- Registrar `offsetSource` (`tzdb` ou `user_override`).
- Para nascimentos antes de 1970 no Brasil, exibir um aviso de confiabilidade.

### 6.3 Horários inexistentes e ambíguos

No Brasil, o horário de verão começava e terminava à meia-noite. Verificado no runtime:

- **Inexistente:** 02/11/1985 entre 00:00 e 00:59, em São Paulo (o relógio pulou de 23:59 para 01:00). O sistema **recusa** o horário e pede confirmação.
- **Ambíguo:** 14/03/1986 entre 23:00 e 23:59, em São Paulo (a hora aconteceu duas vezes). O sistema **pergunta** “primeira ocorrência (horário de verão) ou segunda (horário padrão)?”. Nunca escolhe silenciosamente.

A conversão é um módulo próprio, pequeno (~80 linhas) e coberto por testes:

1. Calcular os candidatos de deslocamento ao redor do horário informado.
2. Retornar `{ status: "ok" | "nonexistent" | "ambiguous", candidates }`.

Luxon e Moment resolvem esses casos automaticamente, sem avisar. A API `Temporal` resolveria nativamente, mas ainda não existe no Node 22 (verificado). Quando estiver disponível, o módulo pode delegar a ela.

### 6.4 Horário desconhecido ou aproximado

| Caso                                                | Cálculo                                                                                    | Saída                                                                                                                                                                                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Exato** (HH:MM)                                   | Completo                                                                                   | Planetas, ASC, MC, casas, aspectos                                                                                                                                                             |
| **Aproximado** (janela informada, ex.: 14:00–15:00) | Planetas no meio da janela. ASC e MC nos **dois extremos**.                                | ASC/MC/casas **apenas se** o signo do ASC e as cúspides forem iguais nos extremos. Senão, `null` com o motivo `TIME_RANGE_TOO_WIDE`. Flag `approximate`.                                       |
| **Desconhecido**                                    | Planetas ao meio-dia local (convenção comum, declarada) e a Lua também às 00:00 e às 23:59 | **Sem ASC, MC e casas** (`null`, motivo `BIRTH_TIME_UNKNOWN`). A posição da Lua vira um intervalo; se o signo muda no dia, informar os dois. Aspectos envolvendo a Lua marcados como incertos. |

Regra de contrato: **o motor não produz ângulos nem casas sem horário suficiente**. A interface só exibe o que o contrato contém.

---

## 7. Arquitetura proposta

```
src/
  features/astrology/            # domínio astrológico (sem React)
    domain/
      types.ts                   # contratos (seção 8)
      zodiac.ts                  # signos, elementos, modalidades (constantes)
      angles.ts                  # normalização 0–360, diferença angular, grau/minuto
      aspects.ts                 # detecção de aspectos (pura)
      orbs.ts                    # tabela de orbes versionada
    time/
      local-to-utc.ts            # tzdb via Intl: ok | nonexistent | ambiguous
      julian-day.ts
    geo/
      place-repository.ts        # Prisma: busca e obtenção por id (server-only)
    engine/
      ephemeris-provider.ts      # interface
      swiss-ephemeris.ts         # adapter sweph (server-only, runtime nodejs)
    service/
      normalize-birth-input.ts   # valida (reusa validate-birth-data) e resolve lugar e fuso
      compute-natal-chart.ts     # orquestra; devolve NatalChart ou erro tipado
    __fixtures__/                # mapas de referência (JSON) e procedência
  app/api/places/route.ts        # GET ?q= autocomplete (runtime nodejs)
  app/api/chart/route.ts         # POST cálculo (runtime nodejs), ou Server Action
  components/visuals/natal-wheel/  # mandala real: consome NatalChart, não calcula nada
  lib/geometry.ts                # polar/arc extraídos da mandala atual
```

**Princípios:**

- **Separação estrita.** `engine/` só devolve números. `domain/` só deriva fatos verificáveis (signo, casa, aspecto). A interpretação simbólica fica numa camada futura (`features/interpretation/`) que **recebe** um `NatalChart`, nunca efemérides.
- **Servidor apenas.** O adapter importa `server-only` e roda em `runtime = "nodejs"`. `next.config.ts` ganha:
  - `serverExternalPackages: ["sweph"]`;
  - `outputFileTracingIncludes: { "/api/chart": ["./ephe/**/*"] }` (opções confirmadas na documentação local do Next 16).
- **Determinismo e versionamento.** Cada resultado leva `calcVersion` (versão do motor e do arquivo de efemérides, tabela de orbes, versão da tzdata). A mesma entrada com a mesma versão sempre produz a mesma saída.
- **Erros tipados.** `INVALID_DATE`, `DATE_OUT_OF_RANGE` (fora de 1800–2399), `PLACE_NOT_FOUND`, `TIME_NONEXISTENT`, `TIME_AMBIGUOUS`, `PLACIDUS_UNDEFINED` (latitude polar), `ENGINE_FAILURE`. A interface traduz cada um em mensagem, sem detalhes técnicos.
- **Cache.** O cálculo leva milissegundos e é determinístico; não precisa de cache no MVP. Se necessário, usar uma chave `hash(utc, lat, lon, houseSystem, calcVersion)` em cache de dados do Next. Nunca cachear com dados pessoais na chave em texto claro.
- **Persistência mínima (MVP):**
  - `Place` (dados públicos).
  - O mapa calculado **não** é persistido até existir a política de LGPD. Depois: `NatalChart { id, userId?, inputHash, input (cifrado), result JSON, calcVersion, createdAt }` com política de retenção.
- **Segurança.**
  - Validar no servidor com o mesmo esquema do cliente.
  - Limitar taxa de requisições em `/api/chart` e `/api/places`.
  - Não registrar data e local de nascimento em logs.
  - O endpoint de cálculo não fica público sem o fluxo de compra.
- **Vercel.**
  - Funções Node.js (não Edge).
  - Primeiro passo da Fase 02: **um protótipo de deploy** com `sweph` e arquivos `.se1`, medindo instalação do binário, tamanho do pacote, partida a frio e latência.
  - Fixar a versão do Node e acompanhar a versão da tzdata do runtime.

---

## 8. Contratos de dados sugeridos

```ts
// Entrada da pessoa (já validada no formato brasileiro)
type BirthInput = {
  date: string; // "DD/MM/AAAA"
  time:
    | { kind: "exact"; value: string } // "HH:MM" (24 h)
    | { kind: "range"; from: string; to: string }
    | { kind: "unknown" };
  placeId: string; // id GeoNames escolhido na busca
  disambiguation?: "first" | "second"; // só quando o horário é ambíguo
};

// Resultado da normalização (auditável)
type ResolvedBirth = {
  localDateTime: string; // "1992-03-14T21:45" (ou o meio da janela)
  utc: string; // ISO 8601, ex.: "1992-03-15T00:45:00Z"
  timeZone: string; // "America/Recife"
  utcOffsetMinutes: number; // -180
  offsetSource: "tzdb" | "user_override";
  timePrecision: "exact" | "range" | "unknown";
  place: {
    id: string;
    name: string;
    admin1: string;
    country: string;
    lat: number;
    lon: number;
  };
  warnings: Warning[]; // ex.: PRE_1970_TZ_UNCERTAIN
};

type Body =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto";
type Sign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

type ZodiacPosition = {
  longitude: number; // 0 ≤ λ < 360, eclíptica verdadeira da data
  sign: Sign;
  degree: number; // 0–29 (truncado)
  minute: number; // 0–59 (truncado)
};

type BodyPosition = ZodiacPosition & {
  body: Body;
  latitude: number;
  speed: number; // °/dia
  retrograde: boolean;
  house: number | null; // 1–12, null sem casas
  range?: { min: ZodiacPosition; max: ZodiacPosition }; // Lua com horário desconhecido
};

type Aspect = {
  a: Body | "asc" | "mc";
  b: Body | "asc" | "mc";
  type: "conjunction" | "sextile" | "square" | "trine" | "opposition";
  exactAngle: 0 | 60 | 90 | 120 | 180;
  orb: number; // |separação − ângulo exato|, em graus
  applying: boolean | null; // null quando não determinável
  uncertain: boolean; // ex.: envolve a Lua com horário desconhecido
};

type NatalChart = {
  meta: {
    calcVersion: string; // ex.: "astro-1.0.0+sweph-2.10.03+orbs-v1+tz-2025b"
    engine: "swiss-ephemeris" | "astronomy-engine";
    zodiac: "tropical";
    frame: "geocentric-apparent-true-ecliptic-of-date";
    houseSystem: "placidus";
    computedAt: string;
  };
  birth: ResolvedBirth;
  bodies: BodyPosition[];
  angles: { asc: ZodiacPosition; mc: ZodiacPosition } | null;
  houses: { cusps: ZodiacPosition[] /* 12 */ } | null;
  anglesUnavailableReason?:
    "BIRTH_TIME_UNKNOWN" | "TIME_RANGE_TOO_WIDE" | "PLACIDUS_UNDEFINED";
  aspects: Aspect[];
  warnings: Warning[];
};

type Warning = { code: string; message: string };
```

### 8.1 Convenções técnicas propostas (decisões pendentes)

| Decisão                                          | Proposta                                                                                                      | Justificativa                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Referencial                                      | Geocêntrico, posições **aparentes** (luz, aberração, nutação), eclíptica e equinócio **verdadeiros da data**  | Convenção da astrologia ocidental tropical e padrão do Swiss Ephemeris                                    |
| Zodíaco                                          | Tropical (0° Áries = ponto vernal)                                                                            | Definido pelo produto                                                                                     |
| Escala de tempo                                  | Entrada em UT; ΔT pelo motor                                                                                  | Padrão                                                                                                    |
| Longitude geográfica                             | Leste positivo (Brasil negativo)                                                                              | Convenção do Swiss Ephemeris; testar o sinal explicitamente                                               |
| Casas                                            | Placidus                                                                                                      | Definido pelo produto                                                                                     |
| Latitude além dos círculos polares               | Placidus indefinido: `houses: null` + `PLACIDUS_UNDEFINED`. ASC e MC continuam válidos.                       | Não trocar de sistema em silêncio. Oferecer Porfírio ou Casas Inteiras só se o produto decidir, rotulado. |
| Exibição                                         | Grau e minuto **truncados** (29°59′ nunca vira 30°00′)                                                        | Convenção astrológica; evita signo errado na exibição                                                     |
| Orbes (v1)                                       | Conjunção 8°, Oposição 8°, Quadratura 7°, Trígono 7°, Sextil 5°; **+2° quando envolve Sol ou Lua**; ASC/MC 5° | Valores dentro da faixa usual da literatura. Tabela versionada e ajustável.                               |
| Aspectos com ASC/MC                              | Só com horário exato                                                                                          | Ângulos dependem da hora                                                                                  |
| Aspectos fora de signo                           | Considerados pelo orbe, com flag `outOfSign` (opcional)                                                       | Decisão editorial a confirmar                                                                             |
| Faixa de datas                                   | 1900–hoje no produto (já validado na Fase 01); motor suporta 1800–2399 com `sepl_18`/`semo_18`                | Margem e arquivo pequeno                                                                                  |
| Horário desconhecido                             | Meio-dia local para planetas; Lua como intervalo                                                              | Convenção declarada, nunca escondida                                                                      |
| Nodos lunares, Quíron, Vértice, Parte da Fortuna | Fora do MVP                                                                                                   | Fácil adicionar depois                                                                                    |

---

## 9. Plano de integração com a mandala

**Princípio:** a mandala atual (`Mandala`) **continua decorativa** e rotulada como tal. A mandala real é um **componente novo**, `NatalWheel`, que recebe um `NatalChart` e só desenha. Nenhum cálculo astronômico acontece nela.

**Reaproveitar:**

- `polar()`, `arc()` e `star()` (extraídos para `lib/geometry.ts`).
- A linguagem visual: escala de graus, faixa de setores, cores cobre e frio, losangos.
- Os símbolos dos elementos como legenda dos signos.

**Diferenças essenciais:**

| Aspecto     | Mandala decorativa    | `NatalWheel`                                                                                                                |
| ----------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Orientação  | 0° no topo, girando   | **ASC fixo à esquerda (9 h)**, zodíaco no sentido anti-horário; sem rotação animada                                         |
| Signos      | Faixa genérica        | 12 faixas de 30° posicionadas pela longitude real, com glifo e nome acessível                                               |
| Casas       | —                     | Linhas das cúspides (ASC, IC, DSC e MC destacados) e números das casas                                                      |
| Planetas    | —                     | Glifo na longitude exata, marcador de grau, “R” para retrógrado; anti-colisão por deslocamento radial (o ângulo nunca muda) |
| Aspectos    | Polígonos ornamentais | Linhas internas entre planetas, cor e traço por tipo de aspecto, espessura pelo orbe                                        |
| Sem horário | —                     | Sem casas nem ângulos; o anel externo mostra só os signos; aviso visível                                                    |

**Glifos:** os caracteres Unicode dos signos e planetas podem virar emoji no iOS e faltam em algumas fontes. Usar **SVG próprio** (paths) para cada glifo, como já foi feito com os elementos.

**Interatividade:**

- Tocar ou focar um planeta destaca seus aspectos e abre um painel com signo, grau, casa e “R”.
- Alternância “mostrar aspectos” e filtros por tipo.

**Responsividade:** a mesma `viewBox`, com a densidade de rótulos ajustada por tamanho (variante compacta).

**Acessibilidade:**

- O SVG tem `role="img"` com `aria-labelledby` (título e resumo).
- **Tabela equivalente** sempre disponível (planeta, signo, grau, casa), já que o desenho não é acessível por si.
- Planetas focáveis por teclado.
- Contraste conforme os tokens e movimento reduzido respeitado.

**Precisão visual:** em teste, a posição angular desenhada de cada planeta é derivada da longitude por uma função pura e verificada (rotação pelo ASC, sentido anti-horário).

---

## 10. Estratégia de testes e validação

### 10.1 Fontes independentes

| O que valida                      | Fonte                                                                                           | Independência                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Longitudes de Sol a Plutão e Lua  | **JPL Horizons** (efemérides DE440/441), quantidades “ObsEcLon/ObsEcLat”, geocêntrico aparente  | Total: fonte primária, outro software          |
| Longitudes (regressão automática) | **Astronomy Engine** (VSOP87/ELP próprio)                                                       | Algoritmo independente                         |
| ASC, MC, cúspides Placidus        | Implementação própria das fórmulas de Meeus e da literatura de casas, como **oráculo de teste** | Código independente do motor                   |
| ASC/MC/casas (sanidade)           | Tabelas de casas publicadas e uma segunda aplicação astrológica comercial                       | Parcial: muitas usam o próprio Swiss Ephemeris |
| Fusos e horário de verão          | Decretos citados no tzdb (`southamerica`) e casos de transição conhecidos                       | Independente do código                         |

Uma biblioteca **não** será considerada validada por consistência interna. Toda fixture registra a fonte, a data da consulta e os parâmetros.

### 10.2 Cenários

| #   | Cenário                                                 | O que verifica                                                          |
| --- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | São Paulo, 1992, horário comum                          | Fluxo completo e sinal da longitude oeste                               |
| 2   | Recife, 15/01/1986 (horário de verão)                   | Deslocamento −2 h e UTC correto                                         |
| 3   | São Paulo, 02/11/1985, 00:30                            | `TIME_NONEXISTENT`                                                      |
| 4   | São Paulo, 14/03/1986, 23:30                            | `TIME_AMBIGUOUS` e as duas resoluções                                   |
| 5   | Rio Branco, 2008 e 2009                                 | Mudança de fuso do Acre                                                 |
| 6   | Lisboa ou Nova York                                     | Fora do Brasil, outro hemisfério, horário de verão europeu ou americano |
| 7   | Horário desconhecido                                    | Ângulos e casas `null`; Lua como intervalo; sem aspectos com ângulos    |
| 8   | Horário aproximado (janela estreita e larga)            | ASC só quando estável na janela                                         |
| 9   | 23:30 local, gerando o dia seguinte em UTC              | Virada de data                                                          |
| 10  | Planeta a menos de 1′ de um limite de signo             | Truncamento e signo correto, com flag de proximidade                    |
| 11  | Tromsø (69,6° N) e Ushuaia (54,8° S)                    | Placidus indefinido versus definido; ASC/MC presentes                   |
| 12  | Data inválida, futura, antes de 1900, lugar inexistente | Erros tipados                                                           |
| 13  | Nascimento antes de 1914 (hora média local)             | Deslocamento LMT e aviso                                                |
| 14  | Planeta retrógrado (ex.: Mercúrio em retrogradação)     | Velocidade negativa e flag                                              |

### 10.3 Tolerâncias e aceitação

| Grandeza                            | Tolerância vs. referência | Critério                                                                                |
| ----------------------------------- | ------------------------- | --------------------------------------------------------------------------------------- |
| Sol a Plutão vs. JPL Horizons       | ≤ 0,005° (18″)            | 100% das fixtures                                                                       |
| Lua vs. JPL Horizons                | ≤ 0,01° (36″)             | 100%                                                                                    |
| Longitudes vs. Astronomy Engine     | ≤ 1′                      | 100% (limite de precisão do Astronomy Engine)                                           |
| ASC e MC vs. oráculo de fórmula     | ≤ 0,01°                   | 100%                                                                                    |
| Cúspides Placidus vs. oráculo       | ≤ 1′                      | 100%                                                                                    |
| Signo, casa e aspecto (categóricos) | **Idênticos**             | 100%, exceto onde a referência está dentro da tolerância de um limite (fixture marcada) |
| UTC resultante                      | **Exato** (ao minuto)     | 100%                                                                                    |

**Aceitação da Fase 02:**

- Todas as fixtures passam.
- O protótipo na Vercel funciona com tempo de cálculo a frio e a quente medido.
- A licença está adquirida antes de qualquer deploy público.

**Testes de propriedade:**

- `0 ≤ λ < 360`.
- Cúspides em ordem crescente módulo 360.
- MC no quadrante coerente com o ARMC.
- Aspectos simétricos (A–B igual a B–A).

---

## 11. Riscos, limitações e dependências

| Risco                                                      | Impacto             | Mitigação                                                                                                         |
| ---------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Licença AGPL usada por engano em produção                  | Alto (jurídico)     | Comprar a Professional antes de qualquer deploy público; registrar no `docs/DECISIONS.md`                         |
| Binário nativo do `sweph` falhar na Vercel                 | Médio               | Protótipo de deploy logo no início; alternativas: pacote WASM sob a mesma licença ou plano B com Astronomy Engine |
| Fusos brasileiros antes de 1970 imprecisos (tzdb)          | Médio               | Mostrar o deslocamento aplicado, permitir correção, avisar                                                        |
| Homônimos de cidades                                       | Médio               | Seleção obrigatória com UF; nunca adivinhar                                                                       |
| Horário desconhecido ou aproximado                         | Médio (expectativa) | Regras de contrato da seção 6.4 e textos claros                                                                   |
| Placidus em latitudes polares                              | Baixo (raro)        | `houses: null` + aviso                                                                                            |
| Diferença entre o nosso resultado e o de outros sites      | Médio (confiança)   | Exibir “Placidus, tropical” e os parâmetros; fixtures documentadas                                                |
| Atualização da tzdb e do ICU no runtime                    | Baixo               | Fixar a versão do Node; teste que registra `process.versions.tz`                                                  |
| Dados pessoais sensíveis (LGPD)                            | Alto                | Não persistir até existir política; sem dados pessoais em logs; consentimento                                     |
| Domínios bloqueados nesta sessão (astro.com, geonames.org) | —                   | Valores de licença, preço e campos do GeoNames a reconfirmar fora da sessão                                       |

**Dependências externas propostas (a aprovar):**

- Produção: `sweph` (com licença profissional) e os arquivos `.se1`.
- Dados: importação do GeoNames.
- Testes: `astronomy-engine`.
- Opcional: `geo-tz`.

---

## 12. Plano incremental da Fase 02

| Etapa                           | Entrega                                                                                                                      | Critério de pronto                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| **02B — Prova técnica**         | `sweph` e arquivos `.se1` num Route Handler isolado, numa branch e num deploy de _preview_ privado na Vercel                 | Instala, calcula e mede latência; nada público      |
| **02C — Domínio puro**          | `domain/` (signos, ângulos, aspectos, orbes) e `time/` (hora local → UTC com estados), com testes                            | Todos os cenários de fuso (2–5, 9, 13) passam       |
| **02D — Motor**                 | `EphemerisProvider` + adapter Swiss Ephemeris + `computeNatalChart`; fixtures JPL e oráculo                                  | Tolerâncias da seção 10.3 atendidas                 |
| **02E — Lugares**               | Tabela `Place`, script de importação do GeoNames, `/api/places` com autocompletar e desambiguação                            | Busca por nome com acentos; homônimos com UF        |
| **02F — Fluxo**                 | Formulário com busca de cidade, confirmação do deslocamento, casos ambíguo e inexistente, horário desconhecido ou aproximado | Testes de interface; nenhum ângulo sem horário      |
| **02G — Mandala real**          | `NatalWheel` + tabela acessível, consumindo `NatalChart`                                                                     | Posições desenhadas conferidas por teste; acessível |
| **Pré-requisito de publicação** | Licença profissional assinada; política de privacidade e LGPD                                                                | Antes de qualquer deploy público com cálculo        |

Cada etapa em branch própria com pull request, rodando typecheck, lint, testes e build.
