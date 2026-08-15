#!/usr/bin/env node
/**
 * BookSpaceB612 — úprava fotiek kníh.
 *
 * Z fotky z mobilu spraví čistý výrez: oreže okraje (stôl, tieň, prsty),
 * vyrovná náklon a upraví jas a farby tak, aby papier vyzeral ako papier.
 *
 *   node ig/foto.mjs --in fotka.jpeg --out obalka.jpg \
 *        --crop 13.5,5.5,75.5,89.5 --rotate 1.5 --preset obalka
 *
 * Parametre:
 *   --in       zdrojová fotka
 *   --out      kam uložiť (.jpg)
 *   --crop     x,y,šírka,výška — v percentách zdrojovej fotky.
 *              x,y je ľavý horný roh výrezu. Napr. 13.5,5.5,75.5,89.5
 *   --rotate   vyrovnanie náklonu v stupňoch (kladné = doprava). Nepovinné.
 *   --width    šírka výsledku v pixeloch (default 1200)
 *   --preset   obalka | stranka | ziadny   (default obalka)
 *                obalka  — jemné dofarbenie, obálka ostane verná
 *                stranka — presvetlí papier a stlmí žltnutie, text vystúpi
 *   --filter   vlastné CSS filtre namiesto presetu, napr. "contrast(1.2)"
 *
 * Tip ako si zmerať výrez: spusti `node ig/foto.mjs --in fotka.jpeg --mriezka`
 * a nad fotku sa vykreslí percentuálna mriežka do súboru mriezka.png.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";

/* ── argumenty ────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
function arg(meno, def = null) {
  const i = argv.indexOf(`--${meno}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : def;
}
const maFlag = (meno) => argv.includes(`--${meno}`);

const vstup = arg("in");
if (!vstup || !existsSync(vstup)) {
  console.error("\n✗ Chýba --in <fotka>. Návod nájdeš v komentári na začiatku ig/foto.mjs\n");
  process.exit(1);
}

const PRESETY = {
  obalka: "brightness(1.03) contrast(1.07) saturate(1.06)",
  stranka: "brightness(1.15) contrast(1.17) saturate(0.62) sepia(0.07)",
  ziadny: "none",
};

const vystup = arg("out");
const rotate = parseFloat(arg("rotate", "0"));
const sirka = parseInt(arg("width", "1200"), 10);
const preset = arg("preset", "obalka");
const filter = arg("filter") || PRESETY[preset] || PRESETY.obalka;

/* ── prehliadač ───────────────────────────────────────────────────── */

function najdiPrehliadac() {
  const kandidati = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  const cache = path.join(homedir(), "Library/Caches/ms-playwright");
  if (existsSync(cache)) {
    for (const d of readdirSync(cache).sort().reverse()) {
      for (const rel of [
        "chrome-headless-shell-mac-arm64/chrome-headless-shell",
        "chrome-headless-shell-mac-x64/chrome-headless-shell",
        "chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium",
      ]) {
        kandidati.push(path.join(cache, d, rel));
      }
    }
  }
  const n = kandidati.find((p) => existsSync(p));
  if (!n) {
    console.error("\n✗ Nenašla som prehliadač. Nainštaluj Google Chrome a skús znova.\n");
    process.exit(1);
  }
  return n;
}

const prehliadac = najdiPrehliadac();
const absVstup = path.resolve(vstup);
const url = "file://" + absVstup.split("/").map(encodeURIComponent).join("/");
const docasny = mkdtempSync(path.join(tmpdir(), "b612foto-"));

// Ak je výstupom .png, zachováme priehľadné pozadie — hodí sa pri
// produktových fotkách obálok vystrihnutých z podkladu.
const priehladne = !!vystup && vystup.toLowerCase().endsWith(".png");

function odfot(html, w, h, out) {
  const f = path.join(docasny, "f.html");
  execFileSync("/bin/sh", ["-c", `cat > ${JSON.stringify(f)}`], { input: html });
  execFileSync(
    prehliadac,
    [
      "--headless", "--disable-gpu", "--hide-scrollbars",
      "--force-device-scale-factor=1", "--allow-file-access-from-files",
      "--virtual-time-budget=5000",
      ...(priehladne ? ["--default-background-color=00000000"] : []),
      `--window-size=${Math.round(w)},${Math.round(h)}`,
      `--screenshot=${out}`,
      "file://" + f,
    ],
    { stdio: ["ignore", "ignore", "ignore"] }
  );
}

/* ── režim mriežky: pomôcka na odmeranie výrezu ───────────────────── */

if (maFlag("mriezka")) {
  const W = 600, H = 800;
  const ciary = [];
  for (let p = 10; p < 100; p += 10) {
    const x = (p / 100) * W, y = (p / 100) * H;
    const farba = p === 50 ? "#00e5ff" : "#ff00e5";
    ciary.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${farba}"/>`);
    ciary.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${farba}"/>`);
    ciary.push(`<text x="${x + 3}" y="13" fill="#ff00e5" font-size="12" font-family="monospace">${p}</text>`);
    ciary.push(`<text x="3" y="${y - 3}" fill="#ff00e5" font-size="12" font-family="monospace">${p}</text>`);
  }
  const out = vystup || "mriezka.png";
  odfot(
    `<html><body style="margin:0;position:relative;width:${W}px;height:${H}px">
       <img src="${url}" style="width:${W}px;height:${H}px;object-fit:fill;display:block">
       <svg style="position:absolute;inset:0" width="${W}" height="${H}">
         <g stroke-width="1" opacity="0.8">${ciary.join("")}</g>
       </svg></body></html>`,
    W, H, path.resolve(out)
  );
  rmSync(docasny, { recursive: true, force: true });
  console.log(`✓ ${out} — odčítaj z mriežky x, y, šírku a výšku výrezu v %`);
  process.exit(0);
}

/* ── samotný výrez ────────────────────────────────────────────────── */

if (!vystup) {
  console.error("\n✗ Chýba --out <súbor.jpg>\n");
  process.exit(1);
}

const [cx, cy, cw, ch] = (arg("crop", "0,0,100,100")).split(",").map(Number);
if ([cx, cy, cw, ch].some(Number.isNaN) || cw <= 0 || ch <= 0) {
  console.error("\n✗ --crop musí byť štyri čísla: x,y,šírka,výška v percentách\n");
  process.exit(1);
}

// Rozmery zdroja. Pozor: sips hlási surové rozmery, ale prehliadač fotku
// natočí podľa EXIF orientácie — pri fotkách z mobilu sa preto strany
// vymieňajú. Orientáciu si preto prečítame priamo z EXIF hlavičky.
function exifOrientacia(subor) {
  const buf = readFileSync(subor);
  if (buf.readUInt16BE(0) !== 0xffd8) return 1; // nie je JPEG
  let i = 2;
  while (i < buf.length - 4) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    const dlzka = buf.readUInt16BE(i + 2);
    if (marker === 0xe1 && buf.toString("ascii", i + 4, i + 10) === "Exif\0\0") {
      const tiff = i + 10;
      const little = buf.toString("ascii", tiff, tiff + 2) === "II";
      const u16 = (o) => (little ? buf.readUInt16LE(o) : buf.readUInt16BE(o));
      const u32 = (o) => (little ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
      const ifd = tiff + u32(tiff + 4);
      const pocet = u16(ifd);
      for (let t = 0; t < pocet; t++) {
        const zaznam = ifd + 2 + t * 12;
        if (u16(zaznam) === 0x0112) return u16(zaznam + 8) || 1;
      }
      return 1;
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) i += 2;
    else i += 2 + dlzka;
  }
  return 1;
}

const info = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", absVstup]).toString();
let zdrojW = Number(info.match(/pixelWidth:\s*(\d+)/)[1]);
let zdrojH = Number(info.match(/pixelHeight:\s*(\d+)/)[1]);
if ([5, 6, 7, 8].includes(exifOrientacia(absVstup))) [zdrojW, zdrojH] = [zdrojH, zdrojW];

const vyskaVysledku = Math.round((sirka * (ch / 100) * zdrojH) / ((cw / 100) * zdrojW));

// pri vyrovnávaní náklonu potrebujeme rezervu, aby sa v rohoch neobjavilo prázdno
const rezerva = rotate === 0 ? 0 : Math.ceil(Math.abs(Math.sin((rotate * Math.PI) / 180)) * Math.max(sirka, vyskaVysledku)) + 4;
const vnutornaW = sirka + 2 * rezerva;
const vnutornaH = vyskaVysledku + 2 * rezerva;

// obrázok posadíme ako pozadie: zväčšíme ho tak, aby výrez vyplnil rám
const mierkaW = vnutornaW / (cw / 100);
const mierkaH = mierkaW * (zdrojH / zdrojW);
const posunX = -(cx / 100) * mierkaW;
const posunY = -(cy / 100) * mierkaH;

odfot(
  `<html><body style="margin:0;overflow:hidden;background:${priehladne ? "transparent" : "#000"};width:${sirka}px;height:${vyskaVysledku}px">
     <div style="position:absolute;left:${-rezerva}px;top:${-rezerva}px;
                 width:${vnutornaW}px;height:${vnutornaH}px;
                 transform:rotate(${rotate}deg);transform-origin:center center;
                 background-image:url('${url}');
                 background-size:${mierkaW}px ${mierkaH}px;
                 background-position:${posunX}px ${posunY}px;
                 background-repeat:no-repeat;
                 filter:${filter}"></div>
   </body></html>`,
  sirka, vyskaVysledku, path.join(docasny, "out.png")
);

if (priehladne) {
  copyFileSync(path.join(docasny, "out.png"), path.resolve(vystup));
} else {
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "88",
    path.join(docasny, "out.png"), "--out", path.resolve(vystup)], { stdio: "ignore" });
}
rmSync(docasny, { recursive: true, force: true });

console.log(`✓ ${vystup}  ${sirka}×${vyskaVysledku}`);
