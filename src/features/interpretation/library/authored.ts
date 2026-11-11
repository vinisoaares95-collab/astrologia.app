/**
 * Textos autorais (amostra vertical da Fase 02E).
 *
 * Chaves:
 *   sign:<corpo|asc>:<signo>    corpo ou Ascendente num signo
 *   house:<corpo>:<n>           corpo numa casa
 *   aspect:<a>-<b>:<natureza>   par de corpos (ordem alfabética do id) e
 *                               natureza do aspecto (conjunction|harmonious|tense)
 *   retro:<corpo>               retrogradação
 *   element-dominant:<elem>     elemento com 4+ corpos
 *   element-absent:<elem>       elemento sem corpos
 *
 * Regras editoriais: segunda pessoa, verbos de possibilidade ("pode",
 * "tende", "a tradição associa"), nenhum diagnóstico, nenhuma previsão,
 * 1–2 frases. Quando não há texto autoral, o motor compõe um a partir dos
 * significados de base (library/base.ts) e marca a origem como "composta".
 */
import type { ToneTag } from "./base";

export type AuthoredEntry = { text: string; tags?: ToneTag[] };

export const AUTHORED: Record<string, AuthoredEntry> = {
  // ── Sol nos signos ────────────────────────────────────────────────────
  "sign:sun:aries": {
    text: "Com o Sol em Áries, a tradição associa a identidade ao impulso de começar: você pode se reconhecer mais quando toma a frente e enfrenta o novo com franqueza.",
  },
  "sign:sun:taurus": {
    text: "Com o Sol em Touro, a identidade é tradicionalmente ligada à construção paciente: você pode se sentir mais em casa quando cultiva o que é concreto, belo e duradouro.",
  },
  "sign:sun:gemini": {
    text: "Com o Sol em Gêmeos, a tradição vê a identidade como movimento entre ideias e pessoas: a curiosidade pode ser o fio que dá sentido às suas escolhas.",
  },
  "sign:sun:cancer": {
    text: "Com o Sol em Câncer, a identidade costuma ser associada ao cuidado e ao pertencimento: proteger o que ama pode ser uma das formas mais autênticas de você se expressar.",
  },
  "sign:sun:leo": {
    text: "Com o Sol em Leão, a tradição liga a identidade à criação e à generosidade: você pode florescer quando se permite brilhar e oferecer calor aos outros.",
  },
  "sign:sun:virgo": {
    text: "Com o Sol em Virgem, a identidade é associada ao aperfeiçoamento e ao serviço: o cuidado com os detalhes pode ser uma forma de você dar sentido ao que faz.",
  },
  "sign:sun:libra": {
    text: "Com o Sol em Libra, a tradição associa a identidade ao encontro e ao equilíbrio: você pode se reconhecer na busca por harmonia e justiça nas relações.",
  },
  "sign:sun:scorpio": {
    text: "Com o Sol em Escorpião, a identidade é tradicionalmente ligada à profundidade: você pode preferir a intensidade verdadeira às superfícies e se transformar através das experiências.",
  },
  "sign:sun:sagittarius": {
    text: "Com o Sol em Sagitário, a tradição associa a identidade à busca de sentido: horizontes amplos, aprendizado e liberdade podem ser combustíveis importantes para você.",
  },
  "sign:sun:capricorn": {
    text: "Com o Sol em Capricórnio, a identidade é ligada à responsabilidade e à construção a longo prazo: você pode se realizar ao transformar metas em estruturas sólidas.",
  },
  "sign:sun:aquarius": {
    text: "Com o Sol em Aquário, a tradição associa a identidade à originalidade e ao coletivo: pensar diferente e contribuir para algo maior pode ser parte essencial de quem você é.",
  },
  "sign:sun:pisces": {
    text: "Com o Sol em Peixes, a identidade é associada à sensibilidade e à imaginação: você pode se reconhecer na empatia e na capacidade de perceber o que não é dito.",
  },

  // ── Lua nos signos ────────────────────────────────────────────────────
  "sign:moon:aries": {
    text: "A Lua em Áries é tradicionalmente associada a emoções rápidas e diretas: você pode precisar de espaço para reagir e de liberdade para seguir em frente.",
  },
  "sign:moon:taurus": {
    text: "A Lua em Touro costuma ser ligada à necessidade de estabilidade e conforto: rotinas, o contato com o corpo e a natureza podem trazer segurança emocional.",
  },
  "sign:moon:gemini": {
    text: "A Lua em Gêmeos é associada a sentir conversando: nomear o que sente e trocar ideias pode ser a sua forma de digerir as emoções.",
  },
  "sign:moon:cancer": {
    text: "A Lua em Câncer, na tradição, intensifica a necessidade de acolhimento: lar, memória e vínculos próximos podem ser o seu porto seguro.",
  },
  "sign:moon:leo": {
    text: "A Lua em Leão é associada à necessidade de reconhecimento afetivo: receber atenção e poder expressar alegria pode nutrir você emocionalmente.",
  },
  "sign:moon:virgo": {
    text: "A Lua em Virgem é tradicionalmente ligada a cuidar organizando: ser útil e manter as coisas em ordem pode ser um modo de você se acalmar.",
  },
  "sign:moon:libra": {
    text: "A Lua em Libra é associada à necessidade de harmonia: ambientes equilibrados e relações justas podem ser essenciais para o seu bem-estar.",
  },
  "sign:moon:scorpio": {
    text: "A Lua em Escorpião costuma ser ligada a emoções intensas e reservadas: confiança profunda pode ser a condição para você se abrir.",
  },
  "sign:moon:sagittarius": {
    text: "A Lua em Sagitário, na tradição, busca sentido e movimento: otimismo, aventura e espaço para explorar podem renovar o seu ânimo.",
  },
  "sign:moon:capricorn": {
    text: "A Lua em Capricórnio é associada a uma emocionalidade contida e responsável: você pode encontrar segurança em estrutura, metas e autonomia.",
  },
  "sign:moon:aquarius": {
    text: "A Lua em Aquário é tradicionalmente ligada à necessidade de liberdade emocional: amizade, ideias e um certo distanciamento podem ajudar você a se sentir à vontade.",
  },
  "sign:moon:pisces": {
    text: "A Lua em Peixes é associada a grande permeabilidade emocional: arte, silêncio e compaixão podem ser formas de você cuidar do que sente.",
  },

  // ── Ascendente nos signos ─────────────────────────────────────────────
  "sign:asc:aries": {
    text: "Com o Ascendente em Áries, a tradição descreve uma chegada direta ao mundo: você pode iniciar as coisas com energia e se mostrar sem rodeios.",
  },
  "sign:asc:taurus": {
    text: "Com o Ascendente em Touro, a aproximação ao mundo é tradicionalmente calma e constante: você pode transmitir presença e confiabilidade.",
  },
  "sign:asc:gemini": {
    text: "Com o Ascendente em Gêmeos, a tradição associa uma abordagem curiosa e comunicativa: perguntar e conectar pode ser o seu primeiro gesto.",
  },
  "sign:asc:cancer": {
    text: "Com o Ascendente em Câncer, a aproximação ao mundo é associada à sensibilidade: você pode observar o clima antes de se expor e acolher quem chega.",
  },
  "sign:asc:leo": {
    text: "Com o Ascendente em Leão, a tradição descreve uma presença calorosa e expressiva: você pode iluminar ambientes e deixar marca pela sua expressão.",
  },
  "sign:asc:virgo": {
    text: "Com o Ascendente em Virgem, a aproximação ao mundo é tradicionalmente analítica e cuidadosa: você pode perceber detalhes e oferecer ajuda prática.",
  },
  "sign:asc:libra": {
    text: "Com o Ascendente em Libra, a tradição associa uma abordagem gentil e diplomática: você pode buscar harmonia e cuidar da forma como as coisas acontecem.",
  },
  "sign:asc:scorpio": {
    text: "Com o Ascendente em Escorpião, a aproximação ao mundo é associada à intensidade e à reserva: você pode observar muito antes de se revelar.",
  },
  "sign:asc:sagittarius": {
    text: "Com o Ascendente em Sagitário, a tradição descreve uma chegada entusiasmada e aberta: você pode transmitir otimismo e vontade de explorar.",
  },
  "sign:asc:capricorn": {
    text: "Com o Ascendente em Capricórnio, a aproximação é tradicionalmente sóbria e responsável: você pode passar seriedade e construir confiança com o tempo.",
  },
  "sign:asc:aquarius": {
    text: "Com o Ascendente em Aquário, a tradição associa uma apresentação original e independente: você pode chamar atenção pelo jeito próprio de ver as coisas.",
  },
  "sign:asc:pisces": {
    text: "Com o Ascendente em Peixes, a aproximação ao mundo é associada à sensibilidade e à fluidez: você pode se adaptar aos ambientes e captar sutilezas.",
  },

  // ── Mercúrio nos signos ───────────────────────────────────────────────
  "sign:mercury:aries": {
    text: "Mercúrio em Áries é associado a um pensamento rápido e direto: você pode decidir depressa e dizer o que pensa sem muitos rodeios.",
  },
  "sign:mercury:taurus": {
    text: "Mercúrio em Touro é tradicionalmente ligado a um raciocínio prático e constante: você pode preferir ideias testadas e aprender no seu próprio ritmo.",
  },
  "sign:mercury:gemini": {
    text: "Mercúrio em Gêmeos, seu signo de domicílio, é associado a uma mente ágil e versátil: conectar assuntos e conversar pode ser natural para você.",
  },
  "sign:mercury:cancer": {
    text: "Mercúrio em Câncer é associado a um pensamento guiado pela memória e pelo afeto: você pode lembrar bem do que tocou suas emoções.",
  },
  "sign:mercury:leo": {
    text: "Mercúrio em Leão é tradicionalmente ligado a uma comunicação expressiva: você pode se comunicar com convicção e gosto por contar histórias.",
  },
  "sign:mercury:virgo": {
    text: "Mercúrio em Virgem, também domicílio, é associado à análise e à precisão: organizar informações e aperfeiçoar ideias pode ser um ponto forte.",
  },
  "sign:mercury:libra": {
    text: "Mercúrio em Libra é associado a pensar considerando os dois lados: você pode buscar argumentos equilibrados e conversas cordiais.",
  },
  "sign:mercury:scorpio": {
    text: "Mercúrio em Escorpião é tradicionalmente ligado a uma mente investigativa: você pode preferir ir ao fundo das questões e perceber o que está oculto.",
  },
  "sign:mercury:sagittarius": {
    text: "Mercúrio em Sagitário é associado ao pensamento amplo: você pode se interessar mais pelo sentido geral do que pelos detalhes.",
  },
  "sign:mercury:capricorn": {
    text: "Mercúrio em Capricórnio é associado a um raciocínio estratégico e objetivo: você pode valorizar ideias que levem a resultados concretos.",
  },
  "sign:mercury:aquarius": {
    text: "Mercúrio em Aquário é tradicionalmente ligado a ideias originais: você pode pensar de forma pouco convencional e gostar de questionar regras.",
  },
  "sign:mercury:pisces": {
    text: "Mercúrio em Peixes é associado a um pensamento intuitivo e imagético: você pode compreender por associações e sentir antes de explicar.",
  },

  // ── Vênus nos signos ──────────────────────────────────────────────────
  "sign:venus:aries": {
    text: "Vênus em Áries é associada a um afeto espontâneo e entusiasmado: você pode se encantar com a conquista e com relações que tenham vitalidade.",
  },
  "sign:venus:taurus": {
    text: "Vênus em Touro, seu domicílio, é ligada ao afeto sensorial e leal: estabilidade, presença e pequenos prazeres podem expressar o seu carinho.",
  },
  "sign:venus:gemini": {
    text: "Vênus em Gêmeos é associada a vínculos que passam pela conversa: leveza, humor e troca de ideias podem ser essenciais para você se encantar.",
  },
  "sign:venus:cancer": {
    text: "Vênus em Câncer é tradicionalmente ligada ao afeto protetor: você pode demonstrar amor cuidando e buscar relações que tragam sensação de lar.",
  },
  "sign:venus:leo": {
    text: "Vênus em Leão é associada a um afeto caloroso e generoso: você pode gostar de celebrar quem ama e de receber admiração.",
  },
  "sign:venus:virgo": {
    text: "Vênus em Virgem é associada ao amor demonstrado em atos concretos: atenção aos detalhes e ajuda prática podem ser sua linguagem afetiva.",
  },
  "sign:venus:libra": {
    text: "Vênus em Libra, também domicílio, é tradicionalmente ligada à harmonia e à reciprocidade: equilíbrio e gentileza podem ser centrais nos seus vínculos.",
  },
  "sign:venus:scorpio": {
    text: "Vênus em Escorpião é associada a vínculos intensos e profundos: você pode preferir poucas relações, mas com entrega e verdade.",
  },
  "sign:venus:sagittarius": {
    text: "Vênus em Sagitário é associada ao afeto livre e aventureiro: compartilhar descobertas e manter espaço pessoal pode ser importante para você.",
  },
  "sign:venus:capricorn": {
    text: "Vênus em Capricórnio é tradicionalmente ligada ao afeto que se prova com o tempo: compromisso e confiabilidade podem pesar nas suas escolhas.",
  },
  "sign:venus:aquarius": {
    text: "Vênus em Aquário é associada a vínculos com amizade e liberdade: você pode valorizar parcerias que respeitem a individualidade.",
  },
  "sign:venus:pisces": {
    text: "Vênus em Peixes, sua exaltação, é associada a um afeto romântico e compassivo: você pode se entregar com empatia e idealizar o encontro.",
  },

  // ── Corpos nas casas (amostra do mapa de referência) ─────────────────
  "house:sun:8": {
    text: "O Sol na casa 8 é tradicionalmente associado a buscar identidade nas experiências de profundidade: crises, intimidade e transformações podem ser momentos de autodescoberta.",
  },
  "house:moon:3": {
    text: "A Lua na casa 3 é associada a emoções que circulam pela comunicação: conversas, escrita e o convívio com o entorno próximo podem acalmar você.",
  },
  "house:mercury:8": {
    text: "Mercúrio na casa 8 é tradicionalmente ligado a uma mente que investiga: temas profundos, psicologia e o que está por trás das aparências podem atrair a sua atenção.",
  },
  "house:venus:7": {
    text: "Vênus na casa 7 é associada à importância das parcerias: o encontro com o outro pode ser um campo central de aprendizado e prazer.",
  },
  "house:mars:6": {
    text: "Marte na casa 6 é associado a direcionar energia para a rotina e o trabalho: você pode se sentir bem quando age com propósito no dia a dia.",
  },
  "house:jupiter:10": {
    text: "Júpiter na casa 10 é tradicionalmente ligado à expansão pela vocação: a vida profissional pode ser um campo de crescimento e de sentido.",
  },
  "house:saturn:5": {
    text: "Saturno na casa 5 é associado a levar a sério a autoexpressão: a criatividade pode amadurecer com disciplina e ganhar consistência com o tempo.",
  },

  // ── Aspectos entre pares (amostra) ────────────────────────────────────
  "aspect:moon-sun:conjunction": {
    text: "Sol e Lua juntos, na tradição, sugerem afinidade entre vontade e necessidade emocional: o que você quer e o que te nutre tendem a caminhar na mesma direção.",
  },
  "aspect:moon-sun:harmonious": {
    text: "Sol e Lua em aspecto harmonioso são associados a uma boa conversa interna entre vontade e emoção, o que pode facilitar decisões coerentes com o que você sente.",
  },
  "aspect:moon-sun:tense": {
    text: "Sol e Lua em aspecto tenso sugerem, na tradição, um diálogo exigente entre o que você quer e o que precisa: integrar os dois pode ser um aprendizado central.",
  },
  "aspect:saturn-sun:harmonious": {
    text: "Sol em aspecto harmonioso com Saturno é associado à capacidade de dar forma às metas: disciplina e paciência podem trabalhar a favor da sua expressão.",
  },
  "aspect:saturn-sun:tense": {
    text: "Sol em aspecto tenso com Saturno é tradicionalmente ligado a cobranças internas: a autoconfiança pode crescer à medida que você constrói, passo a passo, o próprio caminho.",
  },
  "aspect:jupiter-mercury:harmonious": {
    text: "Mercúrio em aspecto harmonioso com Júpiter é associado a uma mente que gosta de ampliar horizontes: aprender e ensinar podem ser atividades naturais para você.",
  },
  "aspect:jupiter-venus:tense": {
    text: "Vênus em aspecto tenso com Júpiter é associada a grandes expectativas afetivas: o desafio pode ser equilibrar generosidade e medida nos vínculos.",
  },
  "aspect:uranus-venus:tense": {
    text: "Vênus em aspecto tenso com Urano é tradicionalmente ligada à tensão entre proximidade e liberdade: relações que acolham a sua independência podem ser mais sustentáveis.",
  },
  "aspect:mars-moon:tense": {
    text: "Lua em aspecto tenso com Marte é associada a reações emocionais intensas: reconhecer a irritação cedo pode ajudar você a transformá-la em ação construtiva.",
  },
  "aspect:pluto-sun:tense": {
    text: "Sol em aspecto tenso com Plutão é associado, na tradição, a experiências de poder e transformação: crises podem se tornar oportunidades de renovação pessoal.",
  },
  "aspect:mars-sun:harmonious": {
    text: "Sol em aspecto harmonioso com Marte é associado a vontade e ação bem articuladas: você pode transformar intenção em iniciativa com relativa facilidade.",
  },
  "aspect:mars-venus:harmonious": {
    text: "Vênus em aspecto harmonioso com Marte é associada à integração entre afeto e desejo: o que você deseja e o que valoriza podem caminhar juntos.",
  },
  "aspect:mars-venus:tense": {
    text: "Vênus em aspecto tenso com Marte é tradicionalmente ligada à tensão entre ternura e impulso: a atração pode vir acompanhada de fricção criativa.",
  },
  // Lua com Saturno, Netuno e Urano (02F.2): sem texto autoral, os três
  // eram compostos com a mesma frase ("sugere que as emoções e a…") e o
  // capítulo de talentos de um mapa sem horário era reprovado por repetição.
  // Mesmo significado do texto composto, com aberturas diferentes.
  "aspect:moon-saturn:harmonious": {
    text: "Na relação harmoniosa entre a Lua e Saturno, a tradição vê emoções que encontram estrutura: constância e maturidade afetiva podem se tornar recursos que você exerce com naturalidade.",
  },
  "aspect:moon-neptune:tense": {
    text: "Lua em aspecto tenso com Netuno é tradicionalmente ligada à tensão entre sensibilidade e imaginação: distinguir o que você sente do que idealiza pode ajudar a integrar essas duas forças.",
  },
  "aspect:moon-uranus:tense": {
    text: "A tradição associa a tensão entre a Lua e Urano ao choque entre a necessidade de segurança emocional e o desejo de liberdade: dar espaço às mudanças sem perder o próprio centro pode trazer equilíbrio.",
  },

  // ── Retrogradação ─────────────────────────────────────────────────────
  "retro:mercury": {
    text: "Mercúrio retrógrado no nascimento é associado, na tradição, a um pensamento que revisa e reelabora: você pode preferir refletir antes de falar e voltar às ideias para aprofundá-las.",
  },
  "retro:venus": {
    text: "Vênus retrógrada no nascimento é tradicionalmente ligada a uma forma muito pessoal de valorizar e amar: os vínculos podem passar por revisões importantes ao longo da vida.",
  },
  "retro:mars": {
    text: "Marte retrógrado no nascimento é associado a uma energia que se volta para dentro: a ação pode ganhar força quando é amadurecida antes de ser expressa.",
  },
  "retro:jupiter": {
    text: "Júpiter retrógrado é associado a uma busca de sentido mais interior: crescimento e fé podem nascer de reflexões pessoais antes de se expressarem no mundo.",
  },
  "retro:saturn": {
    text: "Saturno retrógrado é tradicionalmente ligado a uma relação muito pessoal com regras e limites: a autoridade interna pode se construir aos poucos.",
  },
  "retro:outer": {
    text: "Urano, Netuno e Plutão passam boa parte do ano retrógrados; por isso, a tradição dá a essa condição pouco peso individual.",
  },

  // ── Ênfase e ausência de elementos ────────────────────────────────────
  "element-dominant:fire": {
    text: "Muitos corpos em signos de Fogo sugerem, na tradição, entusiasmo e iniciativa como tônica: o desafio pode ser sustentar o ritmo e escutar o próprio cansaço.",
    tags: ["ritmo:impulso", "expressao:expansiva"],
  },
  "element-dominant:earth": {
    text: "Muitos corpos em signos de Terra são associados a senso prático e constância: construir com as próprias mãos pode trazer satisfação.",
    tags: ["ritmo:cautela", "foco:estabilidade"],
  },
  "element-dominant:air": {
    text: "Muitos corpos em signos de Ar sugerem ênfase nas ideias e nas trocas: pensar, conversar e conectar pessoas pode energizar você.",
    tags: ["foco:mudanca"],
  },
  "element-dominant:water": {
    text: "Muitos corpos em signos de Água são associados a sensibilidade e vida emocional rica: intuição e empatia podem guiar escolhas importantes.",
    tags: ["vinculo:proximidade"],
  },
  "element-absent:fire": {
    text: "A ausência de corpos em signos de Fogo é lida, na tradição, como um convite a cultivar o entusiasmo e a coragem de começar.",
  },
  "element-absent:earth": {
    text: "A ausência de corpos em signos de Terra é lida como um convite a cuidar do concreto: rotina, corpo e recursos podem pedir atenção consciente.",
  },
  "element-absent:air": {
    text: "A ausência de corpos em signos de Ar é lida como um convite a dar palavras ao que sente e a buscar outras perspectivas.",
  },
  "element-absent:water": {
    text: "A ausência de corpos em signos de Água é lida, na tradição, como um convite a reconhecer e acolher as emoções, inclusive as mais sutis.",
  },
};
