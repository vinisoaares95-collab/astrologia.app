// Baixa os arquivos de efemérides do Swiss Ephemeris e confere o SHA-256.
// Uso: npm run ephe:fetch   (ou com --if-missing para pular se já existirem)
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const SOURCE =
  "https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/";
// Mantido em sincronia com src/features/astrology/engine/ephemeris-files.ts
const FILES = [
  [
    "sepl_18.se1",
    "ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66",
  ],
  [
    "semo_18.se1",
    "1ca07bd67c24374d77226180c20a4f9996cba013697894810518e7eb582ca4f7",
  ],
];

const dir = process.env.SIDERA_EPHE_PATH ?? path.join(process.cwd(), "ephe");
const ifMissing = process.argv.includes("--if-missing");
mkdirSync(dir, { recursive: true });

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

for (const [name, expected] of FILES) {
  const target = path.join(dir, name);
  if (existsSync(target) && sha256(readFileSync(target)) === expected) {
    if (!ifMissing) console.log(`✓ ${name} já presente e íntegro`);
    continue;
  }
  const res = await fetch(SOURCE + name);
  if (!res.ok) throw new Error(`Falha ao baixar ${name}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const actual = sha256(buf);
  if (actual !== expected) {
    throw new Error(
      `SHA-256 divergente para ${name}: ${actual} (esperado ${expected})`,
    );
  }
  writeFileSync(target, buf);
  console.log(`✓ ${name} baixado (${buf.length} bytes)`);
}
