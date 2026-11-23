# Fase 03G — pendências anteriores ao lançamento (consolidação)

**Registro de 23/11/2026, no encerramento técnico do Bloco 2** (commit
`f01efc9`). Nada disto foi implementado nesta entrega.

- **Situação do produto:** produção continua bloqueada pelo código. Não há
  deploy nem ativação comercial.
- **Para que serve este documento:** reúne num só lugar o que já está
  registrado nos documentos 05 a 10 desta pasta.

| #   | Pendência (requisito antes do lançamento)                                      | Situação                                                                                                                                                             | Onde está detalhada                     |
| --- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1   | **Fundamentação jurídica do prazo de retenção dos consentimentos**             | aberta. `SIDERA_CONSENT_RETENTION_DAYS` sem valor padrão; sem ela, o registro não liga                                                                               | `09` (D1), `10` §4                      |
| 2   | **Regras de retenção após a revogação**                                        | aberta. Implementado: o revogado fica até o prazo; falta validar                                                                                                     | `09` §3 (D2), `10` §1.3                 |
| 3   | **Exclusão dos resultados temporários, incluindo backups**                     | aberta. Deixam de ser lidos em 10 min; a exclusão física depende da limpeza e da janela de backup; bloqueado em produção (`SHARED_RESULTS_PRODUCTION_READY = false`) | `10` §2                                 |
| 4   | **Hospedagem, banco de produção e rotinas de limpeza**                         | aberta. Só existe a limpeza oportunista; a rotina agendada, os papéis do banco, o TLS e a restauração com limpeza dependem do provedor                               | `06` §5, `09` §7–8, `10` §4 (D7, T-b)   |
| 5   | **Limites compartilhados entre instâncias e configuração segura do proxy**     | aberta. Os limites por cliente e global estão em memória; a fonte do IP depende do proxy, e em produção, sem ela, a resposta é 503                                   | `07` §3, `08` §2 (R1–R5), `10` §4 (T-c) |
| 6   | **Política de Privacidade e consentimento atualizados**                        | aberta. Minutas da 03G.1; faltam a evidência guardada, o resultado compartilhado (se ativado), a transferência internacional, o Marco Civil e a revisão jurídica     | `02`, `03`, `06` §6, `10` §4 (T-a)      |
| 7   | **Identificação jurídica da futura empresa Cation Digital**                    | aberta. A empresa ainda será constituída; sem CNPJ nem enquadramento; nenhum dado fictício                                                                           | `06` §1 (D6)                            |
| 8   | **A ação "Descartar" comunicar corretamente seu efeito sobre o consentimento** | aberta (detalhe abaixo)                                                                                                                                              | este documento                          |

## Detalhe do item 8

Verificação feita no código, sem alteração.

| Onde                                     | Rótulo atual                             | O que faz com o registro ligado                                                                          |
| ---------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Prévia (`demo-preview.tsx`, dois pontos) | "Descartar foto e sair"                  | descarta tudo no aparelho **e revoga o consentimento no servidor** (`withdraw` → `revokeConsentReceipt`) |
| Consentimento (`consent-form.tsx`)       | "Retirar consentimento e descartar foto" | o mesmo, e o rótulo já diz isso                                                                          |
| Sair do fluxo por navegação (D5)         | —                                        | descarta no aparelho e **não revoga**                                                                    |

**Lacuna.** O rótulo da prévia não diz que o consentimento é retirado, e
nenhuma das telas explica o que significa revogar:

- novas análises com aquele recibo deixam de ser possíveis;
- o que já foi enviado segue as regras do provedor;
- a evidência fica até o prazo.

**Antes do lançamento:**

- **Opção A:** ajustar o rótulo e a mensagem.
- **Opção B:** separar "descartar foto" de "retirar consentimento".

A escolha deve vir junto com os textos do item 6.

## Pendências fora da 03G que continuam valendo

- **Reprodutibilidade das observações visuais (03F.2):** não validada; o
  lançamento comercial está condicionado a ela
  (`docs/experimento-repetibilidade-visual.md`, plano não executado).
- **Licença do motor astrológico:** o Swiss Ephemeris (AGPL) roda só em
  ambiente interno até a decisão de licenciamento (`docs/DECISIONS.md`).
