# Auditoria de conclusão e plano de lançamento

**Registro de 25/11/2026.** Este documento traz:

- o diagnóstico do estado real do Sidera;
- o plano de finalização, dividido em etapas executáveis uma por vez.

Nada aqui declara resolvidas as questões jurídicas ou de licença.

Legenda de evidência:

- **[comprovado]:** verificado por teste, log ou execução;
- **[local]:** comprovado localmente, no modo Vercel (`VERCEL=1`, sem o
  wrapper de fusos, credenciais de teste);
- **[hipótese]:** inferido do código ou da configuração, ainda sem
  comprovação no ambiente real.

## 1. Jornada astrológica na Vercel

### 1.1 Jornada exata (homologação)

1. Login da Vercel (Vercel Authentication), depois o usuário e a senha do
   Sidera (`SIDERA_ACCESS_USER`/`SIDERA_ACCESS_PASSWORD`).
2. Escolher um caminho até o formulário de nascimento:
   - **Interface, sem foto (desde o commit `28343e6`):** início →
     **Explorar o relatório** (ou "O relatório" no menu) → aviso "Versão
     interna" → **informar os dados de nascimento**.
   - **Caminho principal do produto:** início → "Começar pela leitura da
     mão" → consentimento → **foto** (fica só no aparelho; nada é enviado
     nem analisado) → prévia → dados de nascimento.
3. Informar data, hora e cidade (ou abrir "Casos de verificação" e escolher
   um caso fictício). Depois, **Verificar dados**.
4. Opcional: **Calcular mapa natal (ambiente interno)**, que mostra o mapa
   e a mandala interativa.
5. **Confirmar e ver a proposta.** Os capítulos 1–5 são gerados, só em
   memória, e a página vai para `/relatorio`.
6. Em `/relatorio`, aviso "Versão interna" → **Abrir a leitura desta
   jornada**. A leitura mostra 6 de 9 capítulos: 1–5 e o guia do capítulo 9. Os capítulos 6–8 aparecem indisponíveis, com o motivo.

**Atenção:** a jornada fica só na memória da aba. Recarregar a página, ou
abrir `/relatorio/leitura` direto, mostra todos os capítulos como
indisponíveis [local].

### 1.2 O que as variáveis habilitam [comprovado: lista de variáveis da Vercel]

| Variável                                        | Ambientes              | Efeito                                                                                                                 |
| ----------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `SIDERA_ACCESS_USER`, `SIDERA_ACCESS_PASSWORD`  | Production (Sensitive) | Gate HTTP Basic. Em **Preview** não existem, então as implantações de preview respondem 503 (fechadas, como projetado) |
| `SIDERA_INTERNAL_ENGINE=1`                      | Production, Preview    | Motor (Swiss Ephemeris), mapa, mandala, capítulos 1–5                                                                  |
| `SIDERA_REPORT_READING=1`                       | Production, Preview    | Leitura interna `/relatorio/leitura` e aviso "Versão interna"                                                          |
| `ICU_TIMEZONE_FILES_DIR=/var/task/tzdata/2026f` | Production, Preview    | Base de fusos 2026f no runtime                                                                                         |

Ficam desligados [comprovado no código e no roteiro local]:

- análise das mãos (API 404);
- IA (sem chave);
- registro de consentimento e banco (sem `DATABASE_URL`);
- demonstração com dados de exemplo.

### 1.3 Por que foi possível navegar sem obter resultados

- **Defeito comprovado [local], corrigido.** Pela interface, o formulário de
  nascimento só era alcançável depois de adicionar uma foto da palma:
  - a prévia sem foto oferece apenas "Adicionar foto";
  - `/relatorio` não levava ao formulário.

  Correção mínima: um atalho no aviso "Versão interna", que só aparece com
  `SIDERA_REPORT_READING=1` (commit `28343e6`, com teste). A jornada
  pública não muda.

- **Outras causas possíveis [hipótese]:**
  - abrir `/relatorio/leitura` direto ou recarregar a página, o que apaga a
    memória da jornada;
  - não clicar em "Confirmar e ver a proposta";
  - falha do motor no runtime (ver 1.4), que apareceria como mensagem, e
    não como tela vazia.
- **Logs:** nenhum erro de runtime nos últimos 2 dias. Não há logs no
  período retido: o plano Hobby guarda só 1 hora.
- **Implantação `28343e6`:** READY nos aliases de produção. Sem a senha
  do Sidera, a resposta é 401, e não mais 503, coerente com as credenciais
  já cadastradas [comprovado; a ferramenta não distingue qual das duas
  camadas devolveu o 401].

### 1.4 Swiss Ephemeris, efemérides e fusos no runtime

- [comprovado] O rastreamento do build inclui, na função de
  `/dados-de-nascimento`:
  - `tzdata/2026f/zoneinfo64.res`;
  - `ephe/sepl_18.se1` e `ephe/semo_18.se1`;
  - o binário `sweph` linux-x64;
  - a base de cidades.

  Todas as Server Actions (normalização, mapa, capítulos 1–5, cidades) são
  executadas por essa página.

- [comprovado] Os builds na Vercel passam:
  - efemérides baixadas do commit fixo, com o SHA-256 conferido;
  - Node 22.x.
- [hipótese, alta confiança] A função roda em `/var/task`, de modo que
  `/var/task/tzdata/2026f` e `process.cwd()/ephe` existem.
- **Não comprovado na URL real.** O gate HTTP Basic impede que esta sessão
  faça chamadas com a senha, e não há logs. Se a base de fusos não
  carregar, o formulário mostra "tzdb … em uso; esperada 2026f", e o
  cálculo é recusado (falha fechada).

### 1.5 Capítulos 1–5 e guia do capítulo 9

[local] O roteiro `scripts/e2e/hml-homologacao.mjs` deu **39/39** em desktop
e iPhone 13. Ele cobre:

- formulário alcançado pela interface;
- Recife 1986 → mapa e mandala (10 corpos, seleção);
- leitura com "6 de 9 capítulos";
- capítulo 8 indisponível sem as mãos;
- sem erros de JavaScript e sem rolagem horizontal.

Na URL real, o mesmo roteiro depende do responsável (ver P0-1).

### 1.6 Outras lacunas de navegação [local]

- A jornada se perde ao recarregar: é uma decisão de privacidade da 04B,
  não um defeito, mas não há aviso antes de recarregar.
- `/relatorio` mostra "Pagamento em breve" (botão desativado) e cita
  "exportação em PDF", que não existe.

## 2. Estado das funcionalidades

| Funcionalidade                           | Estado                                                                   | Evidência / observação                                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Dados de nascimento, cidade e fuso       | **Implementado e validado** (local); real não comprovado                 | 02C/02C.1; busca de cidades, horário inexistente ou duplicado, tzdb 2026f                                              |
| Cálculo e apresentação do mapa natal     | **Implementado, bloqueado por licença** fora do interno                  | `SIDERA_INTERNAL_ENGINE=1`, AGPL (`fase-04a-licenca-motor.md`)                                                         |
| Mandala interativa                       | **Implementado e validado** (local)                                      | 02D; seleção acessível                                                                                                 |
| Captura da foto das mãos                 | **Implementado e validado** (local)                                      | Redesenho no navegador, sem EXIF, só em memória (03D)                                                                  |
| Envio e análise visual                   | **Implementado mas bloqueado**                                           | API 404/503 em produção; registro de consentimento sem prazo de retenção definido; repetibilidade não validada (03F.2) |
| Interpretações (biblioteca)              | **Implementado e validado**                                              | 02E/02F.2/04D; revisão editorial 04E.2B                                                                                |
| Integração com IA (textos e visão)       | **Implementado mas bloqueado**                                           | Guardas de produção; sem chave; termos da Anthropic e transferência internacional pendentes (03G)                      |
| Relatório integrado de 9 capítulos       | **Parcial em homologação** (6 de 9 sem as mãos); completo só com as mãos | 04A–04E; aceite 04E.3                                                                                                  |
| Consentimento, armazenamento, exclusão   | **Implementado mas bloqueado / dependente de decisão**                   | Registro (Bloco 2) desligado; itens 1–8 de `privacidade/11-…`                                                          |
| Persistência e recuperação de relatórios | **Não implementado**                                                     | Só memória da aba; `PalmSharedResult` dura 10 min. Não há como reabrir um relatório comprado                           |
| Oferta                                   | **Parcial**                                                              | `/relatorio` com preços de catálogo (R$ 39,90 e outros) "ainda a validar"                                              |
| Checkout, pagamento, entrega             | **Não implementado**                                                     | Botão "Pagamento em breve" desativado                                                                                  |
| PDF                                      | **Não implementado** (prometido na oferta)                               | Texto do catálogo cita "exportação em PDF"                                                                             |
| Erros, carregamento, mobile              | **Implementado e validado** (local)                                      | Mensagens amigáveis do motor, estados de carregamento, 39/39 em iPhone 13                                              |
| Limites e custos da IA                   | **Parcial**                                                              | Limites em memória (por instância), orçamento nas ferramentas de avaliação; falta limite compartilhado (item 5 da 03G) |
| Segurança                                | **Implementado** para homologação                                        | Duas camadas de acesso, noindex, cabeçalhos, sem segredos no cliente                                                   |
| Observabilidade                          | **Mínimo**                                                               | Logs só do tipo do erro; Hobby retém 1 h; sem alertas                                                                  |

## 3. Pendências externas e riscos

| Pendência                                            | Situação real                                                                                                                                                                                    | Bloqueia                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Licença do Swiss Ephemeris                           | **Aberta.** Duas opções: AGPL (publicar o código do serviço) ou Professional License (Astrodienst; preço a confirmar). Sem ela, o motor não pode servir ao público                               | Beta com pessoas externas e comercialização |
| Plano da Vercel                                      | **Aberta.** O Hobby é para uso não comercial; o comercial exige Pro (ou outro provedor). Afeta também a retenção de logs                                                                         | Comercialização                             |
| Privacidade, consentimento, transferência e retenção | **Aberta** (itens 1–8 de `privacidade/11-…`). Minutas existem, sem revisão jurídica                                                                                                              | Beta com fotos; comercialização             |
| Termos e configuração da Anthropic                   | **Aberta.** Termos comerciais, retenção de dados e região da conta do Sidera não confirmados (03G, seção 2)                                                                                      | Qualquer chamada de IA com dados reais      |
| Custo por geração                                    | **Parcial.** A biblioteca gera os capítulos 1–5 e 8–9 sem IA (custo zero). A IA só entra nas mãos (visão) e, opcionalmente, nos textos. Falta o custo real medido por relatório e um teto global | Preço final                                 |
| Pagamento e entrega                                  | **Não iniciado.** Exige empresa (CNPJ da futura Cation Digital), gateway, termos de venda, política de reembolso e forma de entrega                                                              | Comercialização                             |
| Confiabilidade da leitura das mãos                   | **Não validada.** Repetibilidade adiada; as evidências estão preservadas (`experimento-repetibilidade-visual.md`)                                                                                | Venda do produto com as mãos                |

## 4. Plano priorizado

### P0: homologação funcional

**P0-1. Teste completo na URL real, feito pelo responsável**

- **Evidência:** o roteiro passou localmente (39/39), mas na URL real não
  foi comprovado (1.4).
- **Falta:** uma execução real da jornada.
- **Consequência de não fazer:** não se sabe se o motor e a base de fusos
  funcionam na Vercel.
- **Solução:** o responsável segue 1.1 (caminho sem foto) com o caso
  fictício "Recife, horário de verão (1986)" e anota o que viu em cada
  etapa.
- **Dependências:** nenhuma; a implantação `28343e6` já está no ar.
- **Aceite:**
  - mapa e mandala aparecem;
  - a leitura mostra "6 de 9 capítulos";
  - nenhuma mensagem de "tzdb".

**P0-2. Corrigir o runtime, se o P0-1 falhar**

- **Evidência:** a mensagem exibida, mais os logs da Vercel no mesmo
  horário (retidos por 1 h).
- **Solução:** ajuste mínimo de caminho ou rastreamento.
- **Aceite:** o P0-1 passa.

### P1: beta com pessoas reais (só o céu, sem fotos)

**P1-1. Decisão de licença do motor**

- **Evidência:** `fase-04a-licenca-motor.md`.
- **Consequência de não decidir:** o motor não pode atender pessoas fora da
  equipe.
- **Solução mínima:** decidir entre AGPL e Professional, com evidência.
- **Aceite:** decisão registrada em `DECISIONS.md`, com a fonte.

**P1-2. Aviso de privacidade mínimo do beta "céu"**

- **Evidência:** minutas na pasta `privacidade/`.
- **Solução:** um texto curto e verdadeiro para uma jornada sem fotos e sem
  IA, em que nada é gravado:
  - os dados de nascimento vão ao servidor só para o cálculo;
  - nada fica guardado;
  - o processamento ocorre nos EUA (Vercel).
- **Aceite:** texto aprovado e exibido antes do formulário.

**P1-3. Convidados com acesso controlado**

- **Solução:** credenciais por grupo, trocadas ao fim do beta, e um
  formulário de retorno externo, sem dados de nascimento.
- **Aceite:** lista de convidados e procedimento de troca da senha.

**P1-4. Coerência da oferta**

- **Evidência:** a oferta promete PDF, que não existe.
- **Solução:** ajustar o texto (ou decidir o PDF em P2) e marcar a oferta
  como prévia.
- **Aceite:** a oferta não promete nada que não exista.

### P2: comercialização

- **P2-1.** Empresa e dados jurídicos. Dependência externa; nenhum dado
  fictício.
- **P2-2.** Plano Vercel Pro (ou equivalente) e domínio próprio. A
  homologação continua separada.
- **P2-3.** Entrega mínima recomendada:
  - pagamento único via gateway com página hospedada (sem cartão no
    Sidera);
  - relatório gerado depois da confirmação do pagamento;
  - entrega por **link privado com prazo**, ou **PDF enviado por e-mail**.

  Sem cadastro nem dashboard. **Aceite:** compra de teste no modo sandbox
  do gateway, com entrega e reembolso.

- **P2-4.** Persistência mínima do relatório entregue: só o texto, sem
  dados de nascimento, com prazo e exclusão. **Depende de** P1-2 e da
  política de privacidade.
- **P2-5.** Política de privacidade, termos de venda e reembolso
  definitivos, com revisão jurídica.
- **P2-6.** Observabilidade mínima: alertas de erro e custo por geração,
  sem dados pessoais.
- **P2-7.** Escopo comercial das mãos:
  - **(a) recomendado para começar:** vender só "Seu Céu + guia";
  - **(b)** incluir as mãos, depois da repetibilidade, da 03G, da
    Anthropic e de limites compartilhados.

### P3: evoluções posteriores

- leitura das mãos com IA;
- capítulos 6–8 completos;
- cadastro e dashboard;
- recuperação de relatórios por conta;
- produtos avulsos do catálogo;
- IA nos textos astrológicos.

## 5. Próxima ação recomendada

**P0-1.** O responsável executa a jornada da seção 1.1 na URL real, pelo
caminho sem foto e com o caso fictício de Recife 1986, e informa o
resultado de cada etapa. Sem essa comprovação, nenhuma etapa seguinte
(beta ou venda) tem base.
