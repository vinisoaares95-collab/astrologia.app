# Experimento de repetibilidade visual — minuta do termo de consentimento (REP-1)

> ⚠️ **MINUTA. Não apresentar a participantes antes da revisão jurídica.**
> Não é parecer jurídico. Os trechos entre colchetes **[…]** são dados que
> ainda não existem ou não foram confirmados e **não devem ser inventados**.

Versão do termo: **REP-1**, a citada no manifesto do experimento
(`manifest.ts`). Qualquer mudança no texto exige nova versão (REP-2…) e
novas assinaturas.

## A. Pontos que exigem revisão jurídica antes do uso

1. **Responsável pelo tratamento (controlador).** A empresa Cation Digital
   ainda não foi constituída: não há CNPJ nem endereço. É preciso definir:
   - quem assina como responsável agora (por exemplo, a pessoa física
     responsável pelo projeto);
   - como fica a sucessão quando a empresa existir.

   Sem isso, o termo não pode ser usado.

2. **Natureza do dado.** Confirmar se a foto da palma é **dado pessoal
   sensível (biométrico)** pela LGPD (art. 5º, II; art. 11). A foto não é
   usada para identificar ninguém, mas linhas e marcas da mão podem, em
   tese, permitir identificação. A base legal muda conforme a resposta
   (consentimento específico e destacado, no caso de dado sensível).
3. **Transferência internacional** (LGPD, art. 33):
   - a foto é enviada à Anthropic, PBC, nos EUA;
   - definir o fundamento: consentimento específico e destacado, cláusulas
     contratuais ou outro;
   - definir como informar isso ao participante.
4. **Retenção pelo provedor.** Ver a seção C. O artigo oficial sobre a
   retenção de dados da API **não pôde ser lido** neste ambiente: falta
   confirmar o prazo padrão aplicável à conta usada e as exceções. O texto
   não pode prometer exclusão no provedor.
5. **Retirada do consentimento depois do relatório.** Definir se as
   análises da pessoa saem também dos números de um relatório já
   concluído. A minuta propõe que sim: o relatório é refeito sem elas.
6. **Prazos:**
   - a minuta usa **até 7 dias** de guarda da foto, contados do
     recebimento;
   - confirmar se 7 dias bastam para as duas sessões em dias diferentes;
   - se a janela vencer, a foto é apagada e só volta com novo envio pela
     própria pessoa.
7. **Canal de contato e prazo de resposta** a pedidos (LGPD, art. 18),
   coerentes com o procedimento de titulares
   (`docs/privacidade/04-procedimento-titulares.md`).
8. **Forma de aceite e guarda do termo assinado.** Fica fora do Sidera e
   do repositório. No Sidera, só o código `AUT-REP-NN`.
9. **Idade:** só maiores de 18 anos; nenhuma foto de terceiros.

## B. Texto do termo (minuta)

**Termo de consentimento — Experimento de consistência da análise visual
de fotos da palma da mão (Sidera)**

Código da autorização: `AUT-REP-__` · Versão: REP-1 · Data: `__/__/____`

**1. Quem é o responsável.** O responsável pelo tratamento dos seus dados
neste experimento é **[nome do responsável pelo tratamento — a definir na
revisão jurídica]**, contato **[canal de contato — a definir]**. O Sidera
é um produto ainda não lançado.

**2. Para que serve.** Queremos saber se o sistema de inteligência
artificial usado pelo Sidera descreve **sempre da mesma forma** as
características visíveis de **uma mesma foto** da palma. São elas: o
formato da palma, o comprimento dos dedos e o traçado das linhas.

- A mesma foto será analisada várias vezes, e as descrições serão
  comparadas entre si.
- **Não haverá leitura de quiromancia para você**, nem perfil ou resultado
  pessoal.
- É um teste interno de qualidade.

**3. Quais dados são usados:**

- **A foto da palma da sua mão.** [Sendo foto já enviada antes: o mesmo
  arquivo que você enviou na avaliação anterior, reenviado por você.]
- **Indicação de qual mão é** (direita ou esquerda).
- **Um código** que substitui o seu nome nos registros (ex.: `P3`) e o
  código desta autorização. Seu nome não entra no Sidera: fica só neste
  termo, guardado à parte pelo responsável.
- **Antes do envio,** a foto é reduzida e perde os metadados (data, local,
  aparelho).
- **O resultado** de cada análise é uma descrição **em texto**
  (características e uma frase sobre onde aparecem na foto). Ele fica nos
  registros do experimento. **Nenhuma imagem é guardada nos registros.**

**4. Com quem a foto é compartilhada.** A foto é enviada para análise à
**Anthropic, PBC**, empresa dos **Estados Unidos**, fornecedora do modelo
de inteligência artificial (Claude Sonnet 5.5). Isso é uma
**transferência internacional de dados**. [Fundamento legal da
transferência — a definir na revisão jurídica.]

**5. Quantas vezes e quando.**

- A sua foto será enviada **no máximo 12 vezes** à Anthropic.
- Os envios acontecem em **dias diferentes** (pelo menos duas sessões).
- Cada envio é uma análise independente da mesma foto.

**6. Por quanto tempo guardamos a foto.**

- A foto fica guardada pelo responsável por **até 7 dias** contados do
  recebimento, em pasta de acesso restrito, fora do código do projeto.
  Depois disso ela é apagada, mesmo que o experimento não tenha terminado.
  Nesse caso, só voltamos a usá-la se você mesmo(a) a enviar de novo.
- A exclusão fica registrada: data, tamanho do arquivo e uma impressão
  digital técnica (SHA-256), que permite conferir que é o mesmo arquivo sem
  guardar a imagem.
- Os **registros em texto** (sem imagem e sem seu nome) ficam enquanto
  durar a avaliação do produto. [Prazo final — a definir na revisão
  jurídica.]

**7. O que acontece com a foto na Anthropic.** A exclusão feita pelo
Sidera **não alcança** o que já foi enviado à Anthropic. Pelas informações
oficiais verificadas em 24/11/2026:

- os Termos Comerciais da Anthropic dizem que ela **não pode treinar
  modelos** com o conteúdo enviado pelos clientes da API;
- a documentação da API diz que a Anthropic **pode reter dados quando a lei
  exigir** ou quando o conteúdo for **sinalizado por seus sistemas
  automáticos de segurança**, e, nesse caso, **por até 2 anos**;
- [prazo padrão de retenção aplicável à conta usada — a confirmar na
  política oficial antes da assinatura].

**Não prometemos a exclusão dos dados na Anthropic**, porque ela não está
sob nosso controle.

**8. Riscos.**

- Uma foto da palma pode, em tese, ajudar a identificar uma pessoa (marcas,
  cicatrizes, linhas). Para reduzir isso, fotografe **só a palma**, sem
  rosto, documentos, tatuagens, joias ou objetos identificáveis.
- Há também o risco de retenção pelo provedor descrito no item 7.

**9. Retirada do consentimento.** Você pode retirar este consentimento a
qualquer momento, sem justificativa, pelo contato do item 1:

- **Antes de qualquer envio:** a foto é apagada e não é usada.
- **Depois de algum envio:**
  - **não haverá novas análises**;
  - a foto é apagada da nossa guarda;
  - as linhas referentes a ela saem dos registros do experimento;
  - os resultados são recalculados sem elas;
  - o que já foi enviado à Anthropic segue a política dela (item 7).
- A retirada não tem custo nem prejuízo para você.

**10. Seus direitos.** Você pode pedir acesso, correção, informação sobre
o compartilhamento e exclusão dos seus dados pelo contato do item 1.
[Prazo de resposta — a definir.]

**11. Participação voluntária.** A participação é voluntária, sem
pagamento e sem prejuízo se você recusar.

**12. Declaração.** Declaro que tenho **18 anos ou mais**, que a mão
fotografada é minha, e que li e concordo com este termo, inclusive:

- com o envio da foto à Anthropic, nos EUA (itens 4 e 7);
- com até **12 análises** em dias diferentes (item 5).

Assinatura: `________________________` · Data: `__/__/____`

_(O termo assinado fica com o responsável, fora do Sidera e do
repositório. No Sidera, só o código `AUT-REP-NN`.)_

## C. Fontes oficiais verificadas (24/11/2026)

| Fonte                                                                                                      | O que diz (resumo fiel)                                                                                                                                                                                                                                                                                                                                   | Situação                                                                                        |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Termos Comerciais da Anthropic (`anthropic.com/legal/commercial-terms`, vigentes desde 17/06/2025)         | "Anthropic" é a **Anthropic, PBC** para clientes fora do EEE, da Suíça e do Reino Unido. A Anthropic **não pode treinar modelos** com o conteúdo do cliente (entradas e saídas). O tratamento segue o Data Processing Addendum (DPA)                                                                                                                      | Lido                                                                                            |
| Documentação "API and data retention" (`platform.claude.com/docs/en/manage-claude/api-and-data-retention`) | Pode haver retenção por exigência legal ou quando o conteúdo é sinalizado pelos sistemas automáticos de segurança; nesse caso, **até 2 anos**. A página diz ainda que o conteúdo não é retido por padrão, com exceção dos "Covered Models" (30 dias; o Sonnet 5.5 não está na lista) e de recursos específicos (lote, arquivos) que o experimento não usa | Lido, mas a página remete ao artigo de retenção abaixo, para a política comercial               |
| Artigo "How long do you store my organization's data?" (`privacy.claude.com/…/7996866`)                    | —                                                                                                                                                                                                                                                                                                                                                         | **Não lido:** o domínio não abriu neste ambiente. **Precisa ser conferido antes da assinatura** |
| Data Processing Addendum (DPA)                                                                             | —                                                                                                                                                                                                                                                                                                                                                         | **Não lido.** Revisão jurídica                                                                  |
| Política de Privacidade (`anthropic.com/legal/privacy`, vigente desde 10/09/2026)                          | Dados do controlador (Anthropic PBC, EUA) e transferências. A política se declara **não aplicável** ao conteúdo tratado para clientes empresariais                                                                                                                                                                                                        | Lida; aplicação à API a confirmar                                                               |

A informação de 19/11/2026 ("até 30 dias por padrão") **não** foi
confirmada pelas fontes lidas e diverge da documentação da API. Até a
leitura do artigo oficial, o termo não cita prazo padrão.
