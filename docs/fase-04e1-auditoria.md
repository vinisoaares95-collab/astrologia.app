# Fase 04E.1 — Auditoria do relatório integrado

Estado: **concluída, só interna.** Não houve deploy, chamada paga,
experimento de repetibilidade nem mudança no consentimento da 03G. As
funcionalidades comerciais (checkout, PDF) também ficaram fora.

As medições foram feitas no **servidor de desenvolvimento** (`next dev`),
neste contêiner (4 vCPU, 16 GB, Node 22.23, Chromium do Playwright), com a
leitura das mãos simulada e imagem sintética. **Não representam produção.**

## 1. O que foi validado

| Área                                                               | Como                                                                                                           | Resultado                                                                                   |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Jornada completa (mãos → prévia → nascimento → oferta → relatório) | `04d-jornada.mjs` (4 execuções) e `04e1-auditoria.mjs`, em desktop 1440×900, iPhone 13 e iPhone SE             | Aprovada                                                                                    |
| Nove capítulos                                                     | Recife (exato) + mão clara                                                                                     | 9 de 9; capítulo 8 com diferença; capítulo 9 com 3 temas                                    |
| Capítulos 1–5 sem mãos                                             | Direto aos dados de nascimento                                                                                 | Capítulo 8 com U1; capítulo 9 só com o céu; 6 de 9                                          |
| Mãos sem mapa                                                      | Motor desligado                                                                                                | Capítulo 8 com U2; capítulo 9 só com o capítulo 7; 3 de 9                                   |
| Leitura das mãos parcial                                           | Cenário simulado `partial`                                                                                     | Traço parcial fora das conexões, com a ressalva; capítulo 9 disponível                      |
| Capítulo 8 indisponível e 9 disponível                             | São Paulo, horário desconhecido                                                                                | U6 com a causa real; capítulo 9 disponível                                                  |
| Horário aproximado e desconhecido                                  | Bom Jesus e São Paulo (`04c-relatorio.mjs`)                                                                    | Limites do motor nos capítulos 1–5; posição incerta fora das comparações (R-hora, em teste) |
| Falta de conteúdo                                                  | Foto insuficiente + motor desligado                                                                            | A foto não chega à prévia; capítulos 8 (U3) e 9 (V1) indisponíveis; 0 de 9                  |
| Indicadores e navegação                                            | Sumário, contador "N de 9", âncoras, Voltar                                                                    | Corretos em todos os cenários                                                               |
| Bloqueios internos                                                 | `?cenario=` sem a demonstração habilitada                                                                      | 404; nenhum exemplo na leitura real                                                         |
| Editorial                                                          | Relatórios completos (1–9) de 5 cenários lidos na íntegra, montados só com os motores e bibliotecas do produto | Ver seções 2 e 4                                                                            |

## 2. Problemas encontrados, por impacto

### Alto

Nenhum.

### Médio

Todos corrigidos nesta etapa.

- **M1. Concordância das frases-ponte do capítulo 8.**
  - Nas frases de diferença, o texto dizia sempre "estes traços" e "as
    posições citadas do mapa (são associadas)". Mas o céu tem **uma** posição
    comparável em quase todos os casos (só Marte no ritmo; Lua ou Vênus na
    expressão), e a leitura parcial deixa **um** traço.
  - Nas frases de contraponto, o texto dizia "imagens de reserva/abertura",
    embora o outro lado seja sempre **uma** posição.
- **M2. Preposição nas casas (capítulos 1–5, texto composto pelo motor
  02E).** Saía "associa … às viagens, os estudos e a busca de sentido": só
  o primeiro artigo era contraído.
- **M3. Concordância do regente (capítulo 1).** "o afeto, o prazer e a forma
  de se vincular … ganha peso". As funções dos corpos são sujeitos
  compostos, exceto a de Mercúrio.

### Baixo

- **B1. Aviso de leitura simulada repetido três vezes** (Parte II, limites do
  capítulo 8 e Parte III). Corrigido.
- **B2. Ressalvas maiores que o texto personalizado no capítulo 8.** Num
  tema só, o texto tem 85 palavras e os limites, 105; no iPhone SE os
  limites ocupam quase uma tela. É decisão editorial (4.1).
- **B3. Repetições no texto composto dos capítulos 1–5.** Por exemplo,
  "Júpiter na casa 9 … a busca de sentido às viagens, aos estudos e à busca
  de sentido", e Marte em Escorpião seguido da cúspide 7 em Escorpião com as
  mesmas qualidades. É decisão editorial (4.4).
- **B4. Capítulo 9 pouco diferenciado.** A pergunta de identidade aparece em
  quase todo relatório com céu; há 12 combinações de perguntas nas 84
  combinações. É decisão editorial (4.2).
- **B5. "Construir com as próprias mãos"** (texto autoral do elemento Terra,
  capítulo 1) num relatório que tem uma leitura das mãos pode soar como
  referência às mãos. É decisão editorial (4.4).
- **B6. Roteiros de navegador.** O da D5 clicava antes da hidratação, e o da
  04E.1 esperava uma resposta em fluxo que não termina. Corrigidos.

### Não são defeitos

- **Capítulos 5 e 6 sem temas no capítulo 9** (seção 3).
- **O selo "N"** nas capturas é do servidor de desenvolvimento.

## 3. Capítulos 5, 6, 8 e 9

| Ponto                                 | Diagnóstico                                                                                                                                                                                                        | Classe                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Capítulo 5 não contribui              | Seus itens elegíveis são Saturno e Júpiter (signo), que **não têm assunto** aprovado (decisão de `d71f524`: sem vaga para o capítulo 5; as perguntas de estrutura e expansão foram retiradas por não serem usadas) | Consequência legítima das regras e oportunidade editorial |
| Capítulo 6 não contribui              | Todos os itens são palma, dedos ou tipo de mão, excluídos por D3 e D4 (proporção ou instabilidade)                                                                                                                 | Falta de conteúdo elegível, por decisão aprovada          |
| Capítulo 8: diferenças e aproximações | Legíveis: selo, "Nas mãos"/"No céu" e uma frase que nomeia os lados; a síntese explica que diferença não é erro                                                                                                    | Adequado; corrigida a concordância (M1)                   |
| Capítulo 8 indisponível               | Mensagem com a causa real (U1–U6, U4-misto), dentro do próprio capítulo; contador e sumário coerentes                                                                                                              | Adequado                                                  |
| Capítulo 9: diversidade e relevância  | Perguntas de eixo dependem da leitura (polo e tensão); a de identidade é geral e aparece quase sempre                                                                                                              | Risco de parecer genérico (B4); decisão editorial         |
| Integração                            | Nenhum defeito: as pontes chegam completas; a seleção bate com a regra em 165 combinações                                                                                                                          | —                                                         |

## 4. Decisões editoriais ou de produto

1. **Proporção de ressalvas no capítulo 8 (B2).** Opções:
   - agrupar R-conf, R-escopo e R-simulada numa ressalva só;
   - mostrar os limites recolhidos ("ver limites").

   As duas alteram textos ou o design aprovados, por isso não as implementei.

2. **Diversidade do capítulo 9 (B4).** Opções:
   - deixar a pergunta de identidade só quando faltar um tema de eixo;
   - aprovar perguntas de identidade variadas pelo signo do Sol (biblioteca
     nova).
3. **Capítulo 5 no guia (seção 3):** manter a decisão de `d71f524` ou
   aprovar perguntas de estrutura e expansão, com uma regra de uso.
4. **Repetições e "próprias mãos" nos capítulos 1–5 (B3, B5):** revisão da
   biblioteca astrológica 02E, que está fora do escopo desta etapa.

## 5. Correções executadas

| #   | Correção                                                                                                                                                                                    | Onde                                                                                                                  | Testes                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| M1  | Frases de diferença com `{traço}`, `{posição}` e `{associada}` concordando com o número real de referências; contraponto no singular ("uma imagem de reserva/abertura"); biblioteca `04d.2` | `journey-chapters/library.ts`, `render.ts`; documento consolidado (3.3 e tabela de concordância; exemplos corrigidos) | Novo teste de concordância nas 165 combinações; fidelidade ao documento              |
| M2  | `toPrep` contrai o artigo de cada item da área ("às viagens, aos estudos e à busca de sentido")                                                                                             | `interpretation/engine.ts`                                                                                            | Novo teste em 24 mapas                                                               |
| M3  | Regente: "ganham" para sujeitos compostos, "ganha" para Mercúrio                                                                                                                            | `interpretation/engine.ts`                                                                                            | Novo teste em 24 mapas; instantâneos sem mudança (o regente das fixtures é Mercúrio) |
| B1  | Aviso da Parte III só quando o capítulo 9 usa as mãos e o capítulo 8 (que já tem R-simulada) não está disponível                                                                            | `integrated/build.ts`, `journey/journey-reading.tsx`                                                                  | `journey-reading.test.tsx` (2 casos)                                                 |
| B6  | Espera pela hidratação no roteiro da D5; medição sem esperar o fim da resposta em fluxo                                                                                                     | `scripts/e2e/`                                                                                                        | —                                                                                    |

Nenhuma correção alterou cálculos, seleção de itens, associações ou regras
aprovadas.

## 6. Testes e medições

### Testes

| Conjunto                                                                                  | Resultado                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                                                                           | **1271 aprovados**, 42 ignorados (pagos e de avaliação)                                                                                                                                                                                                                                                                                  |
| `npm run build`                                                                           | Aprovado                                                                                                                                                                                                                                                                                                                                 |
| `04d-jornada.mjs` (4 execuções, desktop e iPhone 13)                                      | Aprovado; axe WCAG A/AA sem violações nos nove capítulos                                                                                                                                                                                                                                                                                 |
| `04e1-auditoria.mjs` (novo; desktop, iPhone 13, iPhone SE)                                | Aprovado. Cobre: sumário → capítulos 8 e 9 com o título abaixo do cabeçalho fixo (topo a cerca de 280 px; cabeçalho até 77 px); foco visível no teclado e Enter abrindo o capítulo; sem rolagem horizontal; maior parágrafo dos capítulos 8–9 com 48 palavras; memória estável; `?cenario=` isolado; sem armazenamento; sem outros hosts |
| `04c-relatorio.mjs` (com e sem motor), `04b-jornada.mjs`, `d5-saida-do-fluxo.mjs` (17/17) | Aprovados. Incluem: resposta atrasada não restaura dados; sair e recarregar apagam; nenhuma foto (`blob:`) no DOM                                                                                                                                                                                                                        |

### Privacidade

- **Unidade:** as pontes só levam ids, rótulos já exibidos e polos. Os testes
  de cópia campo a campo recusam data, cidade, graus, evidência e mão.
- **Navegador:** a leitura visível não tem data, hora, cidade nem ids
  internos.

### Medições (desenvolvimento; não extrapolar)

| Medida                                                                                 | Valor                                                             |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Mapa + interpretação no servidor (Node, 30 mapas)                                      | ~1,2 ms por mapa                                                  |
| Ação de servidor do céu, ponta a ponta no navegador (inclui normalização e rede local) | 94–125 ms                                                         |
| Da confirmação até a leitura pronta (navegação + oferta + leitura)                     | 0,84–1,2 s                                                        |
| Montagem dos capítulos 8 e 9 (Node, 165 combinações × 20)                              | ~0,024 ms por chamada                                             |
| Tamanho das pontes (céu + mãos)                                                        | média ~1,6 KB; máximo ~2,2 KB                                     |
| Heap JS: início → leitura → depois de sair                                             | ~11 → 21–28 → 25–32 MB (rotas ocultas mantidas pelo `<Activity>`) |
| Heap JS após 3 jornadas seguidas                                                       | 17–22 MB, sem crescimento                                         |

## 7. Capturas

Em `docs/capturas/fase-04e1/`:

- `desktop-nove-capitulos`;
- `desktop-cap8-diferenca`, já com a concordância corrigida;
- `mobile-cap9-completo`;
- `mobile-cap8-indisponivel`;
- `mobile-cap8-parcial` ("este traço … a posição citada do mapa");
- `desktop-so-astrologia`;
- `mobile-cap9-so-maos`;
- `mobile-sem-conteudo`;
- `iphoneSE-cap8-viewport`.

## 8. Pendências para a próxima etapa

1. Decisões editoriais da seção 4.
2. Experimento de repetibilidade visual (pago; exige autorização) antes de
   rever D4.
3. Licença do motor (AGPL) e registro de consentimento em produção.
4. Medições em build de produção e em aparelho real, quando houver ambiente.
5. Fixtures da demonstração (`?cenario=`) com pontes, se a demonstração
   precisar mostrar os capítulos 8 e 9.
