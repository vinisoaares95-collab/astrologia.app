# Minuta — consentimento e avisos da jornada (proposta v03g)

**Fase 03G.1, documento de trabalho (23/11/2026).** Nada disto foi
publicado. O texto em uso continua sendo a versão `03f2.1`
(`src/features/palm-reading/privacy-copy.ts`).

**Legenda:**

- `[A DEFINIR]`: decisão do responsável;
- `[CONFIRMAR]`: verificação externa ou jurídica.

## 1. O que muda em relação à 03f2.1

| Ponto                 | 03f2.1 (atual)                        | v03g (proposta)                                                                        |
| --------------------- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| Controlador e contato | ausentes                              | nome e canal, com link para a política                                                 |
| Autorizações          | duas caixas: 18+ e uso da foto        | três caixas: 18+, uso da foto, transferência ao exterior                               |
| Natureza da foto      | não mencionada                        | aviso de cuidado reforçado, sem afirmar que é dado biométrico                          |
| Retenção do provedor  | "será confirmado antes do lançamento" | prazo padrão documentado, com exceções; condição da conta confirmada antes de publicar |
| Base da transferência | não informada                         | conforme decisão jurídica (cláusulas da ANPD ou consentimento específico)              |
| Orientação de captura | só técnica                            | inclui "só a palma, sem anéis, tatuagens ou objetos"                                   |

**Caixa separada para a transferência.** Ela só é necessária se o
mecanismo escolhido for o consentimento específico e em destaque
(art. 33, VIII).

- **Se forem adotadas as cláusulas-padrão da ANPD com a Anthropic:** a
  terceira caixa sai e o texto passa a ser só informativo.
- **Quem decide:** o jurídico (pendência P0-3).

## 2. Tela de consentimento (modo real)

**Título:** Antes de enviar sua foto

**Quem trata seus dados.** `[A DEFINIR: razão social]`, responsável pelo
Sidera. Dúvidas sobre privacidade: `[A DEFINIR: e-mail]`.
[Política de Privacidade]

**Para que serve a foto.**

- A foto da palma da sua mão será usada apenas para a leitura simbólica
  do Sidera (formato da mão e linhas da palma).
- É uma interpretação da tradição da quiromancia, não um diagnóstico nem
  uma previsão.
- Não usamos a foto para identificar você nem para outra finalidade.

**Cuidado com a imagem.**

- Fotos da palma podem mostrar detalhes da pele que, em tese,
  permitiriam identificar uma pessoa. Por isso, tratamos sua foto com
  cuidado reforçado.
- Fotografe só a palma, sem anéis, tatuagens ou objetos ao fundo.

**Antes de qualquer envio.**

- A foto é redesenhada no seu aparelho, sem dados de localização e do
  aparelho (EXIF/GPS).
- O arquivo original não é alterado.
- A cópia fica só na memória desta tela.

**O que é enviado e para onde.**

- Só quando você tocar em Analisar, a cópia vai ao servidor do Sidera e à
  Anthropic, provedor de inteligência artificial nos Estados Unidos.
- A Anthropic observa as características visíveis da palma e ajuda a
  redigir o texto.

**O que o Sidera guarda.**

- O Sidera não grava a foto. Ela fica na memória do servidor só durante
  a análise.
- O texto da leitura, sem a foto, fica até 10 minutos na memória do
  servidor, para não repetir a mesma análise.

**O que o provedor guarda.**

- Pelos termos comerciais da Anthropic, o conteúdo enviado não é usado
  para treinar modelos.
- Segundo a documentação dela, entradas e saídas são excluídas, por
  padrão, em até 30 dias, com exceções `[CONFIRMAR: exceções e condição
da conta antes de publicar]`.
- O Sidera não consegue pedir a exclusão antecipada de uma análise
  específica, porque ela não fica associada a você.

**Seus direitos.**

- Você pode desistir a qualquer momento: descarte a foto ou saia da
  leitura.
- Depois do envio, isso vale para a cópia neste aparelho; o que já foi
  enviado segue os prazos acima.
- Outros direitos: [Política de Privacidade].

**Caixas** (todas desmarcadas; Analisar só fica disponível com as três):

- [ ] Tenho 18 anos ou mais.
- [ ] Autorizo o uso da foto da palma da minha mão para a leitura
      simbólica, nas condições acima.
- [ ] Autorizo a transferência da foto e da descrição gerada a partir
      dela para a Anthropic, nos Estados Unidos, apenas para esta
      leitura. `[CONFIRMAR: necessária só se o mecanismo for o
    consentimento — ver seção 1]`

**Botão:** Continuar

## 3. Avisos ao longo da jornada

| Momento                            | Texto proposto                                                                                                                                                                                                                                                                                                    | Situação                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Introdução da leitura das mãos     | "A foto só é enviada quando você tocar em Analisar, ao Sidera e à Anthropic (EUA). O Sidera não a grava. [Como usamos sua foto]"                                                                                                                                                                                  | ajuste do texto atual + link                                                         |
| Orientação de captura              | acrescentar: "Mostre só a palma. Evite anéis, tatuagens e objetos ao fundo."                                                                                                                                                                                                                                      | novo                                                                                 |
| Foto preparada (antes de Analisar) | manter o texto atual ("…só sai daqui quando você tocar em Analisar.")                                                                                                                                                                                                                                             | já correto                                                                           |
| Durante a análise                  | manter o texto atual                                                                                                                                                                                                                                                                                              | já correto                                                                           |
| Prévia do resultado                | manter o texto atual                                                                                                                                                                                                                                                                                              | já correto                                                                           |
| Formulário de nascimento           | "Data, hora e local vão ao servidor do Sidera só para verificar os dados e calcular o mapa. Não são gravados nem enviados a terceiros. [Política de Privacidade]"                                                                                                                                                 | **substitui** "Os dados ficam apenas nesta tela… sem salvar nada", que omite o envio |
| FAQ de `/como-funciona`            | "A foto da palma só sai do seu aparelho quando você autoriza e toca em Analisar. Ela vai ao servidor do Sidera e à Anthropic, provedor de IA nos Estados Unidos, só para a leitura. O Sidera não grava a foto; o provedor a exclui por padrão em até 30 dias, com exceções. Detalhes na Política de Privacidade." | **substitui** o texto desatualizado ("…apenas no seu navegador…")                    |
| Rodapé                             | link "Privacidade"                                                                                                                                                                                                                                                                                                | novo                                                                                 |

**Notas:**

- **Comentário no código.** O de `birth-data-form.tsx` ("Nada é enviado
  nem salvo") também precisa ser corrigido na 03G.3. Não é texto
  público, mas induz a erro.
- **Versão.** Quando entrar, o texto ganha a versão `03g.1` em
  `CONSENT_VERSION`. Os recibos antigos continuam válidos só até
  vencerem, em 30 min.
- **Modos desligado e simulado.** Mantêm os textos atuais, com o link da
  política e o controlador.
