---
# ── Čo sa zobrazí ako nadpis článku ───────────────────────────────
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
draft: true

# ── Údaje o knihe (idú do karty aj do Instagram carouselu) ────────
nazovKnihy: ""          # presný názov knihy, ak sa líši od titulku článku
autor: ""
originalnyNazov: ""
preklad: ""
vydavatel: ""
rok:
strany:
precitane: ""           # napr. "august 2026"
obalka: "obalka.jpg"    # fotka obálky, ulož ju do tohto istého priečinka

# ── Taxonómie (klikateľné na webe) ───────────────────────────────
zanre: []               # napr. ["román", "duchovná literatúra"]
autori: []              # napr. ["James Redfield"]
nalady: []              # napr. ["zamyslenie", "útecha"]

# ── B612 Compass — 0 až 10 na každej osi ─────────────────────────
kompas:
  style:                # jazyk, veta, rytmus
  story:                # dej, ťah, postavy
  echo:                 # čo vo mne ostalo
  depth:                # myšlienka pod dejom

# ── Zhrnutie knihy jednou vetou ─────────────────────────────────
# Ide na dlaždicu na domovskej aj na druhý obrázok Instagram carouselu.
hlavnaMyslienka: ""

# ── Citáty. Každý dostane vlastný obrázok v carouseli. ───────────
citaty:
  - text: ""
    strana:
  - text: ""
    strana:

# ── Záverečná veta carouselu (odporúčanie / komu knihu dať) ──────
zaver: ""
---

{{`{{< kniha >}}`}}

## O knihe

Sem príde tvoj text o knihe. Na konci nechaj **tučnú vetu s hlavnou
myšlienkou** — tú istú, ktorú si napísala hore do `hlavnaMyslienka`.

## Hodnotenie

{{`{{< kompas >}}`}}

## Kedy by som ju otvorila znova

V akej nálade alebo v akom období by som po nej znova siahla.
