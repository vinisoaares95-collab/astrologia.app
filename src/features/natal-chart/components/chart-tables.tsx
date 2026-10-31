import type { ChartView } from "../contract";
import {
  ASPECT_NAMES,
  BODY_NAMES,
  POINT_NAMES,
  formatLongitude,
  formatPosition,
} from "../labels";
import { GlyphIcon } from "./glyph";

const th =
  "px-2 py-2 text-left font-mono text-[0.6rem] font-medium tracking-[0.12em] text-fg-subtle uppercase";
const td = "px-2 py-2 align-top";

/** Equivalente textual e acessível da mandala. */
export function ChartTables({ chart }: { chart: ChartView }) {
  return (
    <div className="space-y-6 text-sm">
      <section className="space-y-2" aria-labelledby="tabela-posicoes">
        <h3 id="tabela-posicoes" className="font-semibold text-fg">
          Posições
        </h3>
        <div className="overflow-x-auto rounded-2xl bg-surface/80 edge-light">
          <table className="w-full min-w-[30rem]" data-testid="positions-table">
            <thead>
              <tr className="border-b border-line-soft">
                <th className={th}>Corpo</th>
                <th className={th}>Posição</th>
                <th className={th}>Longitude</th>
                <th className={th}>Casa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft text-fg-muted">
              {chart.bodies.map((b) => (
                <tr key={b.body} data-body-row={b.body}>
                  <td className={td}>
                    <span className="flex items-center gap-2 text-fg">
                      <GlyphIcon name={b.body} />
                      {BODY_NAMES[b.body]}
                      {b.retrograde && (
                        <span className="font-mono text-xs text-danger">R</span>
                      )}
                    </span>
                  </td>
                  <td className={td}>
                    {formatPosition(b)}
                    {b.range && (
                      <span className="block text-xs text-fg-subtle">
                        varia {b.range.width.toFixed(2).replace(".", ",")}°
                        {b.range.crossesSign ? " · muda de signo" : ""}
                      </span>
                    )}
                  </td>
                  <td className={`${td} font-mono text-xs`}>
                    {formatLongitude(b.longitude)}
                  </td>
                  <td className={td}>
                    {b.house ??
                      (b.houseVaries ? b.houseVaries.join(", ") : "—")}
                  </td>
                </tr>
              ))}
              {chart.angles &&
                (["asc", "mc"] as const).map((key) => {
                  const angle = chart.angles![key];
                  return (
                    <tr key={key}>
                      <td className={`${td} text-fg`}>{POINT_NAMES[key]}</td>
                      <td className={td}>
                        {angle.range
                          ? `entre ${formatLongitude(angle.range.start)} e ${formatLongitude(angle.range.end)}`
                          : formatPosition(angle)}
                      </td>
                      <td className={`${td} font-mono text-xs`}>
                        {formatLongitude(angle.longitude)}
                        {angle.range ? " (centro)" : ""}
                      </td>
                      <td className={td}>—</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {chart.houses && (
        <section className="space-y-2" aria-labelledby="tabela-casas">
          <h3 id="tabela-casas" className="font-semibold text-fg">
            Cúspides (Placidus)
          </h3>
          <ol
            className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-2xl bg-surface/80 p-3 text-fg-muted edge-light sm:grid-cols-3"
            data-testid="cusps-list"
          >
            {chart.houses.cusps.map((c, i) => (
              <li key={i}>
                <span className="font-mono text-xs text-fg-subtle">
                  {String(i + 1).padStart(2, "0")}
                </span>{" "}
                {formatPosition(c)}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="space-y-2" aria-labelledby="tabela-aspectos">
        <h3 id="tabela-aspectos" className="font-semibold text-fg">
          Aspectos ({chart.aspects.length})
        </h3>
        <div className="overflow-x-auto rounded-2xl bg-surface/80 edge-light">
          <table className="w-full min-w-[26rem]" data-testid="aspects-table">
            <thead>
              <tr className="border-b border-line-soft">
                <th className={th}>Aspecto</th>
                <th className={th}>Orbe</th>
                <th className={th}>Fase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft text-fg-muted">
              {chart.aspects.map((a) => (
                <tr key={`${a.a}-${a.b}-${a.type}`}>
                  <td className={td}>
                    {POINT_NAMES[a.a]}{" "}
                    <span className="text-accent">
                      {ASPECT_NAMES[a.type].toLowerCase()}
                    </span>{" "}
                    {POINT_NAMES[a.b]}
                    {a.uncertain && (
                      <span className="block text-xs text-fg-subtle">
                        incerto na janela
                      </span>
                    )}
                  </td>
                  <td className={`${td} font-mono text-xs`}>
                    {a.orb.toFixed(2).replace(".", ",")}°
                  </td>
                  <td className={td}>
                    {a.applying === null
                      ? "—"
                      : a.applying
                        ? "aplicativo"
                        : "separativo"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
