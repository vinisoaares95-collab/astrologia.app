import { Hand, Scan, Smartphone, Sun, X } from "lucide-react";

const tips = [
  {
    icon: Scan,
    title: "Mão inteira",
    text: "Do pulso às pontas dos dedos, ocupando a foto.",
  },
  {
    icon: Hand,
    title: "Palma de frente",
    text: "Aberta, com os dedos levemente afastados.",
  },
  {
    icon: Smartphone,
    title: "Celular paralelo",
    text: "Reto sobre a palma, a ~25 cm, sem inclinar.",
  },
  {
    icon: Sun,
    title: "Luz e fundo",
    text: "Luz natural, sem reflexos, sobre um fundo liso. Toque na palma para focar.",
  },
];

/**
 * Privacidade da captura (03G.3): a foto deve mostrar só o necessário para
 * a leitura. Orientação ao usuário; não muda o que o modelo de visão avalia.
 */
export const PHOTO_ONLY_THE_PALM =
  "Só a palma: deixe fora da foto o rosto, outras pessoas, documentos, cartões, telas e outros objetos pessoais.";

const avoid = [
  "Mão ou celular inclinados",
  "Dedos ou pulso cortados",
  "Flash e reflexos",
  "Anéis e relógios",
  "Rosto ou outras pessoas",
  "Documentos e telas",
];

export function PhotoGuide() {
  return (
    <div className="space-y-5">
      <ul className="grid grid-cols-2 gap-3">
        {tips.map((tip) => (
          <li
            key={tip.title}
            className="space-y-2 rounded-2xl bg-surface/80 p-3.5 edge-light"
          >
            <p className="flex items-center gap-2.5 text-sm font-semibold text-fg">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <tip.icon aria-hidden className="size-4" />
              </span>
              {tip.title}
            </p>
            <p className="text-xs leading-relaxed text-fg-muted">{tip.text}</p>
          </li>
        ))}
      </ul>
      <p className="rounded-2xl bg-surface/80 p-3.5 text-xs leading-relaxed text-fg-muted edge-light">
        {PHOTO_ONLY_THE_PALM}
      </p>
      <div className="space-y-2">
        <p className="font-mono text-[0.65rem] tracking-[0.16em] text-fg-subtle uppercase">
          Evite
        </p>
        <ul className="flex flex-wrap gap-2">
          {avoid.map((item) => (
            <li
              key={item}
              className="flex items-center gap-1.5 rounded-full border border-danger/25 bg-danger-soft px-3 py-1.5 text-xs text-fg-muted"
            >
              <X aria-hidden className="size-3 text-danger" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs leading-relaxed text-fg-subtle">
        Fotografe a palma da sua mão dominante, aquela com que você escreve: na
        tradição da quiromancia, é a primeira a ser lida.
      </p>
    </div>
  );
}
