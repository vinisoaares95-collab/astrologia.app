# Fase 04B — resultado das mãos na jornada do relatório

**Registro de 23/11/2026.**

- **Inalterados:** motores, critérios visuais, cálculo astrológico e o
  registro persistente de consentimento da 03G.
- **Sem custo e sem publicação:** nenhuma chamada paga, nenhum deploy.
- **Não integrados:** os capítulos 1 a 5, que vêm na 04C, e os capítulos 8
  e 9, que aguardam especificação.

## 1. Onde fica a memória da jornada

Árvore real de layouts:

```
app/layout.tsx
├─ (site)/layout.tsx         → /, /como-funciona, …
└─ (jornada)/layout.tsx      → JourneyProvider (04B)
   ├─ leitura-das-maos/layout.tsx → PalmPhotoProvider (foto, D5)
   │  ├─ /leitura-das-maos, /consentimento, /foto, /previa
   ├─ /dados-de-nascimento
   ├─ /relatorio              (oferta)
   └─ /relatorio/leitura      (leitura, só interna)
```

**Como o Next.js 16 trata essa árvore.** Com `cacheComponents`, ele
**esconde** as rotas com `<Activity>`. Esconder executa a limpeza dos
efeitos de layout, e as duas memórias usam isso:

| Evento                                        | Layout das mãos | Layout da jornada | Efeito                                                                        |
| --------------------------------------------- | --------------- | ----------------- | ----------------------------------------------------------------------------- |
| Navegar entre as etapas das mãos              | visível         | visível           | progresso mantido                                                             |
| **Continuar** da prévia para o nascimento     | escondido → D5  | visível           | foto, recibo e estado da captura descartados; **o texto já transferido fica** |
| Ir ao nascimento, à oferta ou à leitura       | escondido       | visível           | texto disponível                                                              |
| Sair para o site (X, logotipo, links do site) | escondido       | **escondido**     | foto **e** texto descartados; telas remontadas                                |
| Recarregar, fechar e abrir de novo            | —               | —                 | memória vazia (nada persistido)                                               |

## 2. Transferência explícita

**Quando acontece:**

- no clique de **"Continuar: dados de nascimento"** da prévia, com
  `journey.transferHands(analysis)` e depois `router.push`;
- antes de o layout das mãos ser escondido e de o D5 descartar a foto;
- **sem nenhuma chamada a Sonnet ou Haiku.**

**O que vai e o que não vai** (`toJourneyHands`, cópia campo a campo):

- **Vai:**
  - status, recomendação de nova foto, simulado e aviso;
  - por capítulo: número, título, estado, introdução, seções (texto,
    observado já convertido, notas), síntese, perguntas, limitações e
    mensagem de indisponível.
- **Não vai:** foto original, JPEG preparado, URL `blob:`, hash da foto,
  recibo, credenciais ou qualquer campo fora dessa lista. Há teste com um
  objeto "poluído".

**Outras regras:**

- **Sair da captura sem continuar:** nada vai para a jornada.
- **Avançar não revoga** o consentimento no servidor.
- **Retirar o consentimento** (prévia ou consentimento) revoga como
  antes **e também apaga o texto** da jornada.
- **Respostas atrasadas:** as tarefas das mãos continuam abortadas e
  invalidadas pelo D5. A jornada só recebe dados no clique explícito.

## 3. Leitura: `/relatorio/leitura`

**Sem `?cenario=`: jornada real.** Exige `SIDERA_REPORT_READING=1` e é só
interna.

- **Capítulos 6 e 7:** **exatamente** o texto da prévia, pelos
  adaptadores da 04A, sem regenerar. Mensagens de indisponível, leitura
  parcial, sugestão de nova foto e aviso de não cientificidade são os do
  motor.
- **Capítulos 1 a 5:** "Em integração", só título e resumo.
- **Capítulos 8 e 9:** "Em definição".
- **Sem leitura na jornada:** a Parte II aparece indisponível, com o
  motivo. **Nunca há dados de exemplo.**
- **Faixa no topo:** "Leitura interna em construção… Não é o relatório
  completo."

**Com `?cenario=`: só exemplos (04A).** Exige `SIDERA_REPORT_DEMO=1` e
nunca lê a jornada.

**Proxy:** sem nenhuma das duas variáveis, `/relatorio/leitura` responde
**404 antes de renderizar**.

**Acesso dentro do app:** a página de oferta `/relatorio` mostra o atalho
"Abrir a leitura desta jornada" **só com** `SIDERA_REPORT_READING=1`. É um
link interno, para não recarregar a página e perder a memória.

## 4. Textos (consentimento `04b.1`)

| Onde                                                  | Antes                                             | Agora                                                                                                                                                                                                                       |
| ----------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consentimento, "Antes de qualquer envio"              | cópia "na memória desta tela", "sai dela quando…" | cópia só na memória da leitura das mãos; ao descartar ou sair dessa etapa, o Sidera deixa de mantê-la (**a liberação da memória é feita pelo navegador**)                                                                   |
| Consentimento, nova seção "O que fica neste aparelho" | —                                                 | o texto da leitura (sem a foto) segue na memória desta aba até sair da jornada, recarregar ou fechar; nada é gravado no aparelho                                                                                            |
| Consentimento, "Seus direitos"                        | "descarte a foto ou saia do fluxo"                | três ações distintas: **descartar a foto ou sair da leitura das mãos** (tira a foto); **sair da jornada, recarregar ou fechar** (também apaga o texto); **retirar o consentimento** (faz tudo isso e cancela a autorização) |
| Prévia, aviso da foto                                 | "na memória desta tela"                           | "a foto fica só nesta etapa; ao continuar, segue apenas o texto da leitura"                                                                                                                                                 |
| Prévia, botão                                         | "Descartar foto e sair" (revogava sem dizer)      | **"Retirar consentimento e sair"**, com o quadro "O que cada opção faz": Continuar, Retirar consentimento e sair, Sair pelo X                                                                                               |
| Prévia sem foto                                       | "fica apenas na memória desta tela"               | "fica só na leitura das mãos"; avisa quando o texto continua na jornada                                                                                                                                                     |

**Versão do consentimento:** passou de `03g3.1` para **`04b.1`**. Os
recibos anteriores vencem em 30 min. Os testes foram atualizados.

## 5. Testes

**Unitários (Vitest):**

- jornada (7): cópia campo a campo; Continuar transfere o texto idêntico;
  a foto é descartada ao esconder as mãos e o texto fica; voltar não
  restaura a foto; avançar não revoga; sair sem continuar não transfere;
  retirar o consentimento apaga o texto; sair da jornada apaga e remonta;
  as três opções são explicadas;
- leitura da jornada (3);
- isolamento (2 novos);
- armazenamento (1): nenhum `localStorage`, `sessionStorage`,
  `document.cookie` ou IndexedDB no código;
- textos (1 novo).

**Navegador** (`scripts/e2e/04b-jornada.mjs`, Chromium, desktop
1440×900 e iPhone 13). Roda no servidor de desenvolvimento com análise
**simulada**, porque em produção a leitura das mãos responde 503 por
projeto (03G.3). São três cenários do simulador.

| Verificação                                                                                     | claro     | parcial   | insuficiente                                           |
| ----------------------------------------------------------------------------------------------- | --------- | --------- | ------------------------------------------------------ |
| 1. Captura, análise e continuidade até o nascimento                                             | ✓         | ✓         | — (não há como seguir; a orientação de nova foto fica) |
| 2. Transferência sem foto (nenhum `blob:` no DOM, inclusive nas rotas escondidas; URL revogada) | ✓         | ✓         | ✓                                                      |
| 3. Capítulos 6 e 7 idênticos aos da prévia                                                      | ✓         | ✓         | —                                                      |
| 4. Leitura parcial sinalizada; foto insuficiente → Parte II com o motivo                        | —         | ✓         | ✓                                                      |
| 5. Voltar pelo navegador não restaura a foto; avançar de novo                                   | ✓         | ✓         | —                                                      |
| 6. Sair da jornada (X) e voltar: texto apagado                                                  | ✓         | ✓         | —                                                      |
| 7. Recarregar ou abrir de novo: leitura vazia                                                   | ✓         | ✓         | —                                                      |
| 8. Resposta atrasada (4 s) depois de sair: não volta à prévia nem recria nada                   | ✓         | ✓         | —                                                      |
| 9. Exemplos (`?cenario=`) separados da jornada real                                             | ✓         | ✓         | —                                                      |
| 10. Nada em `localStorage`, `sessionStorage`, cookies ou IndexedDB                              | ✓         | ✓         | —                                                      |
| **Total (desktop + celular)**                                                                   | **28/28** | **30/30** | **4/4**                                                |

**Servidor de produção:**

| Situação                   | Resultado                                                                        |
| -------------------------- | -------------------------------------------------------------------------------- |
| Sem variáveis              | `/relatorio/leitura` 404 (com e sem `?cenario=`); `/relatorio` 200, sem o atalho |
| Só `SIDERA_REPORT_READING` | jornada 200; `?cenario=` não mostra exemplos; atalho presente                    |
| Só `SIDERA_REPORT_DEMO`    | roteiro da 04A: 45/45, sem regressão                                             |

**Suíte:**

- `npm run check`: **1214 testes passaram**, 42 pulados;
- `npm run build`: concluído.

**Capturas** (`docs/capturas/fase-04b/`, servidor de desenvolvimento;
o selo "N" é do Next.js em dev): prévia, nascimento, leitura e Parte II,
leitura sem as mãos, parcial e foto insuficiente, em desktop e celular.

## 6. Pendências para a 04C

1. **Capítulos 1 a 5 na jornada.** Uma chamada do servidor por envio
   (normalizar → mapa → interpretação → biblioteca por padrão), atrás de
   `SIDERA_INTERNAL_ENGINE`.
   - O resultado entra na jornada como `SkyInput` (`ready`, `loading` ou
     `unavailable`), no lugar do `pending` de hoje.
   - Só o texto entra, sem dados de nascimento crus além do resumo
     exibido.
2. **Transferência do nascimento.** Mesmo padrão explícito, no
   "Confirmar e ver a proposta". Descarte pelas mesmas saídas.
3. **Texto dos dados de nascimento.** Hoje diz que eles "somem ao
   recarregar ou fechar". Com a 04C, o resultado do céu passa a seguir na
   jornada, e o texto precisa dizer isso.
4. **IA nos capítulos 1 a 5.** Só com autorização própria (Haiku 5.5 e
   avaliação paga). Com ela ligada, o aviso "não os repassa a outros
   serviços" deixa de ser verdadeiro.
5. **Licença do motor.** O relatório continua interno até a decisão
   (`docs/fase-04a-licenca-motor.md`).
6. **Capítulos 8 e 9.** Aguardam especificação editorial aprovada.
