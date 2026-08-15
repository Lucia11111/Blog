#!/usr/bin/env node
/**
 * Založí novú recenziu.
 *
 *   npm run nova -- "Malý princ"
 *   npm run nova -- "The Little Prince" --en
 *
 * Vytvorí priečinok s rozpísaným súborom index.md a povie ti, čo ďalej.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KOREN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const en = argv.includes("--en");
const nazov = argv.filter((a) => !a.startsWith("--")).join(" ").trim();

if (!nazov) {
  console.error('\nPoužitie:  npm run nova -- "Názov knihy"\n' + '           npm run nova -- "Title" --en\n');
  process.exit(1);
}

/** "Malý princ" → "maly-princ" */
function naSlug(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const slug = naSlug(nazov);
const sekcia = en ? "en/books" : "sk/knihy";
const relCesta = path.join("content", sekcia, slug, "index.md");

if (existsSync(path.join(KOREN, relCesta))) {
  console.error(`\n✗ ${relCesta} už existuje.\n`);
  process.exit(1);
}

execFileSync("hugo", ["new", "content", relCesta, "--kind", "knihy"], {
  cwd: KOREN,
  stdio: ["ignore", "ignore", "inherit"],
});

const priecinok = path.dirname(relCesta);

console.log(`
✓ Založené:  ${relCesta}

Ďalej:
  1. Otvor ${relCesta} a vyplň hlavičku — hlavne autora,
     štyri hodnoty kompasu, podtitul, citáty a záver.
  2. Fotku obálky ulož ako obalka.jpg do ${priecinok}/
     (stačí fotka z mobilu, na výšku, kniha na jednofarebnom podklade).
  3. Napíš samotnú recenziu pod hlavičku.
  4. Pozri si to naživo:      npm start
  5. Sprav podklady na IG:    npm run ig -- ${slug}
  6. Keď je hotovo, zmeň v hlavičke  draft: true  na  draft: false
     a nahraj to na web:      git add -A && git commit -m "${nazov}" && git push
`);
