# Pendências de privacidade — decisões e confirmações

**Fase 03G.1 (23/11/2026).**

**Prioridades:**

- **P0:** bloqueia uso público ou comercial.
- **P1:** antes de escala.
- **P2:** proporcional.

**Responsáveis:**

- **Responsável:** quem decide pelo Sidera.
- **Jurídico:** assessoria em LGPD.
- **Técnico:** implementação, na 03G.3.

## Definições da empresa

| #   | Pendência                                                                                             | Prioridade | Decide                         |
| --- | ----------------------------------------------------------------------------------------------------- | ---------- | ------------------------------ |
| E1  | Razão social, CNPJ e endereço do controlador; confirmar se "Cation Digital" é a mesma pessoa jurídica | P0         | Responsável                    |
| E2  | Encarregado (ou canal, se o regime de pequeno porte permitir) e e-mail de privacidade                 | P0         | Responsável + Jurídico         |
| E3  | Provedor de hospedagem, região, o que os logs registram e por quanto tempo, HTTPS/HSTS                | P0         | Responsável (Técnico confirma) |
| E4  | Quem guarda a tabela de pseudônimos das avaliações                                                    | P1         | Responsável                    |

## Confirmações externas

| #   | Pendência                                                                                                                                                            | Prioridade | Decide                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------- |
| X1  | Retenção da Anthropic: conferir o texto e as exceções da página oficial e as condições efetivas da conta (organização, contrato aceito, existência de retenção zero) | P0         | Responsável (na conta)       |
| X2  | Se vale pedir retenção zero (ZDR) e se a Anthropic a oferece para a conta                                                                                            | P1         | Responsável                  |
| X3  | Se a Anthropic aceita as cláusulas-padrão da ANPD (Res. 19/2024) ou tem instrumento equivalente para o Brasil                                                        | P0         | Responsável + Jurídico       |
| X4  | Suboperadores da Anthropic (lista do DPA, não lida)                                                                                                                  | P1         | Jurídico                     |
| X5  | Leitura dos textos oficiais (LGPD, Res. 19/2024, Res. 2/2022, Res. 15/2024, Marco Civil); a sessão não acessa esses domínios                                         | P0         | Jurídico (ou liberar a rede) |

## Decisões jurídicas

| #   | Pendência                                                                                                                  | Prioridade | Decide                 |
| --- | -------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------- |
| J1  | Classificação da foto da palma (sensível ou não); proposta: proteção de dado sensível por precaução                        | P0         | Jurídico               |
| J2  | Hipótese legal por categoria (matriz em `01`)                                                                              | P0         | Jurídico               |
| J3  | Mecanismo da transferência: cláusulas da ANPD ou consentimento específico e destacado (define se há a 3ª caixa)            | P0         | Jurídico               |
| J4  | Marco Civil, art. 15: obrigação de guardar registros de acesso por 6 meses, e como isso se combina com a minimização       | P0         | Jurídico               |
| J5  | Prova do consentimento: manter sem registro ou guardar registro mínimo (versão, data, código do recibo, sem foto e sem IP) | P0         | Jurídico + Responsável |
| J6  | Enquadramento como agente de pequeno porte e efeitos (encarregado, prazos, relatório de impacto)                           | P1         | Jurídico               |
| J7  | Relatório de impacto simplificado da foto: necessário, e em que formato                                                    | P1         | Jurídico               |
| J8  | Retenção das avaliações internas (proposta: até o fim da Fase 04 ou 6 meses)                                               | P1         | Responsável + Jurídico |
| J9  | Revisão final da política, do consentimento e dos avisos (03G.4)                                                           | P0         | Jurídico               |

## Implementação (03G.3, depois das decisões acima)

| #   | Pendência                                                                                               | Prioridade | Depende de        |
| --- | ------------------------------------------------------------------------------------------------------- | ---------- | ----------------- |
| T1  | Página da política e link no rodapé, no consentimento e no formulário de nascimento                     | P0         | E1, E2, J9        |
| T2  | Consentimento v03g (versão `03g.1`)                                                                     | P0         | J1, J3, X1        |
| T3  | FAQ de `/como-funciona` e aviso dos dados de nascimento corrigidos; comentário de `birth-data-form.tsx` | P0         | X1 (prazo citado) |
| T4  | Hash de IP com segredo (HMAC) e limpeza das chaves após 1 h                                             | P1         | —                 |
| T5  | Orientação de captura: só a palma, sem anéis, tatuagens e objetos                                       | P1         | —                 |
| T6  | Registro mínimo de consentimento, se J5 decidir por ele                                                 | P0         | J5                |
| T7  | CSP e revisão de cabeçalhos                                                                             | P1         | E3                |

## Fora da 03G

- **Fase 04:** IA no mapa natal (Fase 02F, hoje sem página) e pagamento.
  Exigirão revisão deste inventário.
- **Experimento de repetibilidade visual:** tem plano próprio. Se for
  autorizado, o novo envio das fotos precisa de nova autorização dos
  participantes, com os mesmos cuidados.
