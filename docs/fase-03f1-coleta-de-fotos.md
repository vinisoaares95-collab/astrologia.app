# Fase 03F.1 — Coleta das 8 fotografias do piloto

Procedimento prático para organizar as fotos com segurança **antes** da
execução paga (03F.2, ainda não autorizada). Usa só o que já existe
(`docs/fase-03f1-avaliacao-visual.md`); nada aqui faz chamadas pagas.

**Resumo em 8 passos**

1. Revisão jurídica da minuta do termo (seção 1). **Sem isso, não colete.**
2. Cada voluntário assina o termo e recebe um código `AUT-03F-NN`.
3. O voluntário fotografa a palma seguindo a seção 2 e envia o arquivo
   original, como documento, por canal privado.
4. Você cria a pasta fora do repositório e renomeia as fotos para `p01.jpg`…
   (seção 3).
5. Você preenche o `manifesto.json` (seção 4).
6. Você roda o plano gratuito (seção 6), que confere as fotos e gera
   `referencia.csv`.
7. O revisor preenche a referência olhando as fotos (seção 5), antes de
   qualquer resultado de modelo.
8. Depois da avaliação e da revisão, você apaga tudo (seção 7).

---

## 1. Minuta do termo de autorização

> ⚠️ **MINUTA — precisa de revisão jurídica (LGPD) antes de qualquer coleta.**
> Não é um texto aprovado. Pontos para o jurídico: base legal
> (consentimento específico), dado biométrico/sensível ou não, transferência
> internacional (provedor nos EUA), prazo de retenção, quem é o
> controlador e o canal para exercer direitos.

**Termo de autorização — Avaliação experimental de descrição de fotos da
palma da mão (Sidera, Fase 03F)**

Código da autorização: `AUT-03F-__` · Data: `__/__/____`

1. **O que é.** O Sidera está testando, de forma experimental, se dois
   modelos de inteligência artificial da empresa Anthropic (Claude Haiku 5.5
   e Claude Sonnet 5.5) conseguem **descrever** características visíveis da
   palma de uma mão (formato, comprimento dos dedos e traçado das linhas).
   Não haverá leitura de quiromancia, interpretação, perfil nem resultado
   para você. É um teste interno de um produto ainda não lançado.
2. **O que será feito com a foto.** A foto será reduzida e terá os
   metadados (data, local, aparelho) removidos. Depois será enviada à
   Anthropic duas vezes por modelo, no máximo, e as descrições serão
   comparadas por uma pessoa revisora com a foto original.
3. **Compartilhamento com a Anthropic.** A foto será processada pela API da
   Anthropic, empresa dos Estados Unidos, segundo as políticas dela. **A
   Anthropic pode reter os dados enviados por um período próprio**
   (por exemplo, para segurança e prevenção de abuso), independentemente da
   exclusão feita pelo Sidera. _[O jurídico deve inserir aqui o prazo e as
   condições vigentes, conferidos na política do provedor na data da
   coleta.]_
4. **Quem verá a foto.** Só o responsável pela avaliação e a pessoa
   revisora. A foto não será publicada, não entra em relatórios e não é
   guardada no código do projeto. Nos registros, ela é identificada só por
   um código (`foto-01`…), sem seu nome.
5. **Riscos.** Uma foto da palma pode, em tese, ajudar a identificar uma
   pessoa (por exemplo, por marcas, cicatrizes ou impressões das linhas).
   Para reduzir esse risco: fotografe **só a palma**, sem rosto, documentos,
   tatuagens, joias ou objetos identificáveis; a foto é guardada por pouco
   tempo, com acesso restrito. Não é possível eliminar o risco de retenção
   pelo provedor descrito no item 3.
6. **Exclusão.** A foto e as cópias do Sidera serão apagadas em até
   **7 dias** depois da revisão _[prazo a confirmar]_. Os relatórios que
   permanecem contêm só descrições em texto, sem imagem e sem seu nome.
7. **Retirada da autorização.** Você pode retirar esta autorização a
   qualquer momento, sem justificativa, pelo contato `__________`. Antes da
   avaliação: a foto é apagada e não será usada. Depois: a foto e as linhas
   referentes a ela nos relatórios são apagadas. O que já foi enviado ao
   provedor segue a política dele (item 3).
8. **Voluntário e sem custo.** A participação é voluntária, sem pagamento
   e sem prejuízo se você recusar.
9. **Declaração.** Declaro que tenho **18 anos ou mais**, que a mão
   fotografada é minha e que li e concordo com este termo.

Assinatura: `________________________`

_(Guarde o termo assinado fora do Sidera e do repositório; no projeto, use
só o código `AUT-03F-NN`.)_

## 2. Como fotografar a palma (para enviar aos voluntários)

- **Luz:** perto de uma janela, com luz natural. Sem flash, sem sol direto e
  sem sombras fortes sobre a palma.
- **Enquadramento:** a palma de frente para a câmera, do pulso à ponta dos
  dedos, ocupando quase toda a foto. Só uma mão, a **palma** (não o dorso).
- **Dedos:** levemente afastados, sem forçar; mão relaxada e aberta.
- **Distância e ângulo:** celular paralelo à mão, a uns 25 cm. Apoie o
  braço ou o celular para não tremer.
- **Foco:** toque na palma na tela para focar e confira, com zoom, se as
  linhas aparecem nítidas. Se não, tire outra.
- **Fundo:** liso e mais escuro que a pele, se possível.
- **Não incluir:** rosto, documentos, tatuagens, anéis, pulseiras, relógio,
  unhas decoradas ou qualquer objeto identificável.
- **Câmera:** a principal (não a frontal), sem filtros, sem modo retrato e
  sem edição.
- **Envio:** mande o **arquivo original como documento** (no WhatsApp,
  "Documento", não "Galeria"; por e-mail, como anexo), para não perder
  resolução. Informe se é a mão **direita** ou **esquerda**.
- **iPhone:** se o arquivo for `.HEIC`, ative Ajustes → Câmera → Formatos →
  "Mais compatível" antes de fotografar, ou exporte como JPEG. O preparo do
  Sidera aceita JPEG e PNG; HEIC não é garantido.

Para o piloto, procure variedade: as duas mãos, peles e idades diferentes
(sem registrar esses dados), e ao menos uma foto propositalmente difícil
(luz fraca ou leve desfoque).

## 3. Onde guardar e como levar as fotos ao ambiente de testes

**Recomendado: rodar o plano e a avaliação no seu próprio computador.** As
fotos ficam numa pasta local, sem passar por mais nenhum serviço. Os
comandos são os mesmos, num clone local do repositório (Claude Code no
terminal ou no app Desktop, ou só o terminal).

```bash
# Fora do repositório; só você com acesso
mkdir -p ~/sidera-fotos-03f && chmod 700 ~/sidera-fotos-03f
# Copie as fotos recebidas, com nomes neutros
cp ~/Downloads/<arquivo-recebido>.jpg ~/sidera-fotos-03f/p01.jpg
chmod 600 ~/sidera-fotos-03f/*
```

Depois, apague o arquivo original do Downloads e da conversa em que foi
recebido, para manter uma única cópia.

**Se precisar usar uma sessão de nuvem do Claude Code:** o contêiner não
enxerga o seu computador. Para levar os arquivos até ele:

- **Nunca** anexe as fotos no chat da sessão: isso as entrega ao assistente
  (e ao histórico da conversa) e equivale a processar as fotos fora do fluxo
  controlado.
- **Nunca** as coloque no Git, em issue, PR ou link público.
- Use um link privado e temporário (por exemplo, um compartilhamento com
  expiração curta no seu armazenamento em nuvem), baixe direto para uma
  pasta fora do repositório e apague o link em seguida:

  ```bash
  mkdir -p /tmp/sidera-fotos-03f && chmod 700 /tmp/sidera-fotos-03f
  curl -sSfL -o /tmp/sidera-fotos-03f/p01.jpg "<link-temporario>"   # sem -v
  ```

  O host do link precisa estar liberado na rede do ambiente. O link aparece
  no histórico do terminal: apague-o do provedor de armazenamento logo
  depois.

- Em qualquer sessão, peça ao assistente apenas para **rodar os comandos**;
  ele não deve abrir as imagens nem listar seus metadados.

O Sidera recusa pasta dentro do repositório, não grava fotos preparadas, não
registra nomes de arquivo nos relatórios e zera as imagens da memória ao
terminar.

## 4. Modelo do manifesto

Arquivo `manifesto.json`, **dentro da pasta das fotos**:

```json
[
  { "arquivo": "p01.jpg", "mao": "direita", "autorizacao": "AUT-03F-01" },
  { "arquivo": "p02.jpg", "mao": "esquerda", "autorizacao": "AUT-03F-02" },
  { "arquivo": "p03.jpg", "mao": "direita", "autorizacao": "AUT-03F-03" },
  { "arquivo": "p04.jpg", "mao": "esquerda", "autorizacao": "AUT-03F-04" },
  { "arquivo": "p05.jpg", "mao": "direita", "autorizacao": "AUT-03F-05" },
  { "arquivo": "p06.jpg", "mao": "esquerda", "autorizacao": "AUT-03F-06" },
  { "arquivo": "p07.jpg", "mao": "direita", "autorizacao": "AUT-03F-07" },
  { "arquivo": "p08.jpg", "mao": "esquerda", "autorizacao": "AUT-03F-08" }
]
```

Regras conferidas pelo sistema: no máximo 8 itens; exatamente esses três
campos; nome de arquivo sem pastas; mão `direita` ou `esquerda`;
autorização no formato `AUT-03F-NN`, sem repetir. **Nunca** use nomes de
pessoas no arquivo, no manifesto ou na autorização. A tabela
"código → pessoa" fica só com os termos assinados, fora do Sidera.

O plano cria, na mesma pasta, `mapa-fotos.json` (`foto-01` → `p01.jpg`), que
o revisor usa para saber qual foto é qual. Ele é apagado junto com as
fotos.

## 5. Referência visual humana (antes dos resultados)

O plano gratuito já gera `revisao/referencia.csv`, **sem nada dos
modelos**. Preencha-a antes da execução paga, e a execução não a
sobrescreve, desde que use a mesma pasta de relatórios
(`SIDERA_PALM_EVAL_OUT_DIR`).

1. Abra cada foto (use `mapa-fotos.json` para saber qual é `foto-01`…).
2. Para cada linha (foto × característica), preencha:
   - `revisor_visibilidade`: `nitida`, `parcial` ou `nao_visivel`. Na
     dúvida, `nao_visivel`, o mesmo critério pedido aos modelos;
   - `revisor_valor`: um dos valores da coluna `opcoes_de_valor` (vazio
     se não visível). Por exemplo, `long` para uma linha do coração que
     chega à área sob o indicador.
3. Use os critérios da coluna `caracteristica` e as definições da 03C
   (`docs/fase-03c-observacoes-e-biblioteca.md`).
4. Não escreva dados pessoais no arquivo.
5. Só depois da execução abra `revisao/ficha.csv` para conferir as
   evidências de A e B. Não abra `restrito/` antes de terminar.

O ideal é que o revisor não seja quem organizou a execução. Basta que não
saiba qual modelo é A ou B.

## 6. Planejamento gratuito de custos com as fotos reais

Sem chave e sem chamadas. Prepara as fotos em memória, confere cada uma com
as checagens do servidor e grava o plano e a referência:

```bash
SIDERA_PALM_EVAL_MODE=plan \
SIDERA_PALM_EVAL_DIR=~/sidera-fotos-03f \
SIDERA_PALM_EVAL_OUT_DIR=avaliacao-ia/03f-piloto \
SIDERA_AI_USD_BRL=5.50 \
npx vitest run src/features/palm-reading/evaluation/vision-eval.run.test.ts
```

- `SIDERA_AI_USD_BRL`: câmbio do dia, com alguma folga.
- O resultado fica em `avaliacao-ia/03f-piloto/` (ignorada pelo Git):
  - `plano.md`: custo esperado e pior caso por modelo, teto da execução e
    quantas fotos cabem em R$ 7;
  - `revisao/referencia.csv`: a referência a preencher.
- **Se alguma foto for recusada** (ilegível, pequena, ausente), o comando
  falha e mostra só o identificador e o motivo (`foto-03: Resolução abaixo
do mínimo.`), nunca o nome do arquivo; o `plano.md` também lista as
  recusadas. Peça nova foto ao voluntário ou corrija o manifesto e rode de
  novo.
- Referência (8 fotos sintéticas, tamanho típico de celular): esperado
  ≈ R$ 1,85; pior caso R$ 5,96.

A execução paga (03F.2) usa a **mesma** `SIDERA_PALM_EVAL_OUT_DIR` e só
acontece com a sua autorização expressa.

## 7. Exclusão: armazenamento local × retenção do provedor

**O que o Sidera controla (apagar você mesmo):**

| Onde                                               | O que apagar                                                                    | Quando                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------- |
| Pasta das fotos (`~/sidera-fotos-03f`)             | Fotos, `manifesto.json`, `mapa-fotos.json`                                      | Até 7 dias após a revisão     |
| Canal de recebimento (e-mail, WhatsApp, Downloads) | Mensagens e anexos originais                                                    | Logo após copiar para a pasta |
| Link temporário (só na opção de nuvem)             | O compartilhamento e o arquivo no armazenamento                                 | Logo após o download          |
| Contêiner da sessão de nuvem (se usado)            | `rm -rf /tmp/sidera-fotos-03f`                                                  | Ao terminar                   |
| Memória do processo                                | Zerada automaticamente pelo Sidera                                              | Ao fim de cada execução       |
| Relatórios (`avaliacao-ia/03f-piloto/`)            | Nada obrigatório (não têm imagem); as linhas de uma foto, se o voluntário pedir | Sob pedido                    |

```bash
rm -rf ~/sidera-fotos-03f       # fotos, manifesto e mapa
# esvazie a lixeira, se o sistema mover para lá
```

Registre fora do repositório a data de exclusão de cada `AUT-03F-NN`.

**O que o Sidera não controla: a retenção do provedor.** As fotos enviadas
à API da Anthropic na execução paga ficam sujeitas à política de retenção
da Anthropic, que pode guardá-las por um período próprio mesmo depois de
tudo apagado do lado do Sidera. Apagar a pasta local **não** apaga o que foi
enviado. Antes da coleta, confira a política vigente e as opções da conta
(por exemplo, retenção zero, se aplicável ao contrato), informe-as no termo
e, se o voluntário retirar a autorização depois do envio, registre o pedido
e siga o canal do provedor quando existir. No plano gratuito nada é enviado
ao provedor.
