import { Focus, Hand, Scan, Sun, X } from "lucide-react";

const tips = [
  {
    icon: Sun,
    title: "Luz natural",
    text: "Perto da janela, sem flash nem sombras fortes.",
  },
  {
    icon: Hand,
    title: "Palma aberta",
    text: "Dedos levemente afastados, sem forçar.",
  },
  {
    icon: Scan,
    title: "Mão inteira",
    text: "Do pulso à ponta dos dedos, ocupando a foto.",
  },
  {
    icon: Focus,
    title: "De frente",
    text: "Câmera paralela, a ~25 cm. Confira a nitidez.",
  },
];

const avoid = [
  "Anéis e relógios",
  "Fundo estampado",
  "Foto tremida ou cortada",
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
        Na tradição da quiromancia, costuma-se ler primeiro a mão dominante —
        aquela com que você escreve.
      </p>
    </div>
  );
}
