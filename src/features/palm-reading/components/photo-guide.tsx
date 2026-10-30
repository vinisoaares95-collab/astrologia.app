import { Check, X } from "lucide-react";

const tips = [
  {
    title: "Luz natural e uniforme",
    text: "Perto de uma janela, sem flash e sem sombras fortes sobre a palma.",
  },
  {
    title: "Palma aberta e relaxada",
    text: "Dedos levemente afastados, mão esticada sem forçar.",
  },
  {
    title: "Enquadre a mão inteira",
    text: "Do pulso à ponta dos dedos, com a palma ocupando a maior parte da foto.",
  },
  {
    title: "Câmera paralela à mão",
    text: "Fotografe de frente, a cerca de 25 cm, e confira se ficou nítido.",
  },
];

const avoid = [
  "Anéis, relógios ou pulseiras cobrindo a palma",
  "Fundos com estampas ou muito parecidos com o tom da pele",
  "Fotos tremidas, cortadas ou muito inclinadas",
];

export function PhotoGuide() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div className="space-y-4">
        <h2 className="text-xl text-fg">Para uma boa foto</h2>
        <ol className="space-y-4">
          {tips.map((tip, index) => (
            <li key={tip.title} className="flex gap-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-accent/40 text-xs text-accent tabular-nums">
                {index + 1}
              </span>
              <div className="space-y-1">
                <p className="font-medium text-fg">{tip.title}</p>
                <p className="text-sm leading-relaxed text-fg-muted">
                  {tip.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl text-fg">Evite</h2>
        <ul className="space-y-3">
          {avoid.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-fg-muted">
              <X aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
              {item}
            </li>
          ))}
        </ul>
        <p className="flex gap-3 pt-2 text-sm text-fg-muted">
          <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
          Na tradição da quiromancia, costuma-se ler primeiro a mão dominante —
          aquela com que você escreve.
        </p>
      </div>
    </div>
  );
}
