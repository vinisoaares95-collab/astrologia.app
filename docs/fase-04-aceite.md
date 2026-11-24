# Fase 04 — Aceite final do relatório integrado (04E.3)

Registro de 24/11/2026, sobre o commit `ccd9e50`.

**Decisão registrada:** o relatório de nove capítulos está **aceito para uso
interno** (técnico e editorial). **Não está apto ao lançamento comercial:**
os bloqueios estão na seção 5.

Nesta etapa não houve:

- código novo ou mudança de texto;
- chamada paga;
- deploy.

Este documento consolida as fases 04A a 04E.2B. Os detalhes continuam nos
documentos de cada subfase, citados aqui sem repetição.

## 1. Estado das subfases

| Subfase | Entrega                                                                                                                        | Commit(s)             | Documento                                                                      | Estado                                                                             |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Plano   | Diagnóstico, etapas, riscos e decisões 1–6                                                                                     | `da0071a`             | `fase-04-plano.md`                                                             | Aprovado                                                                           |
| 04A     | Contrato `IntegratedReport`, leitor dos nove capítulos, estados, demonstração interna isolada, diagnóstico da licença do motor | `09856a8`             | `fase-04a-relatorio-integrado.md`, `fase-04a-licenca-motor.md`                 | Concluída                                                                          |
| 04B     | Resultado das mãos na jornada, só texto e sem foto; descarte ao sair ou recarregar                                             | `49b5e98`             | `fase-04b-jornada.md`                                                          | Concluída                                                                          |
| 04C     | Capítulos 1–5 do motor e da biblioteca na jornada (atrás de `SIDERA_INTERNAL_ENGINE`)                                          | `25c54c1`             | `fase-04c-capitulos-astrologicos.md`                                           | Concluída                                                                          |
| 04D     | Especificação, biblioteca e implementação dos capítulos 8 e 9                                                                  | `5033f86` → `988a717` | `fase-04d-biblioteca-consolidada.md` (referência), `fase-04d-implementacao.md` | Concluída                                                                          |
| 04E.1   | Auditoria, correções pontuais de português e regressões                                                                        | `a2fae01`, `26cfd73`  | `fase-04e1-auditoria.md`                                                       | Concluída                                                                          |
| 04E.2A  | Ressalvas do capítulo 8 em dois níveis; âncoras sob o cabeçalho                                                                | `324e3be`             | `fase-04e2a-leitura.md`                                                        | Concluída                                                                          |
| 04E.2B  | Avaliação editorial e correções T1–T6                                                                                          | `34cb9d2`, `ccd9e50`  | `fase-04e2b-revisao-editorial.md`                                              | Concluída. T1–T6 aprovadas pela responsável editorial após a leitura do apêndice A |
| 04E.3   | Aceite final (este documento)                                                                                                  | —                     | `fase-04-aceite.md`                                                            | Concluída                                                                          |

As decisões 1–6 do plano foram tomadas assim:

1. Motor só no ambiente interno até a decisão de licença.
2. Especificação própria para os capítulos 8 e 9.
3. Estado da jornada em memória e descartado.
4. Biblioteca por padrão nos capítulos 1–5; IA só com avaliação autorizada.
5. A leitura fica em `/relatorio/leitura`.
6. Parte II indisponível e explicada quando não há leitura das mãos.

## 2. Critérios aprovados

| #   | Critério                                       | Evidência                                                                                                                                                                                                                                                                                                                       | Resultado              |
| --- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| 1   | **Contratos e estrutura dos nove capítulos**   | `integrated/build.test.ts`, `report-reader.test.tsx`. Número e título de cada capítulo conferidos com `reportParts` (erro se divergirem). 04D: "9 de 9" na jornada completa                                                                                                                                                     | Aprovado               |
| 2   | **Integração dos motores**                     | 04C: ação do servidor, uma por envio, sem dados de nascimento na saída (`sky-actions.test.ts`; 04C 34/34). Capítulos 6–7 do motor das mãos (03E), em modo simulado. Capítulos 8–9 montados no navegador a partir das referências dos capítulos anteriores (04D)                                                                 | Aprovado               |
| 3   | **Rastreabilidade**                            | Cada seção dos capítulos 1–7 leva os ids de item e de fato (`generate.test.ts`, validadores de rascunho). Os capítulos 8 e 9 guardam a seleção com as referências usadas; um teste confere em todas as combinações que cada tema vem de item apresentado (`journey-chapters.test.ts`). Nenhum id interno aparece no texto (04D) | Aprovado               |
| 4   | **Limites de precisão do mapa natal**          | Notas de intervalo e de horário aproximado ou desconhecido; casas, Ascendente e regente fora quando incertos (04C, com resposta atrasada e horários aproximado e desconhecido). Posições incertas fora do capítulo 8, com a ressalva de horário                                                                                 | Aprovado               |
| 5   | **Observações incertas das mãos**              | Mão parcial: o traço fica fora das conexões e entra a ressalva de parcialidade (04D parcial 12/12). Traços instáveis ou estimados por proporção (D3/D4) nunca sustentam tema. Foto insuficiente: capítulos indisponíveis com o motivo real (04D 16/16). Nova foto pedida: o capítulo 8 diz que não há observação nítida         | Aprovado               |
| 6   | **Seleção determinística dos capítulos 8 e 9** | Testes nas 84 combinações e nos casos construídos. Varredura da 04E.2B (16.560 combinações) com saída idêntica byte a byte em duas execuções, e seleção idêntica antes e depois das correções editoriais                                                                                                                        | Aprovado               |
| 7   | **Perguntas e textos editoriais aprovados**    | Textos dos capítulos 8 e 9 conferidos literalmente com o documento consolidado (`library.test.ts`). T1–T6 com testes literais (`editorial-04e2b.test.ts`, `chapters.test.ts`). Perguntas do capítulo 9 inéditas em relação às dos capítulos 1–7. 2 perguntas por capítulo astrológico                                           | Aprovado               |
| 8   | **Disponibilidade e indisponibilidade**        | Seis estados na demonstração: completo, parcial, insuficiente, sem mãos, sem céu, carregando (04A 45/45). Causas U1–U6 e V1–V2 nos testes. Mensagem de indisponibilidade nunca recolhida (04E.2A)                                                                                                                               | Aprovado               |
| 9   | **Integridade da jornada**                     | Mãos → nascimento → oferta → leitura. Voltar e reabrir sem nova requisição. Recarregar ou sair apaga tudo. Resposta atrasada depois de sair não restaura nada (04B 28/28; 04C; 04D)                                                                                                                                             | Aprovado               |
| 10  | **Navegação desktop e mobile**                 | Desktop, iPhone 13 e iPhone SE emulados: sem rolagem horizontal; âncoras 35 px abaixo do cabeçalho fixo; sumário, Voltar e seção expansível (04E.1 36/36; 04E.2A 93/93)                                                                                                                                                         | Aprovado, em emulação  |
| 11  | **Acessibilidade automatizada**                | axe WCAG 2.0/2.1 A e AA sem violações em todos os estados e telas (04A, 04D, 04E.2A, com a seção aberta e fechada). Teclado: Tab, Enter e Espaço, com foco visível. Estado expandido exposto na árvore de acessibilidade                                                                                                        | Aprovado, automatizado |
| 12  | **Descarte de fotos e estado temporário**      | D5 17/17: nenhum `blob:` no DOM, inclusive nas rotas ocultas. Nada em localStorage, sessionStorage, cookies ou IndexedDB. Nenhuma requisição a outros hosts (04E.1). As referências dos capítulos 8 e 9 não guardam data, hora, local, graus nem imagem                                                                         | Aprovado               |
| 13  | **Isolamento das demonstrações**               | `?cenario=` sem `SIDERA_REPORT_DEMO` não mostra exemplos (04E.1). Build de produção sem flags (sondagem desta etapa): `/relatorio/leitura` 404; API das mãos 404. Com a análise habilitada em produção: 503 na mesma origem e 403 em outra                                                                                      | Aprovado               |

## 3. Evidências de testes (commit `ccd9e50`)

Árvore limpa e igual a `origin/claude/exciting-hypatia-1r64k7`.

| Verificação                                                  | Aprovados | Ignorados | Falhos |
| ------------------------------------------------------------ | --------- | --------- | ------ |
| `npm run check`: typegen, tsc, eslint e Vitest (75 arquivos) | **1284**  | 42        | **0**  |
| `npm run build`                                              | aprovado  | —         | —      |

Os 42 ignorados (5 arquivos) são suítes pagas ou de avaliação, desligadas
por projeto: `SIDERA_AI_PAID_TESTS` e os modos de avaliação das mãos.

**Regressões de navegador** (Chromium do ambiente; mobile emulado):

| Roteiro                                                                                                      | Verificações      | Falhas |
| ------------------------------------------------------------------------------------------------------------ | ----------------- | ------ |
| 04A demonstração (`next start`)                                                                              | 45                | 0      |
| 04B jornada                                                                                                  | 28                | 0      |
| 04C com motor / sem motor                                                                                    | 34 / 18           | 0      |
| 04D: com motor e mão clara / com motor e mão parcial / sem motor e mão clara / sem motor e foto insuficiente | 36 / 12 / 12 / 16 | 0      |
| D5 descarte da foto                                                                                          | 17                | 0      |
| 04E.1 auditoria                                                                                              | 36                | 0      |
| 04E.2A mão clara / mão parcial                                                                               | 48 / 45           | 0      |
| **Total: 12 execuções**                                                                                      | **347**           | **0**  |

Sondagem do build de produção: seção 2, critério 13.

**Problemas encontrados nesta etapa:** nenhum. **Correções:** nenhuma.

Observação sobre o roteiro `04e2a-leitura.mjs`: com a pasta de capturas
vazia na linha de comando, os argumentos se deslocam e as capturas vão para
uma pasta "depois". As verificações não são afetadas. Use sempre um caminho
explícito.

Não repeti nesta etapa as varreduras e simulações editoriais: os
resultados da 04E.2B (seção 8.4) valem para o mesmo código.

## 4. Limitações aceitas

Não são defeitos bloqueantes para o uso interno.

**Editoriais** (detalhe em `fase-04e2b-revisao-editorial.md`, seções 2 e 8.3):

- **E5:** função de Júpiter ou Saturno repetida em duas frases do capítulo
  5; qualidades do mesmo signo repetidas num capítulo.
- **E7:** a ideia de "combina e não combina" aparece em 4 perguntas.
- **E8:** a pergunta de vínculo do capítulo 9 se parece com a segunda do
  capítulo 4.
- **E9:** a fórmula "Com X em Y, a tradição associa…" se repete.
- **E10:** a pergunta de pensamento é genérica.
- O eco "dessas/nessas" nas perguntas dos capítulos 6–7.
- Os capítulos 5 e 6 nunca entram no capítulo 9. É consequência das regras
  aprovadas (Saturno e Júpiter sem assunto; D3 e D4).
- **Diversidade do capítulo 9:** a pergunta de identidade aparece em ~99%
  dos guias, e há poucos conjuntos de perguntas. É estrutural, não defeito
  de integração.

**Natureza da revisão editorial.** A revisão das fases 04E.1–04E.2B foi
**assistida por IA**: varreduras automáticas e leitura dos relatórios pelo
assistente. A responsável editorial revisou os dois relatórios completos do
apêndice A e aprovou T1–T6. **Ainda não houve validação com leitores
reais.** Nada aqui mede compreensão, utilidade percebida ou reação das
pessoas.

**Técnicas:**

- Jornada testada no servidor de desenvolvimento. Em produção, a leitura das
  mãos responde 503 por projeto (03G.3).
- Mobile só emulado; só Chromium; leitores de tela não testados (só a árvore
  de acessibilidade).
- Desempenho medido em desenvolvimento (`fase-04e1-auditoria.md` §5). Não
  representa produção.
- Leitura das mãos sempre **simulada** nesta fase. Não houve análise visual
  real.
- Capítulos 1–7 só da biblioteca. O caminho com IA não foi exercitado na
  Fase 04.
- Ressalvas técnicas do capítulo 8 recolhidas por padrão. Não se sabe se as
  pessoas as abrem.

## 5. Pendências e bloqueios de comercialização

Situação atual:

- **Nenhuma pendência bloqueia o uso interno** (simulado, com flags).
- A produção continua bloqueada no código.

| Prioridade | Pendência                                                                                          | Bloqueia                                                               | Situação e próximo passo                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Onde está                                                      |
| ---------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1          | **Consistência e repetibilidade da análise visual das mãos**                                       | **Lançamento comercial** (a Parte II real depende dela)                | Plano do experimento pronto, não executado. Exige nova autorização dos participantes e chamadas pagas. Com o resultado, decidir o escopo dos capítulos 6–7 e reavaliar D3 e D4                                                                                                                                                                                                                                                                                                        | `experimento-repetibilidade-visual.md`, `fase-03f2-plano.md`   |
| 2          | **Licença do Swiss Ephemeris** (AGPL ou Professional License da Astrodienst)                       | **Lançamento comercial** (capítulos 1–5 num serviço público)           | Escolha obrigatória antes de ativar qualquer serviço público. Confirmar termos e preço no site oficial; revisão jurídica. Os nomes da Astrodienst não podem ser usados na promoção                                                                                                                                                                                                                                                                                                    | `fase-04a-licenca-motor.md`, `DECISIONS.md`                    |
| 3          | **Conclusão da 03G:** privacidade, infraestrutura, retenção, consentimento e segurança em produção | **Lançamento comercial**                                               | Os 8 itens de `11-pendencias-antes-do-lancamento.md`, todos abertos: prazo de retenção dos consentimentos; retenção após a revogação; exclusão de temporários e backups; hospedagem, banco e limpeza; limites entre instâncias e proxy; política e consentimento, com revisão jurídica e transferência internacional; identificação da empresa (CNPJ); rótulo "Descartar". **Acréscimo da Fase 04:** citar na política as referências dos capítulos 8 e 9 guardadas na memória da aba | `docs/privacidade/` (05 a 11)                                  |
| 4          | **Funcionalidades comerciais**                                                                     | **Lançamento comercial**                                               | Não desenvolvidas: checkout e pagamento, entrega do relatório (PDF), contas, painel, complementos (order bumps). O pagamento aparece desabilitado na oferta                                                                                                                                                                                                                                                                                                                           | `fase-04-plano.md` §4                                          |
| 5          | **Navegadores e aparelhos reais**                                                                  | **Lançamento comercial**                                               | Safari (iOS e macOS), Firefox, Android e iPhone físicos, VoiceOver e TalkBack. Baixo custo, sem chamadas pagas                                                                                                                                                                                                                                                                                                                                                                        | este documento, §4                                             |
| 6          | **Avaliação com leitores reais**                                                                   | **Lançamento comercial**, como recomendação forte (decisão do negócio) | Compreensão das ressalvas, utilidade dos capítulos 8–9, tom geral. Exige protocolo e consentimento dos participantes                                                                                                                                                                                                                                                                                                                                                                  | `fase-04e2b-revisao-editorial.md` §8.7                         |
| 7          | **Geração dos textos por IA** (capítulos 1–5 com Haiku; 6–7 com a geração da 03E)                  | **Só a funcionalidade opcional**, se entrar na oferta                  | Validação paga autorizada: qualidade e se as repetições corrigidas voltam. Exige textos de privacidade próprios (fatos do mapa enviados ao provedor) e medição de latência e custo. Sem ela, a biblioteca atende ao relatório completo                                                                                                                                                                                                                                                | `fase-02f-geracao-com-ia.md`, `fase-03e-capitulos-das-maos.md` |

A análise visual das mãos por IA (Sonnet, 03D) **não é opcional**: uma
leitura real das mãos depende dela. Por isso ela entra nos itens 1 e 3
(repetibilidade e transferência internacional), e não no 7.

## 6. Recomendação para a próxima fase

**Recomendação:** que a Fase 05 trate **primeiro da viabilidade dos
bloqueios externos**, antes de qualquer funcionalidade comercial. Ordem
proposta:

1. **Experimento de repetibilidade visual (pendência 1).**
   - O resultado pode mudar o escopo da Parte II, e com ele o que se vende.
   - Precisa de autorização específica: custo, teto e novas autorizações
     dos participantes.
2. **Decisões de prazo longo, em paralelo, fora do código:**
   - licença do Swiss Ephemeris (2);
   - constituição da empresa e revisão jurídica da política (3, itens 6 e 7).
3. **Só depois,** infraestrutura de produção da 03G (3) e funcionalidades
   comerciais (4), com testes em aparelhos reais (5) e avaliação com
   leitores (6) antes da abertura.

Não avancei para a Fase 05.
