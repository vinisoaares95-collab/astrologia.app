// Compara as transições de fuso entre duas versões da tzdb (via ICU).
//
// Uso:
//   node scripts/tz/compare-tzdb.mjs <A> <B> [--all]
//   A/B: "runtime" (base embutida no Node) ou um diretório com arquivos .res
//   --all: todos os fusos da base de localidades (padrão: fusos brasileiros)
//
// Cada lado roda num processo separado, pois o ICU lê ICU_TIMEZONE_FILES_DIR
// uma única vez por processo.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FROM = Date.UTC(1900, 0, 1);
const TO = Date.UTC(2031, 0, 1);
const DAY = 86_400_000;

function offsetAt(fmt, ms) {
  const p = {};
  for (const x of fmt.formatToParts(new Date(ms))) p[x.type] = x.value;
  const year = p.era === "BC" ? 1 - Number(p.year) : Number(p.year);
  return (
    (Date.UTC(year, p.month - 1, p.day, p.hour, p.minute, p.second) - ms) / 1000
  );
}

function transitions(zone) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hourCycle: "h23",
    era: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
  const out = [];
  let t = FROM;
  let off = offsetAt(fmt, t);
  while (t < TO) {
    const next = Math.min(t + 2 * DAY, TO);
    const nOff = offsetAt(fmt, next);
    if (nOff !== off) {
      let lo = t,
        hi = next;
      while (hi - lo > 1000) {
        const mid = Math.floor((lo + hi) / 2000) * 1000;
        if (offsetAt(fmt, mid) === off) lo = mid;
        else hi = mid;
      }
      out.push(`${new Date(hi).toISOString().slice(0, 19)}Z ${off}→${nOff}`);
    }
    t = next;
    off = nOff;
  }
  return out;
}

if (process.argv[2] === "--child") {
  const zones = JSON.parse(process.argv[3]);
  const result = { version: process.versions.tz, zones: {} };
  for (const z of zones) result.zones[z] = transitions(z);
  // Sem process.exit(): em pipes, a escrita é assíncrona e seria truncada.
  process.stdout.write(JSON.stringify(result));
} else {
  main();
}

function main() {
  const [a, b] = process.argv.slice(2).filter((x) => !x.startsWith("--"));
  if (!a || !b) {
    console.error(
      "Uso: node scripts/tz/compare-tzdb.mjs <runtime|dir> <runtime|dir> [--all]",
    );
    process.exit(2);
  }
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
  const places = [
    ...JSON.parse(
      readFileSync(
        path.join(root, "src/features/places/data/places-br.json"),
        "utf8",
      ),
    ),
    ...(process.argv.includes("--all")
      ? JSON.parse(
          readFileSync(
            path.join(root, "src/features/places/data/places-world.json"),
            "utf8",
          ),
        )
      : []),
  ];
  const zones = [...new Set(places.map((p) => p.tz).filter(Boolean))].sort();

  function run(side) {
    const env = { ...process.env };
    if (side === "runtime") delete env.ICU_TIMEZONE_FILES_DIR;
    else env.ICU_TIMEZONE_FILES_DIR = path.resolve(side);
    const r = spawnSync(
      process.execPath,
      [fileURLToPath(import.meta.url), "--child", JSON.stringify(zones)],
      {
        env,
        encoding: "utf8",
        maxBuffer: 256 * 1024 * 1024,
      },
    );
    if (r.status !== 0) throw new Error(r.stderr);
    return JSON.parse(r.stdout);
  }

  const A = run(a);
  const B = run(b);
  console.log(
    `Comparando tzdb ${A.version} (${a}) → ${B.version} (${b}) em ${zones.length} fusos, 1900–2030\n`,
  );
  let changed = 0;
  for (const z of zones) {
    const sa = new Set(A.zones[z]);
    const sb = new Set(B.zones[z]);
    const removed = A.zones[z].filter((x) => !sb.has(x));
    const added = B.zones[z].filter((x) => !sa.has(x));
    if (!removed.length && !added.length) continue;
    changed++;
    console.log(z);
    for (const x of removed) console.log(`  − ${x}`);
    for (const x of added) console.log(`  + ${x}`);
  }
  console.log(`\n${changed} fuso(s) com diferenças.`);
}
