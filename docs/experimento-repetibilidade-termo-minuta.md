# Experimento de repetibilidade visual — minuta do termo de consentimento (REP-1)

> ⚠️ **MINUTA. Não apresentar a participantes antes da revisão jurídica
> profissional.** Não é parecer jurídico. Os trechos entre colchetes **[…]**
> são dados que ainda não existem ou não foram decididos e **não devem ser
> inventados**.

- Versão do termo: **REP-1**, a citada no manifesto do experimento
  (`manifest.ts`).
- Qualquer mudança no texto aprovado exige nova versão (REP-2…) e novas
  assinaturas.
- Revisão desta minuta: 24/11/2026.

## A. Pendências jurídicas efetivas (antes de enviar a participantes)

| #   | Pendência                                                                          | Por que bloqueia                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| J1  | **Controlador e contato**                                                          | A empresa ainda não foi constituída: não há CNPJ nem endereço. Falta definir quem assina como responsável pelo tratamento agora, o canal de contato e o que acontece quando a empresa existir. Sem isso, o termo não pode ser usado                                                                                                                                                                                                                                                                      |
| J2  | **Classificação da foto da palma**                                                 | Nesta minuta, a foto é tratada **preventivamente como dado pessoal sensível biométrico** (LGPD, art. 5º, II, e art. 11), considerando a orientação da ANPD sobre biometria. A referência exata deve ser anexada pela revisão. A classificação final e a base legal (consentimento **específico e destacado**, art. 11, I) precisam de confirmação profissional. **Não usar a foto para identificar ninguém não elimina, por si só, os riscos**: linhas, marcas e cicatrizes podem permitir identificação |
| J3  | **Transferência internacional** (LGPD, art. 33)                                    | A foto vai à Anthropic, PBC, nos EUA. Falta definir o fundamento (por exemplo, consentimento específico e destacado para a transferência, ou cláusulas contratuais) e a redação do item 5                                                                                                                                                                                                                                                                                                                |
| J4  | **Retenção pelo provedor**                                                         | Conferir na data da coleta (seção C): a política comercial (até 30 dias por padrão, com exceções); a **configuração da conta** usada (por exemplo, se há acordo de retenção zero); o **Data Processing Addendum (DPA)**, ainda não lido                                                                                                                                                                                                                                                                  |
| J5  | **Prazo dos registros em texto**                                                   | A minuta propõe 12 meses depois do encerramento do experimento, e depois só registros mínimos de auditoria (item 7). O prazo e o conteúdo mínimo precisam de validação                                                                                                                                                                                                                                                                                                                                   |
| J6  | **Registros mínimos de auditoria**                                                 | Confirmar se o código da autorização, a data e a impressão digital (SHA-256) da foto apagada podem ser mantidos, e por quanto tempo. A impressão digital não permite refazer a imagem, mas identifica o arquivo                                                                                                                                                                                                                                                                                          |
| J7  | **Retirada depois do relatório**                                                   | A minuta propõe que as análises da pessoa saiam dos registros e que os resultados sejam recalculados sem elas. Confirmar se vale também para um relatório já concluído                                                                                                                                                                                                                                                                                                                                   |
| J8  | **Guarda de 7 dias com duas sessões**                                              | Confirmar se a guarda de até 7 dias contados do recebimento é adequada e suficiente. Se vencer, a foto é apagada e só volta com novo envio pela própria pessoa                                                                                                                                                                                                                                                                                                                                           |
| J9  | **Forma de aceite, guarda do termo e prazo de resposta a pedidos** (LGPD, art. 18) | Coerentes com `docs/privacidade/04-procedimento-titulares.md`                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| J10 | **Idade e titularidade**                                                           | Só maiores de 18 anos, com a própria mão; nunca foto de terceiros                                                                                                                                                                                                                                                                                                                                                                                                                                        |

## B. Texto do termo (minuta)

**Termo de consentimento — Experimento de consistência da análise visual
de fotos da palma da mão (Sidera)**

Código da autorização: `AUT-REP-__` · Versão: REP-1 · Data: `__/__/____`

**1. Quem é o responsável.**

- Responsável pelo tratamento: **[a definir na revisão jurídica]**.
- Contato: **[a definir]**.

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

- A sua foto será enviada **no máximo 12 vezes** à Anthropic.
- Os envios acontecem em **dias diferentes** (pelo menos duas sessões).
- Cada envio é uma análise independente da mesma foto.

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
- [ ] com até **12 análises** em dias diferentes (item 6).

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
