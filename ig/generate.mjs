#!/usr/bin/env node
/**
 * BookSpaceB612 — generátor Instagram carouselov.
 *
 *   npm run ig                      → všetky recenzie (aj rozpísané, draft)
 *   npm run ig -- desate-proroctvi  → len jedna kniha
 *   npm run ig -- --hotove          → len tie, čo už nie sú draft
 *
 * Ako to funguje:
 *   1. spustí `hugo`, ktorý ku každej recenzii vygeneruje slides.html a caption.txt
 *   2. každý slide odfotí v prehliadači ako PNG 1080×1350
 *   3. výsledok uloží do  ig/out/<kniha>/  spolu s textom popisu
 *
 * Žiadne npm balíčky nie sú potrebné — používa prehliadač, ktorý už máš v systéme.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, copyFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KOREN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(KOREN, "public");
const VYSTUP = path.join(KOREN, "ig", "out");

const argv = process.argv.slice(2);
const prepinace = new Set(argv.filter((a) => a.startsWith("--")));
const filtre = argv.filter((a) => !a.startsWith("--"));
const lenHotove = prepinace.has("--hotove");
const bezBuildu = prepinace.has("--bez-buildu");

/* ── nájdi prehliadač ─────────────────────────────────────────────── */

function najdiPrehliadac() {
  const kandidati = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  ];

  // Chromium, ktorý si so sebou nosí Playwright / Claude Code
  const cache = path.join(homedir(), "Library/Caches/ms-playwright");
  if (existsSync(cache)) {
    for (const d of readdirSync(cache).sort().reverse()) {
      for (const rel of [
        "chrome-headless-shell-mac-arm64/chrome-headless-shell",
        "chrome-headless-shell-mac-x64/chrome-headless-shell",
        "chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium",
        "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
      ]) {
        kandidati.push(path.join(cache, d, rel));
      }
    }
  }

  const najdeny = kandidati.find((p) => existsSync(p));
  if (!najdeny) {
    console.error(
      "\n✗ Nenašla som prehliadač, ktorým by som slidy odfotila.\n" +
        "  Nainštaluj Google Chrome (https://google.com/chrome) a spusti to znova.\n"
    );
    process.exit(1);
  }
  return najdeny;
}

/* ── zbieranie recenzií ───────────────────────────────────────────── */

function najdiSlidy(dir, najdene = []) {
  for (const polozka of readdirSync(dir, { withFileTypes: true })) {
    const plna = path.join(dir, polozka.name);
    if (polozka.isDirectory()) najdiSlidy(plna, najdene);
    else if (polozka.name === "slides.html" && statSync(plna).size > 200) najdene.push(plna);
  }
  return najdene;
}

function pocetSlidov(html) {
  // hugo môže HTML minifikovať, takže id vyzerá raz ako id="s3" a raz ako id=s3
  return new Set([...html.matchAll(/id="?s(\d+)\b/g)].map((m) => Number(m[1]))).size;
}

/* ── hlavný beh ───────────────────────────────────────────────────── */

if (!bezBuildu) {
  console.log("→ generujem web (hugo)…");
  execFileSync("hugo", lenHotove ? ["--gc"] : ["--gc", "--buildDrafts"], {
    cwd: KOREN,
    stdio: ["ignore", "ignore", "inherit"],
  });
}

if (!existsSync(PUBLIC)) {
  console.error("✗ Priečinok public/ neexistuje — spusti najprv `hugo`.");
  process.exit(1);
}

const prehliadac = najdiPrehliadac();
let vsetky = najdiSlidy(PUBLIC);

if (filtre.length) {
  vsetky = vsetky.filter((p) => filtre.some((f) => p.includes(f)));
}

if (!vsetky.length) {
  console.log("Nenašla som žiadnu recenziu s vyplneným `kompas:` vo front matteri.");
  process.exit(0);
}

mkdirSync(VYSTUP, { recursive: true });

for (const slidySubor of vsetky) {
  const priecinok = path.dirname(slidySubor);
  const slug = path.basename(priecinok);
  const jazyk = path.relative(PUBLIC, priecinok).startsWith("en/") ? "en" : "sk";
  const cielovy = path.join(VYSTUP, jazyk === "en" ? `${slug}-en` : slug);

  const html = readFileSync(slidySubor, "utf8");
  const pocet = pocetSlidov(html);
  if (!pocet) continue;

  rmSync(cielovy, { recursive: true, force: true });
  mkdirSync(cielovy, { recursive: true });

  process.stdout.write(`→ ${slug} (${pocet} obrázkov) `);

  for (let i = 1; i <= pocet; i++) {
    const cesta = path.join(cielovy, `${String(i).padStart(2, "0")}.png`);
    execFileSync(
      prehliadac,
      [
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--allow-file-access-from-files",
        "--virtual-time-budget=4000",
        "--window-size=1080,1350",
        `--screenshot=${cesta}`,
        `file://${slidySubor}#s${i}`,
      ],
      { stdio: ["ignore", "ignore", "ignore"] }
    );
    process.stdout.write("·");
  }

  const popis = path.join(priecinok, "caption.txt");
  if (existsSync(popis)) copyFileSync(popis, path.join(cielovy, "popis.txt"));

  console.log(` ✓  ${path.relative(KOREN, cielovy)}`);
}

console.log(
  `\nHotovo. Obrázky nájdeš v ig/out/ — otvor priečinok, označ všetky PNG a nahraj\n` +
    `ich do Instagramu v poradí 01, 02, 03… Text popisu je v popis.txt.\n`
);
