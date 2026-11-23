# Minuta — Política de Privacidade do Sidera

**Documento de trabalho da Fase 03G.1 (23/11/2026).**

- **Não publicar.** Depende das definições marcadas e de revisão
  jurídica (Fase 03G.4).
- **Campos `[A DEFINIR: …]`:** dependem do responsável. Nada foi
  inventado.
- **Trechos `[CONFIRMAR: …]`:** dependem de verificação externa.
- **Comportamentos descritos:** só os conferidos no código (ver
  `01-inventario-e-matriz.md`). Se algo mudar antes do lançamento, este
  texto muda junto.

---

## Política de Privacidade

Versão `[A DEFINIR]` · Vigente desde `[A DEFINIR]`

Esta política explica quais dados o Sidera trata, para quê, com quem os
compartilha, por quanto tempo e como você exerce seus direitos, conforme a
Lei Geral de Proteção de Dados (Lei nº 13.709/2018).

### 1. Quem é o responsável

O controlador dos dados é `[A DEFINIR: razão social]`, CNPJ
`[A DEFINIR]`, com sede em `[A DEFINIR]`. O site exibe a marca "Cation
Digital"; confirmar se é a mesma pessoa jurídica.

Para assuntos de privacidade, fale com `[A DEFINIR: encarregado ou canal
de privacidade]` pelo e-mail `[A DEFINIR]`.

### 2. Resumo

- Você não precisa criar conta nem informar nome, e-mail ou telefone para
  usar as leituras.
- O Sidera não usa cookies de rastreamento, analytics nem publicidade.
- **Foto da mão:** só é enviada quando você toca em Analisar, depois de
  autorizar. Ela vai ao nosso servidor e à Anthropic, provedor de
  inteligência artificial nos Estados Unidos. O Sidera não grava a foto.
- **Dados de nascimento:** são usados só para calcular o seu mapa e não
  são gravados.

### 3. Quais dados tratamos e para quê

**a) Foto da palma da mão (leitura das mãos)**

- **O que é preparado no aparelho:**
  - antes de qualquer envio, seu aparelho faz uma cópia da foto sem os
    dados de localização e do aparelho (EXIF/GPS);
  - o arquivo original não é alterado;
  - essa cópia fica só na memória da tela e sai dela quando você descarta
    a foto ou sai da leitura.
- **Quando vai ao servidor:** só quando você toca em Analisar. A cópia vai
  ao servidor do Sidera e à Anthropic.
- **Para que é usada:** só para observar características visíveis da mão
  e das linhas da palma e produzir a leitura simbólica que você pediu.
- **O que não fazemos:** não usamos a foto para identificar você, para
  autenticação nem para outra finalidade.
- **Cuidado reforçado:** imagens da palma podem conter detalhes da pele
  que, em tese, permitiriam identificar uma pessoa. Por isso, tratamos a
  foto com o cuidado reservado a dados pessoais sensíveis e só a usamos
  com o seu consentimento específico.
- **Na prática:** recomendamos fotografar apenas a palma, sem anéis,
  tatuagens ou outros objetos no fundo.

**b) O que é gerado a partir da foto**

- **Observação:** o provedor de IA descreve as características observadas
  (por exemplo, o formato da palma e o traçado das linhas).
- **Texto:** essa descrição, sem a foto, é usada para redigir o texto da
  leitura.
- **Seu resultado:** o texto da leitura é exibido a você.

**c) Dados de nascimento (mapa natal)**

- **Dados usados:** data, hora e local de nascimento, para calcular o seu
  mapa.
- **Onde são processados:** são enviados ao servidor do Sidera só para a
  verificação e o cálculo, feitos com bases de dados próprias.
- **Não são gravados** nem enviados a terceiros.

**d) Dados técnicos de segurança**

- **Limites de uso:** para evitar abuso, limitamos o número de análises
  por período.
- **Como funciona:** o servidor transforma o endereço IP da sua conexão em
  um código (hash) e guarda só esse código, em memória, por até
  `[CONFIRMAR: 1 hora, depois da mudança prevista na 03G.3]`.
- **Hospedagem:** o provedor de hospedagem do site pode registrar dados
  técnicos de acesso (como IP, data e hora e página acessada)
  `[A DEFINIR: provedor, o que registra e por quanto tempo; CONFIRMAR
obrigação de guarda de registros de acesso (Marco Civil da Internet,
art. 15)]`.

### 4. Bases legais

| Tratamento                                   | Base legal                                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Foto da palma e o que é gerado a partir dela | Seu consentimento específico e destacado `[CONFIRMAR: jurídico — art. 11, I, e art. 7º, I]`     |
| Dados de nascimento                          | Atender ao seu pedido de cálculo do mapa `[CONFIRMAR: jurídico — art. 7º, V, ou consentimento]` |
| Hash do IP e limites de uso                  | Legítimo interesse em proteger o serviço contra abuso `[CONFIRMAR: jurídico — art. 7º, IX]`     |
| Registros de acesso da hospedagem            | `[CONFIRMAR: obrigação legal (Marco Civil) ou legítimo interesse]`                              |

### 5. Com quem compartilhamos

**Anthropic, PBC (Estados Unidos)**

- **Função:** provedor de inteligência artificial, que recebe a foto
  preparada e a descrição gerada a partir dela para produzir a leitura.
- **Treinamento:** pelos termos comerciais da Anthropic, o conteúdo
  enviado pela API não é usado para treinar modelos.
- **Retenção:** segundo a documentação da Anthropic, entradas e saídas da
  API são excluídas, por padrão, em até 30 dias. Há exceções
  `[CONFIRMAR: lista das exceções na página oficial e condições
efetivas da conta do Sidera, inclusive se há retenção zero]`.

**Hospedagem:** `[A DEFINIR]`.

**Não vendemos dados** e não os compartilhamos para publicidade.

### 6. Transferência internacional

- **O que é transferido:** a foto preparada e a descrição gerada a partir
  dela são processadas nos Estados Unidos, pela Anthropic.
- **Base da transferência:** `[A DEFINIR com o jurídico: cláusulas-padrão
contratuais da ANPD (Resolução CD/ANPD nº 19/2024) ou seu consentimento
específico e em destaque para a transferência (LGPD, art. 33, VIII)]`.
- **Pedido de autorização:** pedimos essa autorização separadamente, antes
  do envio.
- **Hospedagem:** `[A DEFINIR: se a hospedagem também estiver fora do
Brasil, incluir aqui]`.

### 7. Por quanto tempo guardamos

| Dado                   | No Sidera                                                                                                                                                       | Fora do Sidera            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Foto                   | Não é gravada; existe na memória do servidor só durante a análise (até cerca de 1 minuto) e depois é apagada                                                    | Anthropic: ver item 5     |
| Texto da leitura       | Até 10 minutos na memória do servidor, para não repetir a mesma análise, junto de um código (hash) da foto que não permite reconstruí-la                        | Anthropic: ver item 5     |
| Autorização da leitura | Um comprovante assinado que vale 30 minutos e fica no seu aparelho; o servidor não o guarda `[REVER se a 03G decidir guardar registro mínimo do consentimento]` | —                         |
| Dados de nascimento    | Não são gravados                                                                                                                                                | —                         |
| Hash do IP             | `[CONFIRMAR: até 1 hora]`                                                                                                                                       | Hospedagem: `[A DEFINIR]` |

### 8. Seus direitos

**Direitos (art. 18 da LGPD):**

- confirmação de que tratamos seus dados e acesso a eles;
- correção;
- anonimização, bloqueio ou eliminação;
- portabilidade;
- informação sobre compartilhamento;
- revogação do consentimento;
- revisão de decisões automatizadas, quando aplicável;
- petição à ANPD.

**Como pedir:** escreva para `[A DEFINIR: e-mail]`.

**Limites, por desenho do Sidera:**

- Como não há conta e não gravamos a foto nem os dados de nascimento,
  normalmente não teremos dados seus guardados para mostrar ou apagar.
- O que foi enviado à Anthropic não fica associado à sua identidade. Por
  isso, não conseguimos localizar uma análise específica para pedir a
  exclusão antecipada; ela segue o prazo do item 5.

**Revogar o consentimento:**

- Você pode revogar a qualquer momento: descarte a foto ou saia da
  leitura.
- A revogação impede novos envios. O que já foi enviado segue os prazos
  acima.

### 9. Segurança

Medidas adotadas:

- conexão criptografada `[CONFIRMAR na hospedagem: HTTPS/HSTS]`;
- remoção de metadados antes do envio;
- recusa de imagens com metadados no servidor;
- nenhuma gravação da foto;
- comprovante de autorização assinado e com validade curta;
- limites de uso.

Nenhum sistema é totalmente imune a incidentes. Se houver um incidente que
possa causar risco ou dano relevante, comunicaremos a ANPD e as pessoas
afetadas, conforme a lei.

### 10. Idade

As leituras são exclusivas para maiores de 18 anos. A idade é declarada
pela própria pessoa.

### 11. Natureza das leituras

- **O que não são:** astrologia e quiromancia são tradições simbólicas.
  As leituras não são diagnósticos nem previsões.
- **Decisões:** não são usadas para tomar decisões sobre você.

### 12. Mudanças nesta política

Se esta política mudar, a nova versão será publicada nesta página, com a
data. Mudanças que afetem o uso da foto exigirão nova autorização.

---

**Para a revisão jurídica:**

- itens 4, 6, 7 (consentimento) e 8 (limites dos direitos);
- obrigação do Marco Civil;
- papel da Anthropic (operadora);
- se o regime de agente de pequeno porte se aplica.
