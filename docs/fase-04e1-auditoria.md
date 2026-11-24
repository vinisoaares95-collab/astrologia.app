# Fase 04E.1 — Auditoria do relatório integrado (relatório final)

Estado: **concluída, só interna.** Todas as regressões de navegador pedidas
foram executadas **depois** das correções desta etapa, sem nenhuma falha.

Não houve:

- deploy;
- chamada paga ou foto real;
- experimento de repetibilidade;
- mudança nos motores de cálculo astrológico e visual das mãos;
- mudança no consentimento da 03G;
- funcionalidade nova (checkout, PDF).

Convenção: **[comprovado]** é um problema reproduzido e medido;
**[hipótese]** e **[oportunidade]** ainda precisam de avaliação com pessoas
ou de decisão.

## 1. Funcionalidades verificadas

| Funcionalidade                                          | Como                                                                        | Resultado                                                             |
| ------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Jornada mãos → prévia → nascimento → oferta → relatório | `04d-jornada.mjs`, `04e1-auditoria.mjs`                                     | Aprovada (desktop, iPhone 13, iPhone SE)                              |
| Nove capítulos                                          | Recife (exato) + mão clara                                                  | 9 de 9                                                                |
| Capítulos 1–5 sem mãos                                  | Direto ao nascimento                                                        | Capítulo 8 com U1; capítulo 9 só com o céu; 6 de 9                    |
| Mãos sem mapa                                           | Motor desligado                                                             | Capítulo 8 com U2; capítulo 9 só com o capítulo 7; 3 de 9             |
| Mãos parciais                                           | Cenário `partial`                                                           | Traço parcial fora das conexões, com R-parcial; capítulo 9 disponível |
| Capítulo 8 indisponível e 9 disponível                  | São Paulo, horário desconhecido                                             | U6 com a causa real                                                   |
| Horário aproximado e desconhecido                       | `04c-relatorio.mjs`; testes de unidade (R-hora)                             | Limites preservados; posição incerta fora das comparações             |
| Falta de conteúdo                                       | Foto insuficiente + motor desligado                                         | Capítulos 8 (U3) e 9 (V1) indisponíveis; 0 de 9                       |
| Indicadores, sumário, âncoras, Voltar e teclado         | `04e1-auditoria.mjs`                                                        | Corretos                                                              |
| Demonstração isolada                                    | `04a-leitura.mjs`; `?cenario=` na leitura real                              | Demonstração aprovada; `?cenario=` sem a flag responde 404            |
| Privacidade da jornada                                  | Unidade e navegador                                                         | Seção 6                                                               |
| Leitura editorial dos nove capítulos                    | 5 relatórios completos montados com os motores do produto, lidos na íntegra | Seções 2 e 7                                                          |

## 2. Problemas encontrados e causas

| #   | Problema                                                                                                                                                                                                        | Causa                                                                                                                               | Classe                                                        | Estado                                                                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| P1  | Frases de diferença do capítulo 8 sempre no plural ("estes traços", "as posições citadas… são associadas"), mesmo com uma só referência; contraponto com "imagens", sendo o outro lado sempre uma única posição | Textos da biblioteca 04D escritos para o caso geral; com F1 e F2, o céu tem 1 posição comparável quase sempre (Marte; Lua ou Vênus) | [comprovado]                                                  | Corrigido                                                              |
| P2  | "associa … às viagens, os estudos e a busca de sentido" (capítulos 1–5)                                                                                                                                         | `toPrep` contraía só o primeiro artigo da área da casa                                                                              | [comprovado]                                                  | Corrigido                                                              |
| P3  | "o afeto, o prazer e a forma de se vincular … ganha peso"                                                                                                                                                       | Verbo fixo no singular para sujeitos compostos                                                                                      | [comprovado]                                                  | Corrigido (Mercúrio mantém "ganha", porque sua função é um só sujeito) |
| P4  | Aviso de leitura simulada três vezes (Parte II, limites do capítulo 8, Parte III)                                                                                                                               | Aviso de interface da Parte III, acrescentado na 04D, sobreposto à ressalva R-simulada                                              | [comprovado]                                                  | Corrigido                                                              |
| P5  | Limites do capítulo 8 maiores que o texto personalizado                                                                                                                                                         | 4 a 5 ressalvas aprovadas para 1 tema                                                                                               | [comprovado] (85 × 105 palavras; quase uma tela no iPhone SE) | Pendente (decisão)                                                     |
| P6  | Repetições no texto composto dos capítulos 1–5                                                                                                                                                                  | Modelos 02E somam função + área ou qualidades do signo                                                                              | [comprovado]                                                  | Pendente (decisão)                                                     |
| P7  | Capítulo 9 pouco diferenciado                                                                                                                                                                                   | A pergunta de identidade quase sempre presente                                                                                      | [comprovado] (12 combinações de perguntas em 84)              | Pendente (decisão)                                                     |
| P8  | "Construir com as próprias mãos" pode soar como alusão à leitura das mãos                                                                                                                                       | Texto autoral do elemento Terra (02E)                                                                                               | [hipótese]                                                    | Pendente (decisão)                                                     |
| P9  | Roteiro D5 falhava antes de clicar                                                                                                                                                                              | Clique antes da hidratação                                                                                                          | [comprovado], só no roteiro                                   | Corrigido                                                              |
| P10 | Roteiro 04E.1 travava                                                                                                                                                                                           | Esperava o fim de uma resposta em fluxo                                                                                             | [comprovado], só no roteiro                                   | Corrigido                                                              |

Não são defeitos:

- **Capítulos 5 e 6 sem temas no capítulo 9:** Saturno e Júpiter não têm
  assunto aprovado (`d71f524`), e os itens do capítulo 6 estão todos
  excluídos por D3 e D4. É consequência legítima das regras, não defeito
  de integração.
- **O selo "N"** nas capturas é do servidor de desenvolvimento.

## 3. Correções pontuais realizadas

| #       | Correção                                                                                                                                                                                                          | Arquivos                                                                              | Teste novo                       |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------- |
| P1      | Marcadores `{traço}`, `{posição}` e `{associada}` concordando com o número real de referências; contraponto no singular; biblioteca `04d.2`; documento consolidado atualizado (tabela de concordância e exemplos) | `journey-chapters/library.ts`, `render.ts`, `docs/fase-04d-biblioteca-consolidada.md` | Concordância nas 165 combinações |
| P2      | `toPrep` contrai o artigo de cada item da área                                                                                                                                                                    | `interpretation/engine.ts` (só português)                                             | 24 mapas                         |
| P3      | "ganham" para sujeitos compostos; "ganha" para Mercúrio                                                                                                                                                           | `interpretation/engine.ts` (só português)                                             | 24 mapas                         |
| P4      | Aviso da Parte III só quando o capítulo 9 usa as mãos e o capítulo 8 não está disponível                                                                                                                          | `integrated/build.ts`, `journey/journey-reading.tsx`                                  | 2 casos                          |
| P9, P10 | Esperas corretas nos roteiros                                                                                                                                                                                     | `scripts/e2e/d5-saida-do-fluxo.mjs`, `04e1-auditoria.mjs` (novo)                      | —                                |

Não mudaram:

- cálculos, seleção de itens, associações, regras aprovadas ou consentimento;
- os instantâneos de referência do motor de interpretação (nas fixtures, o
  regente é Mercúrio).

## 4. Resultados dos testes e do build

Todos executados depois das correções.

| Verificação                                                                                | Resultado                                                                       |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `npm run check` (typegen, tsc, eslint, Vitest)                                             | **1271 aprovados**, 42 ignorados (pagos e de avaliação, desligados por projeto) |
| `npm run build`                                                                            | Aprovado                                                                        |
| **04A** `04a-leitura.mjs` (`next start` com a demonstração; desktop, iPhone 13, iPhone SE) | **45/45**: rolagem, axe WCAG A/AA, teclado e foco                               |
| **04B** `04b-jornada.mjs`                                                                  | **28/28**                                                                       |
| **04C** `04c-relatorio.mjs` com motor                                                      | **34/34**: inclui resposta atrasada e horário aproximado ou desconhecido        |
| **04C** sem motor                                                                          | **18/18**                                                                       |
| **04D** `04d-jornada.mjs`, motor ligado e mão clara                                        | **36/36**: inclui axe sem violações                                             |
| **04D** motor ligado e mão parcial                                                         | **12/12**                                                                       |
| **04D** motor desligado e mão clara                                                        | **12/12**                                                                       |
| **04D** motor desligado e foto insuficiente                                                | **16/16**                                                                       |
| **D5** `d5-saida-do-fluxo.mjs`                                                             | **17/17**                                                                       |
| **04E.1** `04e1-auditoria.mjs` (novo; desktop, iPhone 13, iPhone SE)                       | **36/36**                                                                       |

**Total de navegador: 254 verificações, 0 falhas.**

**Não executados, com justificativa:**

- **Jornada em build de produção:** a leitura das mãos responde 503 por
  projeto (03G.3). Por isso os roteiros de jornada usam `next dev`; a 04A
  usa `next start`.
- **Firefox, Safari e aparelhos reais:** só o Chromium do ambiente está
  disponível. O mobile é emulação.
- **Fotos reais, IA e repetibilidade:** exigem autorização e custo.

## 5. Medições de desempenho

Condições: servidor de **desenvolvimento** neste contêiner (4 vCPU, 16 GB,
Node 22.23), Chromium do Playwright, mobile **emulado**, leitura das mãos
simulada.

| Medida                                                    | Valor                         |
| --------------------------------------------------------- | ----------------------------- |
| Mapa + interpretação no servidor (Node, 30 mapas)         | ~1,2 ms por mapa              |
| Ação de servidor do céu, medida no navegador (rede local) | 77–127 ms                     |
| Da confirmação até a leitura pronta (oferta → leitura)    | 0,8–1,2 s                     |
| Montagem dos capítulos 8 e 9 (Node; 165 combinações × 20) | ~0,024 ms por chamada         |
| Pontes na memória (céu + mãos)                            | média ~1,6 KB; máximo ~2,2 KB |
| Heap JS: início → leitura → depois de sair                | ~11 → 24–28 → 27–29 MB        |
| Heap JS após 3 jornadas seguidas                          | 17–23 MB, sem crescimento     |

Limitações:

- **Ambiente:** `next dev` compila sob demanda e não otimiza, então os
  tempos não valem para produção.
- **Heap ao sair:** depois de sair, ele não volta ao valor inicial porque o
  `<Activity>` do Next mantém até 3 rotas ocultas. Os dados da jornada são
  apagados (verificado), mas a estrutura das telas fica em memória.
- **Aparelhos:** sem medição em aparelho real nem em rede móvel.

## 6. Privacidade e segurança

Verificado:

- **Pontes dos capítulos 8 e 9:** levam só ids de itens, rótulos já exibidos
  e polos. Nenhuma data, hora, local, graus, evidência, mão ou imagem
  (testes de cópia campo a campo e de ausência).
- **Foto:** nenhum `blob:` no DOM depois da prévia; a D5 está intacta (17/17).
- **Respostas atrasadas** depois de sair não restauram dados (04C).
- **Sair (X), recarregar ou fechar** apagam a jornada (04B, 04C, 04D, 04E.1).
- **Armazenamento do navegador:** nada em `localStorage`, `sessionStorage`,
  cookies ou IndexedDB; nenhuma requisição a outros hosts.
- **Demonstração isolada:** `?cenario=` sem a flag responde 404.

Pendências (não resolvidas nesta etapa):

1. **Revisão das pontes:** antes de qualquer ambiente fora do interno,
   revisar se rótulos como "Sol em Touro" na memória da aba exigem menção
   na política de privacidade (já constam no inventário D3 e D9).
2. **Registro de consentimento em produção** e licença do motor (AGPL):
   bloqueios já registrados.
3. **Heap com rotas ocultas:** confirmar em produção que a estrutura mantida
   pelo `<Activity>` não guarda texto da leitura após sair [hipótese; os
   testes atuais não encontram texto].

## 7. Problemas editoriais e de UX

| Item                                                             | Situação                                                                                                                                             | Classe                                                         |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Excesso de texto nos limites do capítulo 8 em telas pequenas** | Num tema, 85 palavras de texto contra 105 de limites; no iPhone SE os limites ocupam quase uma tela (captura `04e1-iphoneSE-cap8-viewport`)          | [comprovado]                                                   |
| **Ressalvas técnicas numa seção expansível**                     | Mantém R0 visível e recolhe R-conf, R-escopo e R-simulada em "Ver limites desta comparação"                                                          | [oportunidade]; muda o design aprovado, exige aprovação        |
| **Repetição de avisos**                                          | Aviso de simulação reduzido a onde acrescenta (P4). Persistem: o aviso da Parte II e a R-simulada no capítulo 8 (2 menções)                          | Corrigido em parte; o restante é aceitável no ambiente interno |
| **Concordância singular e plural**                               | Corrigida no capítulo 8 (P1) e nos capítulos 1–5 (P2, P3); coberta por testes                                                                        | [comprovado], corrigido                                        |
| **Âncoras com cabeçalho fixo**                                   | Ao navegar pelo sumário, o título fica a ~280 px do topo, abaixo do cabeçalho (até 77 px), nas 3 telas; teclado com foco visível e Enter funcionando | Sem defeito                                                    |
| **Participação dos capítulos 5 e 6 na conclusão**                | 0 temas nas 84 combinações; consequência legítima das regras                                                                                         | [oportunidade] editorial                                       |
| **Diversidade das perguntas do capítulo 9**                      | Identidade quase sempre presente; 12 combinações de perguntas em 84                                                                                  | [comprovado]; decisão editorial                                |
| Repetições nos capítulos 1–5 (P6) e "próprias mãos" (P8)         | Biblioteca 02E                                                                                                                                       | [comprovado] / [hipótese]                                      |
| Legibilidade                                                     | Maior parágrafo dos capítulos 8–9: 48 palavras; sem rolagem horizontal; axe sem violações                                                            | Sem defeito                                                    |

## 8. Recomendações priorizadas para a 04E.2

1. **Limites do capítulo 8 em telas pequenas (alta).** Decidir entre
   agrupar as ressalvas técnicas numa só frase ou recolhê-las numa seção
   expansível, mantendo R0 sempre visível. Exige aprovação de texto ou de
   design.
2. **Diversidade do capítulo 9 (alta).** Decidir se a pergunta de identidade
   só entra quando falta um tema de eixo, ou se haverá perguntas de
   identidade variadas pelo signo do Sol (biblioteca nova, com aprovação).
3. **Participação dos capítulos 5 e 6 (média).** Decidir se Saturno e Júpiter
   ganham assunto e pergunta, com uma regra de uso. O capítulo 6 depende da
   revalidação visual (D4), que é paga e só com autorização.
4. **Revisão da biblioteca 02E (média).** Repetições e "próprias mãos" (P6,
   P8), sem mudar cálculos nem associações.
5. **Revisão visual em aparelho real e outros navegadores (média),** quando
   houver ambiente.
6. **Privacidade fora do interno (pré-requisito de lançamento):** pontes na
   política, consentimento em produção e licença do motor.

## Capturas

Em `docs/capturas/fase-04e1/`:

- `desktop-nove-capitulos`;
- `desktop-cap8-diferenca`;
- `mobile-cap9-completo`;
- `mobile-cap8-indisponivel`;
- `mobile-cap8-parcial`;
- `desktop-so-astrologia`;
- `mobile-cap9-so-maos`;
- `mobile-sem-conteudo`;
- `iphoneSE-cap8-viewport`.
