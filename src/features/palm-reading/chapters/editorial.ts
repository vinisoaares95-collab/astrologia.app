/**
 * Regras editoriais deterministas dos capítulos 6 e 7 (Fase 03F.2).
 *
 * 1. Gênero presumido: o texto fala com "você" sem saber o gênero da
 *    pessoa. Recusa só a construção em que um adjetivo com gênero
 *    descreve a PESSOA ("você se sente seguro", "você está mais guiada"),
 *    não as palavras em si: "um caminho seguro" ou "a linha inclinada"
 *    continuam livres.
 * 2. Avisos redundantes: o sistema já mostra a ressalva e as limitações;
 *    as orações em que o modelo nega certeza ou identidade (", sem definir
 *    quem você é") são removidas, preservando o resto da frase.
 */
import type { ChapterDraft } from "./contract";

const ADJ = (stems: string) => `(?:${stems})(?:o|a|os|as)`;

/** Adjetivos que, nestes textos, só descrevem pessoas. */
const PERSON_ONLY =
  "guiad|dispost|preparad|acostumad|motivad|animad|decidid|determinad|apegad|tentad|interessad|empolgad|receos|orgulhos|ansios|cansad";
/** Também descrevem coisas ("um caminho seguro"): só com sujeito pessoa. */
const ALSO_THINGS = `${PERSON_ONLY}|segur|tranquil|abert|fechad|cuidados|atent|reservad|sozinh|inclinad|envolvid|focad|orientad|confiant`;
const INTENS = "(?:(?:mais|menos|muito|tão|bem|pouco|bastante)\\s+)?";

const GENDERED: readonly RegExp[] = [
  // Reflexivos de estado: o sujeito é a própria pessoa.
  new RegExp(
    `(?<!\\p{L})(?:se\\s+(?:sente|sentir|sinta|sentia|sentirá|mostra|mostrar|percebe|perceber|considera|considerar|acha|achar)|sentir-se|sente-se|sinta-se)\\s+${INTENS}${ADJ(ALSO_THINGS)}(?!\\p{L})`,
    "iu",
  ),
  // "você (…) é/está/fica + adjetivo" com até 3 palavras entre eles.
  new RegExp(
    `(?<!\\p{L})você(?:\\s+[\\p{L}-]+){0,3}?\\s+(?:é|está|fica|ficar|estiver|esteja|seja|for|fique)\\s+${INTENS}${ADJ(ALSO_THINGS)}(?!\\p{L})`,
    "iu",
  ),
  // Estar/ficar + adjetivo exclusivo de pessoa ("quando está mais guiado").
  new RegExp(
    `(?<!\\p{L})(?:está|estar|esteja|estiver|fica|ficar|fique)\\s+${INTENS}${ADJ(PERSON_ONLY)}(?!\\p{L})`,
    "iu",
  ),
];

export function presumedGender(text: string): string[] {
  return GENDERED.map((re) => text.match(re)?.[0]).filter((m): m is string =>
    Boolean(m),
  );
}

/** Oração de aviso sobre certeza ou identidade, presa a uma frase. */
const DISCLAIMER_CLAUSE =
  /\s*(?:[,;]|—)\s*(?:e\s+)?(?:não|sem|nem)(?!\p{L})[^.?!;]*?(?:quem você é|verdades? fixas?|definiç\p{L}* fechad\p{L}*|fatos? comprovados?|retratos? definitivos?(?: de quem você é)?)(?=[.?!;])/giu;
/** Frase que começa pelo aviso e continua ("Nada disso fixa quem você é; …"). */
const DISCLAIMER_LEAD =
  /(^|[.?!]\s+)Nada disso (?:fixa|define|determina) quem você é[;,:]\s*(\p{L})/gu;

export function stripDisclaimerText(text: string): string {
  return text
    .replace(
      DISCLAIMER_LEAD,
      (_, pre: string, c: string) => pre + c.toUpperCase(),
    )
    .replace(DISCLAIMER_CLAUSE, "")
    .replace(/\s{2,}/gu, " ")
    .trim();
}

/**
 * Remove as orações de aviso de introdução, seções e síntese (as perguntas
 * não mudam). Devolve null se nada mudou ou se algum campo ficaria vazio.
 */
export function stripDisclaimers(
  draft: ChapterDraft,
): { draft: ChapterDraft; removed: string[] } | null {
  const removed: string[] = [];
  const strip = (part: string, t: string) => {
    const n = stripDisclaimerText(t);
    if (n !== t) removed.push(`${part}: aviso redundante removido`);
    return n;
  };
  const next: ChapterDraft = {
    ...draft,
    introduction: strip("introduction", draft.introduction),
    sections: draft.sections.map((s, i) => ({
      ...s,
      text: strip(`sections.${i}`, s.text),
    })),
    synthesis: strip("synthesis", draft.synthesis),
  };
  if (!removed.length) return null;
  const blank = (t: string) => !/\p{L}/u.test(t);
  const empty =
    blank(next.introduction) ||
    blank(next.synthesis) ||
    next.sections.some((sec) => blank(sec.text));
  return empty ? null : { draft: next, removed };
}
