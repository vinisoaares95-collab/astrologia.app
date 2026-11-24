# Experimento de repetibilidade visual — minuta do termo de consentimento (REP-1)

> ⛔ **NÃO APROVADA PARA ASSINATURA.** Minuta para revisão jurídica
> profissional. Não apresentar a participantes e não coletar assinaturas.
> Não é parecer jurídico nem declaração de conformidade legal. Os trechos
> entre colchetes **[…]** são dados que ainda não existem ou não foram
> decididos e **não devem ser preenchidos com informações presumidas**.

- Versão do termo: **REP-1**, a citada no manifesto do experimento
  (`manifest.ts`).
- Qualquer mudança no texto aprovado exige nova versão (REP-2…) e novas
  assinaturas.
- Revisão desta minuta: 24/11/2026.

## A. Informações necessárias para revisão jurídica

Estes campos são preenchidos **fora do código e do repositório**, pelo
responsável e pela assessoria. Nada aqui foi presumido.

| Campo                                                                            | Quem fornece                   | Situação                                    |
| -------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------- |
| Nome completo do responsável pelo tratamento                                     | Responsável pelo projeto       | **[pendente]**                              |
| Documento de identificação a constar no termo, se a assessoria exigir (ex.: CPF) | Responsável + assessoria       | **[pendente]**                              |
| Endereço para comunicações, se exigido                                           | Responsável + assessoria       | **[pendente]**                              |
| Canal de contato para participantes (e-mail ou outro) e prazo de resposta        | Responsável                    | **[pendente]**                              |
| Encarregado (DPO) ou canal equivalente, se aplicável                             | Assessoria                     | **[pendente]**                              |
| Base legal do tratamento da foto                                                 | Assessoria                     | **[pendente; não preencher sem validação]** |
| Mecanismo de transferência internacional                                         | Assessoria                     | **[pendente; não preencher sem validação]** |
| Prazo dos registros em texto e dos registros mínimos de auditoria                | Assessoria + responsável       | **[pendente; a minuta só traz proposta]**   |
| Configuração da conta da API (padrão ou acordo de retenção zero) e DPA aplicável | Responsável, junto à Anthropic | **[pendente]**                              |
| Meio de aviso ao participante antes de uma nova sessão (ampliação)               | Responsável                    | **[pendente]**                              |
| Plano de sucessão quando a Cation Digital for constituída                        | Responsável + assessoria       | **[pendente]**                              |

### A.1 Hipótese operacional do responsável pelo tratamento

Enquanto a Cation Digital **não estiver formalizada**, adota-se como
**hipótese de trabalho** que o responsável pelo tratamento (controlador)
é a **pessoa física responsável pelo projeto Sidera**.

- Isso é uma **hipótese operacional para a revisão jurídica**, não uma
  declaração de conformidade com a LGPD.
- Nome, documentos, endereço e contato **não foram preenchidos** e só
  entram depois da confirmação do responsável e da validação jurídica.

### A.2 Checklist para avaliação jurídica

**1. Decisões que o responsável pelo projeto precisa fornecer**

- [ ] Confirmar a hipótese do item A.1 (pessoa física como controladora
      durante o experimento) e fornecer os dados de identificação que a
      assessoria pedir.
- [ ] Definir o canal de contato e o prazo de resposta aos participantes
      (J9).
- [ ] Definir o meio de aviso antes de uma nova sessão (item B.6) e como o
      participante recusa.
- [ ] Definir quem, além do responsável, pode acessar as fotos (proposta:
      ninguém).
- [ ] Definir onde e como guardar os termos assinados, fora do Sidera.
- [ ] Confirmar com a Anthropic as informações do bloco 3.
- [ ] Decidir se a Ampliação B (fotos novas) existirá. Se sim, ela terá
      termo próprio.

**2. Questões para a assessoria jurídica**

- [ ] **J1. Controlador pessoa física.**
  - Confirmar o enquadramento, considerando a LGPD (art. 5º, VI) e as
    orientações da ANPD sobre agentes de tratamento.
  - Verificar se a exceção do art. 4º, I (fins exclusivamente
    particulares e não econômicos) se aplica. Por ser a preparação de um
    produto comercial, a hipótese de trabalho é que **não** se aplica.
  - Verificar se algum regime simplificado da ANPD para agentes de pequeno
    porte se aplica a uma pessoa física nesta situação, e se o tratamento
    de dado sensível o afasta.
  - Definir a sucessão para a futura empresa.
- [ ] **J2. Natureza da foto e base legal.**
  - Confirmar a classificação como dado sensível biométrico (art. 5º, II),
    considerando as orientações da ANPD.
  - Definir a base legal (art. 11; consentimento específico e destacado,
    se for o caso).
  - **Não presumir** que a ausência de finalidade de identificação
    elimina os riscos.
- [ ] **J3. Transferência internacional.**
  - Definir o mecanismo para o envio à Anthropic, PBC (EUA): art. 33 da
    LGPD e Resolução CD/ANPD nº 19/2024 (regulamento de transferência
    internacional e cláusulas-padrão contratuais).
  - Verificar se o DPA da Anthropic tem cláusulas compatíveis, ou se outro
    fundamento é necessário.
- [ ] **Documentação obrigatória.** Verificar a necessidade de registro
      das operações (art. 37), de relatório de impacto (art. 38) para dado
      sensível e de encarregado (art. 41) neste caso.
- [ ] **J5–J6. Prazos.** Validar o prazo dos registros em texto
      (proposta: 12 meses após o encerramento) e o conteúdo e o prazo dos
      registros mínimos de auditoria. Inclui o SHA-256 do arquivo apagado,
      que identifica o arquivo sem permitir refazer a imagem.
- [ ] **J7. Retirada depois do relatório.** A proposta é recalcular os
      resultados sem os dados da pessoa.
- [ ] **J8. Guarda de 7 dias.** Confirmar se é adequada com sessões em
      dias diferentes. Se vencer, a foto é apagada e só volta com novo
      envio da própria pessoa.
- [ ] **J9. Aceite.** Validar a forma do aceite (incluindo os aceites
      destacados), a guarda do termo e o prazo de resposta aos pedidos do
      art. 18, em coerência com `docs/privacidade/04-procedimento-titulares.md`.
- [ ] **J10. Participantes.** Confirmar os requisitos: 18 anos ou mais,
      própria mão, nunca foto de terceiros.
- [ ] **Redação.** Revisar a clareza do texto inteiro (seção B) para o
      participante.

**3. Informações contratuais a confirmar com a Anthropic (J4)**

- [ ] **Prazo padrão** de exclusão das entradas e saídas da API na conta
      usada. A política comercial publicada em 01/07/2026 fala em até 30
      dias, com exceções; reconferir na data da coleta.
- [ ] **Acordo de retenção zero (ZDR):** existe ou não para a conta.
- [ ] **DPA aplicável:** subprocessadores, local de tratamento, cláusulas
      de transferência e como atende pedidos de exclusão.
- [ ] **Conteúdo sinalizado:** retenção mais longa (a documentação técnica
      cita até 2 anos) e condições.
- [ ] **Imagens:** confirmar que seguem a mesma regra das demais entradas
      (as páginas lidas não tratam disso em separado).
- [ ] **Treino:** confirmar a vedação de treino com o conteúdo do cliente
      nos termos aplicáveis à conta.

**4. Decisões já tomadas sobre a ferramenta (não dependem da revisão)**

- **Envios:** até 12 por foto no total (teto do consentimento); piloto com
  no máximo 5 por foto numa sessão; meta de 10 no total se houver
  ampliação.
- **Recusa automática:** foto sem termo assinado, com envios esgotados,
  arquivo diferente do original (SHA-256) ou campo não previsto no
  manifesto (nenhum nome ou contato entra).
- **Guarda e registros:**
  - foto só fora do repositório, por até 7 dias do recebimento;
  - registros sem imagem e com pseudônimos;
  - exclusão registrada (tamanho, SHA-256, data), com busca de cópias.
- **Interpretações:** usadas só internamente, para comparar o impacto
  das observações; nada é entregue ao participante.
- **Conexão real:** travada no código até a autorização específica da
  execução.

### A.3 Rastreabilidade das pendências J1–J10

| #   | Pendência                                   | Bloco do checklist |
| --- | ------------------------------------------- | ------------------ |
| J1  | Controlador e contato                       | 1 e 2              |
| J2  | Classificação da foto e base legal          | 2                  |
| J3  | Transferência internacional                 | 2 (e 3 para o DPA) |
| J4  | Retenção pelo provedor, conta e DPA         | 3                  |
| J5  | Prazo dos registros em texto                | 2                  |
| J6  | Registros mínimos de auditoria              | 2                  |
| J7  | Retirada depois do relatório                | 2                  |
| J8  | Guarda de 7 dias e sessões                  | 2                  |
| J9  | Aceite, guarda do termo e prazo de resposta | 1 e 2              |
| J10 | Idade e titularidade                        | 2                  |

## B. Texto do termo (minuta)

**Termo de consentimento — Experimento de consistência da análise visual
de fotos da palma da mão (Sidera)**

Código da autorização: `AUT-REP-__` · Versão: REP-1 · Data: `__/__/____`

**1. Quem é o responsável.**

- Responsável pelo tratamento: **[nome completo da pessoa física
  responsável pelo projeto Sidera — a confirmar]**. Enquanto a empresa do
  projeto não for constituída, é essa pessoa quem responde pelo
  tratamento. [Redação e sucessão a validar na revisão jurídica.]
- Contato: **[a confirmar]**.

O Sidera é um produto ainda não lançado.

**2. Para que serve.**

- Queremos saber se o sistema de inteligência artificial usado pelo Sidera
  descreve **sempre da mesma forma** as características visíveis de **uma
  mesma foto** da palma: o formato da palma, o comprimento dos dedos e o
  traçado das linhas.
- A mesma foto será analisada várias vezes, e as descrições serão
  comparadas entre si.

**Uso interno das interpretações.**

- Para saber se uma diferença entre as análises **mudaria o que uma pessoa
  leria**, as descrições são convertidas, só internamente, nos textos de
  interpretação do produto (quiromancia, uma tradição simbólica).
- O que se compara são os **itens** que apareceriam, não o texto.
- **Nenhuma leitura, perfil ou resultado pessoal será entregue a você,
  publicado ou usado para outro fim.** É um teste interno de qualidade.

**3. Quais dados são usados.**

- **A foto da palma da sua mão.** Neste experimento, ela é tratada como
  **dado pessoal sensível (biométrico)**, com os cuidados correspondentes.
  [Se for foto já enviada antes: o mesmo arquivo da avaliação anterior,
  reenviado por você.]
- **Indicação de qual mão é** (direita ou esquerda).
- **Códigos** que substituem o seu nome nos registros (ex.: `P3`) e o
  código desta autorização. Seu nome não entra no Sidera: fica só neste
  termo, guardado à parte pelo responsável.

Antes do envio, a foto é reduzida e perde os metadados (data, local,
aparelho).

O resultado de cada análise é uma **descrição em texto**: as
características e uma frase sobre onde elas aparecem na foto. **Nenhuma
imagem é guardada nos registros.**

**4. Por que a foto exige cuidado.** Linhas, marcas e cicatrizes da mão
podem, em tese, ajudar a identificar uma pessoa. O Sidera **não** usa a
foto para identificar ninguém, mas isso **não elimina** o risco. Para
reduzi-lo, fotografe **só a palma**, sem rosto, documentos, tatuagens,
joias ou objetos identificáveis.

**5. Com quem a foto é compartilhada.** A foto é enviada para análise à
**Anthropic, PBC**, empresa dos **Estados Unidos**, fornecedora do modelo
de inteligência artificial (Claude Sonnet 5.5). Isso é uma
**transferência internacional de dados**. [Fundamento legal da
transferência: a definir na revisão jurídica.]

**6. Quantas vezes e quando.**

- **Limite deste consentimento:** a sua foto será enviada à Anthropic **no
  máximo 12 vezes**, somando todas as etapas. Cada envio é uma análise
  independente da mesma foto.
- **Piloto:** a primeira etapa usa **no máximo 5 envios** da sua foto,
  numa **única sessão** (um dia).
- **Ampliação (se houver):**
  - pode haver novas análises da mesma foto **em outro dia**, até
    completar no máximo 10, sempre dentro do limite de 12;
  - a ampliação **só acontece se o responsável pelo projeto autorizar
    especificamente essa etapa**, e pode não acontecer;
  - antes dela você será avisado(a) por **[meio de aviso a definir]**.
- **Você pode recusar a ampliação:** este consentimento **não obriga** a
  sua participação nela. Recusar não tem custo nem prejuízo.
- **Retirada do consentimento:** a qualquer momento ela **impede novos
  envios** (item 9).
- **Guarda local e novas sessões:** a foto fica conosco por **até 7 dias**
  contados do recebimento (item 7). Se a ampliação não acontecer nesse
  prazo, a foto já terá sido apagada e só será usada se você mesmo(a) a
  enviar de novo. Conferimos que é o mesmo arquivo pela impressão digital
  técnica (SHA-256).

**7. Por quanto tempo guardamos os dados.**

| O quê                                                                  | Onde                                                               | Por quanto tempo                                                                                                                                                                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A foto**                                                             | Pasta de acesso restrito do responsável, fora do código do projeto | **Até 7 dias** contados do recebimento. Depois é apagada, mesmo que o experimento não tenha terminado. Para voltar a ser usada, só com novo envio feito por você                                              |
| **Registros em texto das análises** (sem imagem e sem seu nome)        | Pasta restrita do projeto, fora do código                          | [**Proposta:** até 12 meses depois do encerramento do experimento. A validar na revisão jurídica]                                                                                                             |
| **Registros mínimos de auditoria**                                     | Idem                                                               | [**Proposta:** só o código da autorização, a data da exclusão, o tamanho do arquivo e a sua impressão digital técnica (SHA-256), que comprova qual arquivo foi apagado sem guardar a imagem. Prazo a validar] |
| **Resultado agregado** (números do experimento, sem dados individuais) | Documentação do projeto                                            | Enquanto for útil para a avaliação do produto                                                                                                                                                                 |

**8. O que acontece com a foto na Anthropic.** A exclusão feita pelo
responsável vale **só para as cópias sob o nosso controle**. Ela **não
alcança** o que já foi enviado à Anthropic, que segue as regras dela.
Segundo as informações oficiais da Anthropic na data desta minuta:

- **Prazo padrão:** entradas e saídas da API comercial são apagadas por
  padrão **em até 30 dias**.
- **Exceções a esse prazo:**
  - acordos contratuais diferentes;
  - obrigações legais;
  - aplicação das políticas de uso da Anthropic.
- **Conteúdo sinalizado:** o conteúdo sinalizado pelos sistemas de
  segurança da Anthropic pode ficar guardado por **mais tempo** (a
  documentação técnica cita até 2 anos).
- **Treino:** pelos Termos Comerciais, a Anthropic **não pode treinar
  modelos** com o conteúdo enviado pelos clientes da API.

**Não podemos prometer a exclusão imediata nem individual** dos seus dados
na Anthropic, porque isso não está sob nosso controle. [A confirmar antes
da coleta: a configuração da conta usada e o DPA.]

**9. Retirada do consentimento.** Você pode retirar este consentimento a
qualquer momento, sem justificativa e sem custo, pelo contato do item 1.

| Quando você retira      | O que acontece                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Antes de qualquer envio | A foto é apagada e não é usada                                                                                                                                                                                                                                                                                   |
| Depois de algum envio   | **Nenhuma nova análise é feita.** A foto é apagada da nossa guarda; as linhas referentes a ela saem dos registros em texto, e os resultados são recalculados sem elas. Fica só o registro mínimo de auditoria (item 7), que comprova a exclusão. O que já foi enviado à Anthropic segue a política dela (item 8) |

**10. Seus direitos.** Você pode pedir acesso, correção, informação sobre
o compartilhamento e exclusão dos seus dados pelo contato do item 1.
[Prazo de resposta: a definir.]

**11. Participação voluntária.** A participação é voluntária, sem
pagamento e sem prejuízo se você recusar.

**12. Declaração.** Declaro que tenho **18 anos ou mais**, que a mão
fotografada é minha, e que li e concordo com este termo, inclusive, de
forma específica e destacada:

- [ ] com o tratamento da foto como **dado sensível** (itens 3 e 4);
- [ ] com o envio da foto à Anthropic, nos **Estados Unidos** (itens 5 e
      8);
- [ ] com até **5 análises** da minha foto no piloto, numa única sessão,
      e, **somente se** o responsável autorizar uma ampliação e eu não
      recusar, com novas análises em outro dia, **sem passar de 12 envios
      no total** (item 6).

Assinatura: `________________________` · Data: `__/__/____`

_(O termo assinado fica com o responsável, fora do Sidera e do
repositório. No Sidera, só o código `AUT-REP-NN`.)_

## C. Fontes oficiais e como foram usadas

| Fonte                                                                                                                                      | O que diz (resumo)                                                                                                                                           | Uso nesta minuta                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Artigo "Por quanto tempo você armazena os dados da minha organização?" (`privacy.claude.com/pt/articles/7996866`, publicado em 01/07/2026) | Exclusão padrão das entradas e saídas da API comercial **em até 30 dias**, com exceções                                                                      | **Fonte do prazo** do item 8. Consultado pelo responsável do projeto; neste ambiente o domínio não abriu. **Reconferir na data da coleta**                                                                                                                                                             |
| Termos Comerciais (`anthropic.com/legal/commercial-terms`, vigentes desde 17/06/2025)                                                      | Anthropic, PBC para clientes fora do EEE, Suíça e Reino Unido; **sem treino** com o conteúdo do cliente; tratamento segundo o DPA                            | Itens 5 e 8                                                                                                                                                                                                                                                                                            |
| Documentação "API and data retention" (`platform.claude.com/docs/en/manage-claude/api-and-data-retention`)                                 | Retenção por exigência legal ou de conteúdo sinalizado (**até 2 anos**). Também diz que o conteúdo "não é retido por padrão", fora alguns modelos e recursos | **Referência técnica.** A frase "não é retido por padrão" descreve o armazenamento que cada recurso precisa para funcionar. **Não é garantia contratual de retenção zero**: retenção zero (ZDR) depende de acordo específico com a Anthropic. O prazo do termo vem da política comercial (até 30 dias) |
| Data Processing Addendum (DPA)                                                                                                             | —                                                                                                                                                            | **Não lido.** Pendência J4                                                                                                                                                                                                                                                                             |
| Política de Privacidade (`anthropic.com/legal/privacy`, vigente desde 10/09/2026)                                                          | Dados do controlador e transferências; declara não se aplicar ao conteúdo tratado para clientes empresariais                                                 | Contexto; aplicação à API a confirmar                                                                                                                                                                                                                                                                  |

A informação anterior desta minuta ("prazo padrão não confirmado") foi
substituída pela política comercial consultada.
