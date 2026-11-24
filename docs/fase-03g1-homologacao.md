# Fase 03G.1 — Ambiente privado de homologação

Estado em 24/11/2026: **código preparado e testado localmente no modo de
execução da Vercel; implantação pendente de autorização na conta Vercel.**

Esta fase **não** é lançamento público: sem pagamentos, sem leitura das
mãos, sem IA paga e sem coleta de dados de terceiros. A licença do Swiss
Ephemeris para serviço público **continua sem decisão**. O ambiente é
privado, protegido por credenciais e restrito à equipe.

## 1. Diagnóstico

### 1.1 Arquitetura e execução

| Item      | Situação                                                                                                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework | Next.js 16.4.6 (App Router, `cacheComponents`, Server Actions, `proxy.ts`), React 19.3                                                                                                 |
| Node      | `>=20.19`. Testado com Node 22.23. **Na Vercel: 22.x**                                                                                                                                 |
| Rotas     | Estáticas e de pré-renderização parcial, mais 3 rotas de API da leitura das mãos. O cálculo do mapa roda em Server Actions da página `/dados-de-nascimento`                            |
| Build     | `npm run build`, com o wrapper `with-tzdata`. Na Vercel, `vercel-build` também baixa as efemérides (`npm run ephe:fetch`), conferidas por SHA-256                                      |
| Testes    | `npm run check`: 1338 aprovados, 45 ignorados (pagos e de avaliação), 0 falhas (uma falha isolada numa execução não se repetiu em outras quatro; o nome do teste não ficou registrado) |

### 1.2 Dependências de runtime

| Dependência                                              | Detalhe                                                                           | Tratamento na Vercel                                                                                                                                                        |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Swiss Ephemeris** (`sweph` 2.10.3-8)                   | Addon nativo N-API. Binários pré-compilados `linux-x64` e `linux-arm64`           | Externo ao bundle (`serverExternalPackages`); binário incluído por `outputFileTracingIncludes`                                                                              |
| Efemérides (`ephe/`, 1,8 MB)                             | Não versionadas (decisão da 02A)                                                  | Baixadas no build (`vercel-build`) e incluídas na função                                                                                                                    |
| **Base de fusos** (`tzdata/2026f`)                       | O Node 22 traz a 2026e. O Sidera **bloqueia** o cálculo se a base não for a 2026f | Incluída na função. Exige `ICU_TIMEZONE_FILES_DIR` com o **caminho absoluto** da base na função (ver 3.2). Sem ela, o cálculo é recusado com mensagem clara (falha fechada) |
| Base de localidades (`src/features/places/data`, 8,6 MB) | Lida com `fs`                                                                     | Incluída na função                                                                                                                                                          |
| Prisma                                                   | Só `prisma generate` no `postinstall`; o banco não é usado nesta fase             | Sem `DATABASE_URL`                                                                                                                                                          |

Tudo isso foi verificado no rastreamento do build (`.nft.json` da página
`/dados-de-nascimento`). O funcionamento real na Vercel **só fica
confirmado depois da implantação** (seção 5).

### 1.3 Variáveis de ambiente

Nenhuma variável `NEXT_PUBLIC_` é necessária. Nenhum segredo vai ao
navegador.

| Variável                                                                                     | Tipo                                           | Homologação                                                                           |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `SIDERA_ACCESS_USER`                                                                         | Configuração do servidor                       | Nome de usuário do acesso (você escolhe)                                              |
| `SIDERA_ACCESS_PASSWORD`                                                                     | **Segredo** (Sensitive)                        | **Você cadastra no painel**; mínimo de 16 caracteres; nunca no chat ou no repositório |
| `SIDERA_INTERNAL_ENGINE`                                                                     | Configuração do servidor (também no **build**) | `1`: liga o cálculo astrológico no ambiente privado                                   |
| `SIDERA_REPORT_READING`                                                                      | Configuração do servidor                       | `1`: leitura da jornada real (capítulos do céu)                                       |
| `ICU_TIMEZONE_FILES_DIR`                                                                     | Configuração do servidor                       | Caminho absoluto da base `tzdata/2026f` na função (ver 3.2)                           |
| `SIDERA_REPORT_DEMO`                                                                         | Configuração do servidor                       | **Não definir** (demonstração com dados de exemplo; opcional, mais tarde)             |
| `SIDERA_PALM_*`, `SIDERA_AI_*`, `SIDERA_ANTHROPIC_API_KEY`                                   | Configuração e segredo                         | **Não definir**: leitura das mãos e IA desligadas                                     |
| `SIDERA_CONSENT_SECRET`, `SIDERA_CLIENT_KEY_SECRET`, `SIDERA_CONSENT_LEDGER`, `DATABASE_URL` | Segredos e configuração                        | **Não definir**: só servem à leitura das mãos, que fica desligada                     |

### 1.4 O que continua bloqueado

Na Vercel, todas as implantações rodam com `NODE_ENV=production`. Por isso
os bloqueios de produção continuam ativos, sem nenhuma alteração.

| Recurso                                               | Bloqueio                                                                                                                    |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Leitura das mãos (API)                                | Sem `SIDERA_PALM_ANALYSIS_ENABLED`: 404. Mesmo ligada, em produção: 503 sem segredos e fonte de IP, e chamada real proibida |
| IA real (textos e visão)                              | Proibida com `NODE_ENV=production` e sem chave                                                                              |
| Registro de consentimento e resultados compartilhados | Bloqueados em produção (03G.3)                                                                                              |
| Leitura interna `/relatorio/leitura`                  | 404 sem `SIDERA_REPORT_READING`/`SIDERA_REPORT_DEMO`                                                                        |
| Pagamento                                             | Botão desabilitado; não existe checkout                                                                                     |

### 1.5 Custos e limites

- **Plano Hobby da Vercel:** sem custo, mas os termos dele são para **uso
  pessoal e não comercial**. Para um produto comercial em homologação,
  avaliar o plano Pro (decisão sua; não bloqueia o teste técnico).
- **Chamadas pagas:** nenhuma (IA desligada).
- **Funções:** cálculo do mapa de ~1 s; limites de duração do Hobby são
  suficientes.
- **Download no build:** efemérides de `raw.githubusercontent.com`
  (repositório oficial da Swiss Ephemeris), conferidas por SHA-256.

### 1.6 Isolamento entre homologação e produção

- **Projeto exclusivo na Vercel** (proposta: `sidera-homologacao`), com
  variáveis próprias. Não existe projeto de produção.
- **Sem domínio próprio, sem banco, sem pagamentos, sem IA, sem leitura das
  mãos.**
- **Acesso fechado por padrão:** qualquer implantação na Vercel **sem
  credenciais** responde 503 em todas as rotas. Não existe variável para
  "abrir ao público"; o lançamento exige mudança de código revisada.

## 2. O que mudou no código

| Arquivo                                     | Mudança                                                                                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/access/access-gate.ts` (novo) | Acesso por credenciais (HTTP Basic sobre HTTPS), comparação em tempo constante, senha ≥ 16 caracteres; na Vercel sem credenciais: 503                                     |
| `src/proxy.ts`                              | Passa a cobrir todas as rotas (menos os estáticos do build): acesso restrito, `X-Robots-Tag: noindex, nofollow, noarchive`, e o mesmo 404 de antes para a leitura interna |
| `src/app/robots.ts` (novo)                  | `Disallow: /`                                                                                                                                                             |
| `package.json`                              | Script `vercel-build` (efemérides + build)                                                                                                                                |
| Testes                                      | `access-gate.test.ts` (8 testes); ajuste de um teste do proxy, que agora cobre todas as rotas                                                                             |
| `scripts/e2e/hml-homologacao.mjs` (novo)    | Verificação do ambiente (local ou URL real), com credenciais só por variável de ambiente                                                                                  |

Não mudaram: motor astrológico, interpretações, consentimento,
privacidade, regras da leitura das mãos e da IA.

## 3. Implantação (passos)

### 3.1 Ações que dependem de você

1. **Autorizar o conector da Vercel** nesta sessão (link de uso único que
   eu gero).
2. **Permitir o repositório na integração GitHub da Vercel**, se o painel
   pedir.
3. **Cadastrar no painel do projeto** (Settings → Environment Variables):
   - `SIDERA_ACCESS_USER`: um nome de usuário;
   - `SIDERA_ACCESS_PASSWORD`: uma senha forte, como **Sensitive**.

   Nunca envie essa senha no chat.

4. **Opcional:** em Settings → Deployment Protection, ligar a **Vercel
   Authentication** como camada extra nas URLs de implantação.

### 3.2 O que eu faço (com o conector autorizado)

1. Criar o projeto `sidera-homologacao` (Next.js, Node 22.x), ligado ao
   repositório, implantando o ramo deste trabalho.
2. Cadastrar as variáveis **não secretas**:
   - `SIDERA_INTERNAL_ENGINE=1`;
   - `SIDERA_REPORT_READING=1`;
   - `ICU_TIMEZONE_FILES_DIR=/var/task/tzdata/2026f`.

   O caminho é o esperado para as funções da Vercel. Se a homologação
   mostrar a mensagem de base de fusos divergente, ajusto e implanto de
   novo.

3. Implantar e conferir, sem a senha, que tudo responde 503 (fechado) e,
   depois que você cadastrar as credenciais, 401 sem login.
4. Rodar `scripts/e2e/hml-homologacao.mjs` contra a URL. Para isso, peço a
   liberação do endereço exato na rede deste ambiente (hoje
   `*.vercel.app` está bloqueado aqui) e a credencial de acesso pelo
   formulário seguro, sem que ela passe pelo chat.

## 4. Testes locais no modo da Vercel

Build com `SIDERA_INTERNAL_ENGINE=1` e `SIDERA_REPORT_READING=1`. Servidor
`next start` **sem** o wrapper de fusos (como na Vercel), com `VERCEL=1`,
credenciais de teste e `ICU_TIMEZONE_FILES_DIR` absoluto.

| Verificação                                         | Resultado                                                                                                                                                                                                                                                             |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                     | 1338 aprovados, 45 ignorados, 0 falhas                                                                                                                                                                                                                                |
| `npm run build`                                     | Aprovado                                                                                                                                                                                                                                                              |
| Vercel sem credenciais                              | 503 em todas as rotas                                                                                                                                                                                                                                                 |
| Sem credenciais / senha errada                      | 401 (início, formulário, relatório, robots, API)                                                                                                                                                                                                                      |
| Com credenciais                                     | 200; `X-Robots-Tag` noindex; meta robots noindex; robots.txt `Disallow: /`                                                                                                                                                                                            |
| Roteiro `hml-homologacao.mjs` (desktop e iPhone 13) | **37/37**: navegação, validação, busca de cidades, horário inexistente explicado, mapa natal com mandala (10 corpos, seleção), relatório com 6 de 9 capítulos (céu + guia; capítulo 8 indisponível sem as mãos), 404, sem rolagem horizontal, sem erros de JavaScript |
| Leitura das mãos                                    | API 404 (desligada)                                                                                                                                                                                                                                                   |
| Demonstração com dados de exemplo                   | Desligada                                                                                                                                                                                                                                                             |

## 5. Implantação real (24/11/2026)

### 5.1 Ajustes exigidos pela Vercel

Os dois primeiros builds falharam. Os ajustes não mudam o motor nem as
interpretações:

| Falha                                                      | Causa                                                                                            | Ajuste                                                                                                             |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| SHA-256 divergente para `sepl_18.se1`                      | Em 21/11/2026, o `master` de `aloistr/swisseph` trocou o arquivo ("compressed ephemeris update") | Origem fixada no commit `cae9ecd4`, que tem **exatamente** os arquivos validados (mesmos hashes). Motor inalterado |
| Build em Node 26                                           | `engines: ">=20.19"` prevaleceu sobre a configuração do projeto                                  | `engines: "22.x"`, a versão testada                                                                                |
| "Base de fusos ausente em /var/task/tzdata/2026f" no build | A variável aponta para o caminho da **função**, que não existe durante o build                   | `vercel-build` usa `tzdata/2026f` do repositório no build. O runtime continua com a variável                       |

### 5.2 Situação

- **Projeto:** `sidera-homologacao`, Node 22.x, região `iad1`.
- **Implantação de produção do projeto:** `dpl_YMMdyHy9BVC6dxEUYSsTKNLAxoqw`,
  commit `9750d18`, **READY**.
- **Endereços:**
  - `https://sidera-homologacao-vinicius-55d9.vercel.app`;
  - `https://sidera-homologacao.vercel.app`;
  - o alias do ramo.
- **Duas camadas de proteção:**
  1. **Vercel Authentication**, em todas as URLs `*.vercel.app`. Sem login na
     conta Vercel autorizada, a resposta é 302 para o SSO da Vercel
     (verificado no alias da equipe).
  2. **Gate da aplicação.** Sem `SIDERA_ACCESS_USER` e
     `SIDERA_ACCESS_PASSWORD`, a resposta é **503 "Ambiente indisponível."**,
     com `X-Robots-Tag: noindex, nofollow, noarchive` (verificado nos dois
     aliases com a conta Vercel).
- **Para a verificação**, a ferramenta da Vercel criou um link temporário
  de compartilhamento (expira em 23 h). Ele leva apenas ao gate da
  aplicação, ou seja, ao 503 e, depois, ao pedido de senha.
- **Ainda não verificado na URL real:** 401/200 com credenciais, cálculo
  (base de fusos na função), mandala e relatório. Tudo isso depende do
  cadastro das credenciais.

## 6. Pendências

- **Credenciais de acesso:** cadastro pelo titular da conta na Vercel e
  nova implantação. Depois, a verificação completa na URL real.
- **Uso do Hobby para projeto comercial:** decisão de plano.
- **Leitura das mãos e IA em homologação:** continuam bloqueadas.
  - Para testar a interface das mãos com o **simulador**, seria preciso
    uma decisão explícita e uma mudança mínima, porque hoje "produção"
    (`NODE_ENV`) também vale para a homologação.
  - Fotos reais e IA exigem a resolução das pendências da 03G e
    autorização específica.
- **Antes de qualquer serviço público:** licença do Swiss Ephemeris,
  pendências da 03G e repetibilidade visual.
