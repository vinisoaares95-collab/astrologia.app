# Procedimento — solicitações de titulares

**Fase 03G.1 (23/11/2026). Proposta proporcional ao MVP.** Depende do
canal e do responsável `[A DEFINIR]` e de revisão jurídica.

## 1. Canal e responsável

- **Canal:** um e-mail exclusivo, `[A DEFINIR]`, publicado na política e
  no consentimento.
- **Responsável pela resposta:** `[A DEFINIR: encarregado ou pessoa
designada]`.
- **Registro:** uma planilha ou documento interno, sem cópia de anexos
  desnecessários, com:
  - data de entrada;
  - pedido;
  - resposta;
  - data da resposta.

## 2. Prazos

- **Confirmação de existência ou acesso simplificado:** imediato
  (art. 19, I).
- **Declaração completa:** até 15 dias (art. 19, II).
- **Demais pedidos:** responder sem demora.
- **Agente de pequeno porte:** a Res. CD/ANPD nº 2/2022 pode dar prazos
  diferenciados `[CONFIRMAR: jurídico]`.
- **Meta interna proposta:** primeira resposta em até 5 dias úteis.

## 3. Roteiro

1. **Receber e registrar.**
2. **Identificar o pedido:**
   - confirmação ou acesso;
   - correção;
   - eliminação;
   - revogação;
   - informação sobre compartilhamento;
   - portabilidade;
   - outro.
3. **Verificar a identidade só quando houver dado a entregar ou apagar.**
   Hoje o Sidera não guarda dados associados à pessoa. Pedir documentos
   criaria um tratamento novo sem necessidade.
4. **Localizar os dados.** Situação atual **[FATO]**:
   - Foto, dados de nascimento e consentimento: não ficam gravados no
     Sidera.
   - Resultado: até 10 min em memória, sem vínculo com a pessoa.
   - Hash de IP: em memória, sem vínculo com nome ou e-mail.
   - Logs da hospedagem: `[A DEFINIR]`. Se existirem, podem conter IP; a
     busca exige que a pessoa informe IP, data e hora.
   - Anthropic: o conteúdo enviado não tem identificador da pessoa. O
     Sidera não consegue localizar nem pedir a exclusão de um envio
     específico, que segue a retenção do provedor.
   - Avaliações internas: só participantes convidados, identificados por
     pseudônimo. A correspondência fica com `[A DEFINIR: quem guarda a
tabela de pseudônimos]`.
5. **Responder com linguagem simples.** Resposta padrão para o caso
   comum, mantendo a revisão jurídica:

   > Confirmamos o recebimento do seu pedido. O Sidera não tem conta de
   > usuário e não grava fotos nem dados de nascimento. Por isso, não
   > mantemos dados associados a você. A foto enviada para a leitura foi
   > processada pela Anthropic, nos Estados Unidos, sem identificação sua,
   > e é excluída por ela, por padrão, em até 30 dias, com exceções
   > `[CONFIRMAR]`. Os registros técnicos de acesso do site
   > `[A DEFINIR conforme hospedagem]`. Se quiser, você pode reclamar à
   > ANPD.

6. **Revogação.** A revogação vale para novos envios. Informar o que já
   foi enviado e os prazos.
7. **Participantes das avaliações.** Atender a eliminação apagando os
   registros do pseudônimo em `avaliacao-ia/`, com registro da exclusão,
   e informando o que foi enviado à Anthropic nas execuções.
8. **Fechar o registro.** Anotar a resposta e a data.

## 4. Incidentes (resumo, para a 03G.3)

Se houver suspeita de vazamento ou acesso indevido:

1. **Conter.**
2. **Registrar o que, quando e quem foi afetado.**
3. **Avaliar o risco.**
4. **Comunicar:** se houver risco ou dano relevante, comunicar a ANPD e
   os titulares no prazo da regulação `[CONFIRMAR: Res. CD/ANPD
nº 15/2024, prazo de 3 dias úteis]`.

Pelo DPA, a Anthropic avisa incidentes em 48 h. O contato para esse aviso
é `[A DEFINIR: e-mail cadastrado na conta]`.
