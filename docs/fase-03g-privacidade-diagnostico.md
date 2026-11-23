# Fase 03G — Privacidade e conformidade: diagnóstico e plano

Status: **diagnóstico para aprovação (23/11/2026).** Nenhum código foi
alterado, nada foi publicado e não houve chamada paga.

**Limites das fontes.**

- **Anthropic:** foram lidas as páginas oficiais da Anthropic (termos
  comerciais, DPA, retenção da API).
- **LGPD e ANPD:** os textos oficiais (planalto.gov.br, in.gov.br) e a
  página de retenção da Anthropic (privacy.claude.com) **não abriram
  neste ambiente**, porque os domínios não resolvem.
- **Requisitos legais:** abaixo, são referências a confirmar no texto
  oficial e com assessoria jurídica, não citações verificadas.

## 1. Inventário real dos dados

Levantado no código atual (`45d7885` + documentação).

| Dado                                                         | Onde fica                                                                | Por quanto tempo                                                          | Sai para                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Foto da palma (cópia redesenhada, sem EXIF/GPS)              | navegador, na memória da tela (inclui a "foto anterior", ao trocar)      | até descartar ou sair do fluxo                                            | —                                                            |
| Foto da palma                                                | servidor do Sidera, em memória                                           | durante a análise (≤ 55 s); não é gravada em disco, banco nem log         | **Anthropic (EUA)**, modelo Sonnet 5.5, ao tocar em Analisar |
| Resultado da análise (texto, sem foto) + hash da foto        | servidor, cache em memória                                               | **até 10 min** (apagado no vencimento)                                    | navegador                                                    |
| Consentimento (versão, 18+, autorização, data) e mão         | navegador, memória                                                       | até sair do fluxo                                                         | servidor recebe versão, 18+, autorização e mão para o recibo |
| Recibo assinado (mão, código aleatório, validade)            | navegador; o servidor não guarda o recibo                                | 30 min                                                                    | —                                                            |
| IP do cliente                                                | servidor: **hash SHA-256 sem sal** no limitador                          | janela de 1 h, mas as chaves só saem quando o limite de 10.000 é atingido | —                                                            |
| Dados de nascimento (data, hora, local)                      | navegador (formulário); servidor só normaliza e calcula (Server Actions) | durante o pedido; **nada é gravado**; o log de erro registra só o tipo    | —                                                            |
| Mapa natal calculado                                         | tela                                                                     | até sair                                                                  | —                                                            |
| Textos astrológicos por IA (02F)                             | sem rota pública; carga "sem dados pessoais"                             | —                                                                         | Anthropic (Haiku 5.5), quando ligado (Fase 04)               |
| Banco (Postgres/Prisma)                                      | preparado, sem uso ativo; só catálogo de produtos                        | —                                                                         | —                                                            |
| Cookies, `localStorage`, analytics, rastreadores             | **nenhum** (verificado no código)                                        | —                                                                         | —                                                            |
| Bases estáticas (IBGE, GeoNames, tzdb, efemérides)           | no servidor; nada da pessoa é enviado                                    | —                                                                         | —                                                            |
| Logs da hospedagem                                           | **a definir** (sem deploy); costumam guardar IP, URL e horário           | ?                                                                         | provedor de hospedagem                                       |
| Dados das avaliações internas (`avaliacao-ia/`, fora do Git) | contêiner de desenvolvimento                                             | **sem política definida**                                                 | —                                                            |

As avaliações internas guardam observações com evidência textual da palma
(sem imagem), pseudônimos M01–M04 e códigos de autorização. As fotos foram
apagadas em 19/11/2026.

## 2. Anthropic: o que as fontes oficiais dizem

Páginas lidas em 23/11/2026:

- **Termos comerciais** (vigentes desde 17/06/2025):
  - "Anthropic may not train models on Customer Content from Services";
  - o DPA é incorporado por referência;
  - quem está fora do EEE, Suíça e Reino Unido contrata com a
    **Anthropic, PBC (EUA)**.
- **DPA** (vigente desde 24/02/2025):
  - inclui as cláusulas contratuais padrão da UE (módulos 2 e 3);
  - aviso de incidente em 48 h;
  - exclusão até 30 dias após o fim do contrato, com exceções;
  - lista de suboperadores em página própria (não lida);
  - **não cita Brasil nem LGPD**.
- **"API and data retention"** (platform.claude.com, sem data):
  - "Conversation content (your prompts and Claude's outputs) is **not
    retained by default**";
  - os "Covered Models" (Fable 5, Mythos 5 e variantes) exigem retenção de
    30 dias;
  - conteúdo sinalizado por segurança pode ser mantido **até 2 anos**;
  - também há retenção por exigência legal;
  - existe Zero Data Retention (ZDR), mediante acordo com a Anthropic.

**Divergência a resolver.** O registro feito para a 03G foi "retenção
padrão de até 30 dias para entradas e saídas da API comercial, sujeita a
exceções". A página lida diz que, por padrão, o conteúdo não é retido.
Os 30 dias aparecem para os "Covered Models", e o Sidera usa Sonnet 5.5 e
Haiku 5.5, que não estão nessa lista.

Pode ser mudança recente ou diferença entre páginas. **Antes de qualquer
texto público:**

- confirmar na página de retenção (privacy.claude.com), no console da
  conta e, se preciso, com a Anthropic;
- confirmar qual regra vale para a organização usada;
- confirmar se há ZDR ou se faz sentido pedi-lo.

O consentimento atual não cita prazo e diz só que ele "será confirmado
antes do lançamento", o que continua correto.

## 3. Situação atual frente aos requisitos

As referências legais estão pendentes de confirmação no texto oficial.

| Tema                                                     | Situação no Sidera                                                                                                                                       | Lacuna                                                                                                                                                                                                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Finalidade e necessidade                                 | Foto usada só para a leitura; metadados removidos; nada gravado                                                                                          | —                                                                                                                                                                                                                                         |
| Natureza da foto da palma                                | Imagem do corpo; em alta resolução, contém a impressão palmar, que pode ser **dado biométrico**. O Sidera não a usa para identificar, mas o risco existe | Decidir, com assessoria, se a foto é tratada como dado sensível (recomendação: **tratar como sensível** por precaução, com consentimento específico e destacado)                                                                          |
| Consentimento                                            | Caixas não marcadas, finalidade, 18+, texto conforme o modo, versão `03f2.1`, retirada (descarte local)                                                  | Falta: identificação do controlador e contato; base legal explícita; destaque próprio para a foto e para a transferência internacional; revisão jurídica (o próprio texto diz "provisório")                                               |
| Transparência (aviso de privacidade)                     | Textos na jornada da foto (corrigidos na 03F.2)                                                                                                          | **Não há política de privacidade.** A FAQ de `/como-funciona` ainda diz "a foto é exibida apenas no seu navegador" (desatualizada). Os dados de nascimento não têm aviso próprio, além de "sem salvar nada"                               |
| Transferência internacional (EUA)                        | Informada no consentimento (modo real)                                                                                                                   | Definir o mecanismo: consentimento específico ou cláusulas contratuais, conforme a regulação da ANPD sobre transferência internacional (Res. CD/ANPD nº 19/2024, a confirmar). O DPA da Anthropic usa cláusulas da UE, não as brasileiras |
| Direitos do titular (acesso, eliminação, revogação etc.) | Na prática, quase nada fica guardado; a revogação é local                                                                                                | Falta **canal** (e-mail) e procedimento de resposta, inclusive para o que foi enviado à Anthropic                                                                                                                                         |
| Encarregado e contato                                    | —                                                                                                                                                        | Definir encarregado ou canal (agente de pequeno porte pode ter regime simplificado, a confirmar na Res. CD/ANPD nº 2/2022, que tem exceções para tratamento de alto risco ou de dado sensível)                                            |
| Registro das operações e relatório de impacto            | Inventário acima                                                                                                                                         | Formalizar o registro; relatório de impacto simplificado para a foto (dado possivelmente sensível + IA + transferência)                                                                                                                   |
| Segurança                                                | HTTPS na hospedagem; cabeçalhos básicos; sem gravação; limites; recibo assinado                                                                          | Hash de IP **sem sal** (IPv4 é enumerável) e chaves que não expiram; falta CSP e confirmação de HSTS; limites em memória de um só processo; logs da hospedagem indefinidos                                                                |
| Incidentes                                               | —                                                                                                                                                        | Plano curto de resposta e comunicação                                                                                                                                                                                                     |
| Crianças e adolescentes                                  | Autodeclaração de 18+                                                                                                                                    | Proporcional ao MVP; registrar a decisão                                                                                                                                                                                                  |
| Retenção e exclusão                                      | Servidor ≤ 10 min (resultado); foto não gravada                                                                                                          | Prazo do provedor (seção 2); política para `avaliacao-ia/`; prazo de logs da hospedagem                                                                                                                                                   |

## 4. Prioridades

**P0 — indispensáveis antes de lançamento comercial ou uso público**

1. Política de privacidade e aviso no fluxo:
   - quem é o controlador e o contato;
   - finalidades e bases legais;
   - dados tratados (foto, nascimento, IP);
   - compartilhamento com a Anthropic e transferência para os EUA;
   - retenção;
   - direitos e como exercê-los.

   Link no consentimento, no formulário de nascimento e no rodapé.

2. Consentimento da foto como **dado sensível**: específico e destacado,
   com a transferência internacional explícita. Nova versão e revisão
   jurídica.
3. Retenção da Anthropic confirmada para a conta e os modelos usados
   (resolver a divergência), e decisão sobre pedir ZDR. Texto público
   ajustado.
4. Canal de direitos do titular e procedimento simples, com prazo e
   registro.
5. Correção dos textos desatualizados:
   - a FAQ de `/como-funciona`;
   - o aviso dos dados de nascimento: são enviados ao servidor só para o
     cálculo e não são gravados.
6. Hospedagem: escolher o provedor, confirmar o que os logs guardam e por
   quanto tempo, não registrar corpo de pedido e confirmar HTTPS/HSTS.

**P1 — logo depois, antes de escala**

1. Registro das operações de tratamento e relatório de impacto
   simplificado da foto.
2. Hash de IP com segredo (HMAC) e limpeza das chaves vencidas do
   limitador.
3. Política de retenção e exclusão para `avaliacao-ia/` (dados de
   participantes): prazo e exclusão registrada.
4. Plano de resposta a incidentes.
5. CSP e revisão de cabeçalhos.

**P2 — proporcional ao MVP**

1. Termos de uso.
2. Verificação de idade além da autodeclaração (só se o risco justificar).
3. Aviso de cookies (desnecessário enquanto não houver cookies nem
   analytics; reavaliar na Fase 04, com pagamento).

## 5. Plano de execução (para aprovação)

| Passo                               | Entregas                                                                                                                                                                                                            | Código | Custo   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------- |
| **03G.1** Documentação base         | Registro das operações (do inventário); rascunho da política de privacidade; rascunho do consentimento v03g (foto sensível + transferência); relatório de impacto simplificado; política de retenção das avaliações | não    | —       |
| **03G.2** Verificações externas     | Confirmar a retenção da Anthropic (página de retenção, console, eventual contato sobre ZDR); escolher a hospedagem e confirmar logs/HTTPS; ler os textos oficiais da LGPD e da ANPD                                 | não    | —       |
| **03G.3** Implementação mínima      | Página de política; links no fluxo; consentimento v03g; FAQ corrigida; aviso dos dados de nascimento; canal de direitos; HMAC no IP e limpeza do limitador; testes                                                  | sim    | —       |
| **03G.4** Revisão jurídica (portão) | Política, consentimento e relatório de impacto revisados por assessoria em LGPD                                                                                                                                     | —      | externo |

**Fica fora da 03G:**

- o experimento de repetibilidade visual (plano próprio);
- pagamento (Fase 04);
- estado compartilhado dos limites, que vem antes do uso público mas é de
  infraestrutura.

**Para ler os textos oficiais neste ambiente:** liberar `www.planalto.gov.br`,
`www.in.gov.br`, `www.gov.br` e `privacy.claude.com` na rede da sessão. A
outra opção é a leitura ser feita pela assessoria jurídica.

## 6. Correções registradas no início da 03G.1 (23/11/2026)

Feitas a pedido do responsável. O texto acima foi mantido como estava e
estas correções prevalecem sobre ele.

1. **Retenção da Anthropic.**
   - **Regra adotada:** a documentação oficial da Anthropic sobre a API
     comercial informa exclusão padrão de entradas e saídas em até 30 dias,
     com exceções. Fonte: `https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data`.
   - **Covered Models:** a política específica desses modelos não substitui
     a regra geral. A leitura da seção 2 ("não retido por padrão") **não
     deve ser usada**.
   - **Não presumir retenção zero.** A configuração e as condições
     contratuais efetivas da conta do Sidera continuam pendentes de
     confirmação.
   - **Fonte não lida nesta sessão:** a página não abriu (domínio não
     resolve). O texto das exceções precisa ser conferido antes de
     qualquer publicação.
2. **Transferência internacional.**
   - **Norma de referência:** Resolução CD/ANPD nº 19/2024.
   - **Duas perguntas distintas:**
     - a **hipótese legal** do tratamento (arts. 7º e 11 da LGPD);
     - o **mecanismo** que autoriza a transferência (art. 33 e a
       resolução).
   - **Cláusulas da UE:** as cláusulas contratuais padrão da UE, no
     contrato de proteção de dados da Anthropic, **não são consideradas
     automaticamente suficientes** para a LGPD.
   - **Fonte não lida nesta sessão:** a página da ANPD não abriu (domínio
     não resolve).
3. **Fotografias das palmas.**
   - **O que muda:** a seção 3 não deve ser lida como "toda foto de mão é
     dado biométrico sensível".
   - **Avaliação de risco e proteção reforçada:** ver
     `docs/privacidade/01-inventario-e-matriz.md`, seção 3.
