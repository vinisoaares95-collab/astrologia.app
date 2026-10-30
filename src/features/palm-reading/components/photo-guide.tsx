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
        {tips.map((tip, index) => (
          <li
            key={tip.title}
            className="space-y-3 rounded-3xl bg-surface/80 p-4 edge-light"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <tip.icon aria-hidden className="size-4" />
              </span>
              <span className="font-mono text-[0.65rem] text-fg-subtle">
                0{index + 1}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-fg">{tip.title}</p>
              <p className="text-xs leading-relaxed text-fg-muted">
                {tip.text}
              </p>
            </div>
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
