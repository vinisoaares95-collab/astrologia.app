// Executa um comando com a base de fusos fixada (tzdata/<versão>).
// Uso: node scripts/with-tzdata.mjs <comando> [args...]
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

// Mantido em sincronia com TZDB_EXPECTED_VERSION (src/features/birth-time/tzdb.ts).
const VERSION = "2026f";
// O ICU exige caminho ABSOLUTO (guia do ICU, "Time Zone Data"). Um caminho
// relativo depende do diretório de execução e cai em silêncio na base
// embutida do Node — por isso qualquer valor recebido é convertido.
const dir = path.resolve(
  process.env.ICU_TIMEZONE_FILES_DIR ?? path.join("tzdata", VERSION),
);

if (!existsSync(path.join(dir, "zoneinfo64.res"))) {
  console.error(`Base de fusos ausente em ${dir}.`);
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);
const child = spawn(command, args, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    ICU_TIMEZONE_FILES_DIR: dir,
  },
});
child.on("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 1)));
