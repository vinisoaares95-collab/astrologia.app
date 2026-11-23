# Fase 04A — licença do motor astrológico: diagnóstico e opções

**Registro de 23/11/2026. O motor não foi alterado.**

- **Situação de produção:** o relatório completo continua restrito ao
  ambiente interno (`SIDERA_INTERNAL_ENGINE=1` para o cálculo;
  `SIDERA_REPORT_DEMO=1` para a demonstração da leitura).
- **Fontes:** só os textos de licença do próprio pacote instalado
  (`node_modules/sweph`). O site da Astrodienst
  (`www.astro.com/swisseph/`) **não abriu neste ambiente** (o domínio não
  resolve). Preço e termos atuais da licença profissional estão
  **pendentes de confirmação** no site oficial.
- **Natureza deste documento:** não é parecer jurídico. As opções precisam
  de revisão por assessoria.

## 1. O que está integrado

| Item                           | Valor                                                                                                                                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pacote                         | `sweph` **2.10.3-8** (fixado em `package.json`)                                                                                                                                                                                   |
| Autor do pacote (binding Node) | Timotej Valentin Rojko, `github.com/timotejroiko/sweph`                                                                                                                                                                           |
| Biblioteca embutida            | **Swiss Ephemeris 2.10.03** (`SE_VERSION` em `swisseph/sweph.h`), código C compilado como addon nativo N-API                                                                                                                      |
| Titular da Swiss Ephemeris     | **Astrodienst AG, Suíça** ("Copyright (C) 1997 - 2021 Astrodienst AG, Switzerland"); autores Dieter Koch e Alois Treindl                                                                                                          |
| Licença declarada no pacote    | `(AGPL-3.0-or-later OR LGPL-3.0-or-later)`                                                                                                                                                                                        |
| Dependências do pacote         | `node-addon-api` 8.9.2 (MIT) e `node-gyp-build` 4.8.4 (MIT); binários pré-compilados para linux-x64, linux-arm64, darwin-arm64 e win32-x64                                                                                        |
| Arquivos de efemérides         | `sepl_18.se1` e `semo_18.se1` (1800–2399), baixados de `github.com/aloistr/swisseph` por `scripts/fetch-ephemeris.mjs`, com SHA-256 conferido. **Não versionados no repositório**. Fazem parte da distribuição da Swiss Ephemeris |
| Onde é usado                   | só em `src/features/astrology/engine/swiss-ephemeris.ts`, que implementa a interface própria `EphemerisProvider` (posições, dia juliano, Placidus)                                                                                |
| Como entra no servidor         | `serverExternalPackages: ["sweph"]`. Os binários e `ephe/` entram no deploy por `outputFileTracingIncludes` (`next.config.ts`)                                                                                                    |
| Bloqueio atual                 | `isInternalEngineEnabled()` exige `SIDERA_INTERNAL_ENGINE=1`, decisão da Fase 02A (`docs/DECISIONS.md`)                                                                                                                           |

## 2. O que as licenças dizem

Trechos do pacote instalado.

**Swiss Ephemeris** (`swisseph/swephexp.h`). Há um regime duplo, e quem
usa a biblioteca "must choose between one of the two license models":

- **(a) AGPL.** Inclui "the obligation to place his or her whole software
  project under the AGPL or a compatible license".
- **(b) Swiss Ephemeris Professional License.** Para ela, "purchase the
  Swiss Ephemeris Professional Edition from Astrodienst and sign the
  corresponding license contract".

**Momento da escolha:** "before the software developer distributes
software containing parts of Swiss Ephemeris to others, and **before any
public service using the developed software is activated**".

**Uso dos nomes:** os nomes dos autores e da Astrodienst "must not be used
for promoting any software, product or service which uses or contains the
Swiss Ephemeris".

**Pacote `sweph`** (README):

- até a versão 2.10.0, GPL-2.0;
- a partir da 2.10.1, AGPL-3.0;
- "If you own a professional license for the Swiss Ephemeris, you may use
  any version of this library under `LGPL-3.0`".

**Consequência para o Sidera.** O Sidera é um serviço web que calcula o
mapa no servidor para quem o acessa. Com a AGPL, a cláusula de interação
por rede (seção 13 da AGPL-3.0) exige oferecer o código-fonte
correspondente aos usuários do serviço. Pela condição da própria Swiss
Ephemeris, isso vale para **o projeto inteiro**. A leitura definitiva é
jurídica.

## 3. Opções de conformidade

| Opção                                              | O que implica                                                                                                                                                                | Efeito no código                                                                                                                                                                             | Pontos a confirmar                                                                                                                                                                     |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Licença profissional da Astrodienst**         | Comprar a Professional Edition e assinar o contrato; o `sweph` passa a valer sob LGPL-3.0                                                                                    | Nenhum no motor. Cumprir a LGPL do binding (avisos e possibilidade de substituir a biblioteca) e manter os avisos de copyright                                                               | Preço, se o pagamento é único ou recorrente, e o alcance (por produto, por empresa, versões e arquivos `.se1`) no site oficial. Quem assina: a Cation Digital, ainda a constituir (D6) |
| **B. Adotar a AGPL**                               | Publicar o código-fonte do Sidera inteiro sob AGPL ou licença compatível e oferecê-lo aos usuários do serviço                                                                | Nenhum no motor. Exige política de publicação do código                                                                                                                                      | Compatibilidade com o modelo comercial, segredos, conteúdo editorial e dependências; análise jurídica                                                                                  |
| **C. Trocar o motor por um de licença permissiva** | Nova implementação de `EphemerisProvider` (ex.: `astronomy-engine` 2.1.19, **MIT**, já usado como referência nos testes da 02A) mais o cálculo próprio de ASC, MC e Placidus | Nova implementação e **revalidação completa** contra as referências da 02A (JPL DE421, oráculo de casas), com os mesmos casos de teste. O restante do motor não muda, por causa da interface | Precisão nas faixas exigidas, casas em latitudes altas, desempenho. É trabalho de engenharia, não só jurídico                                                                          |
| D. Versão antiga GPL do `sweph` (≤ 2.10.0)         | A GPL-2.0 não tem a cláusula de rede                                                                                                                                         | Rebaixar o motor e revalidar                                                                                                                                                                 | **Não recomendada sem parecer.** A condição da Swiss Ephemeris citada acima fala em "public service", e a versão é antiga. Registrada só para completar                                |
| E. Isolar o cálculo num serviço separado           | Não muda a obrigação: o serviço que usa a Swiss Ephemeris continua sujeito à licença escolhida                                                                               | —                                                                                                                                                                                            | Não resolve sozinho; depende de A, B ou C                                                                                                                                              |

**Recomendação técnica:**

- **Opção A, se o preço for proporcional.** Não mexe num motor já
  validado. Confirmar preço e termos na fonte oficial (liberar
  `www.astro.com` na rede da sessão ou consultar diretamente).
- **Opção C como alternativa.** Viável pela interface já existente, mas
  exige uma fase própria de revalidação.
- **Decisão:** é comercial e jurídica.

**Até a decisão:**

- o cálculo continua atrás de `SIDERA_INTERNAL_ENGINE`;
- a leitura integrada, atrás de `SIDERA_REPORT_DEMO`;
- nenhum deploy público usa o motor;
- os nomes da Astrodienst e dos autores não aparecem em material de
  divulgação.
