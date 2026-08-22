# BookSpaceB612

Knižný blog. Píšeš jednu recenziu — a vypadne z nej web aj hotový Instagram carousel.

Web beží na [Hugo](https://gohugo.io) s témou PaperMod, nasadzuje sa sám na GitHub Pages.

---

## Ako pridať knihu

### 1. Založ recenziu

```bash
npm run nova -- "Názov knihy"
```

Vytvorí sa priečinok `content/sk/knihy/nazov-knihy/` so súborom `index.md`.

### 2. Priprav fotky

Odfoť obálku a stránky, ktoré chceš ukázať. Fotky ulož do toho istého
priečinka ako `index.md` pod menami `obalka.jpg` a `ukazka-1.jpg`,
`ukazka-2.jpg`, `ukazka-3.jpg`.

Ak fotka potrebuje orezať alebo vyrovnať:

```bash
# 1. nechaj si vykresliť mriežku a odčítaj z nej výrez v percentách
node ig/foto.mjs --in fotka.jpeg --mriezka

# 2. orež — x, y, šírka, výška v percentách; --rotate vyrovná náklon
node ig/foto.mjs --in fotka.jpeg --out obalka.jpg \
     --crop 13.5,4.4,75.5,91.6 --rotate 1.4 --preset obalka
```

`--preset obalka` nechá farby verné, `--preset stranka` presvetlí papier
a stlmí žltnutie. Ak dáš výstup s príponou `.png`, zachová sa priehľadné
pozadie — hodí sa na obálky vystrihnuté z podkladu.

### 3. Vyplň hlavičku

V `index.md` je hore hlavička medzi `---`. Podstatné je:

| Položka | Čo to robí |
|---|---|
| `nazovKnihy`, `autor` | karta knihy a Instagram |
| `kompas:` | štyri hodnoty 0–10 → graf na webe aj na Instagrame |
| `hlavnaMyslienka` | zhrnutie knihy jednou vetou — dlaždica na domovskej aj 2. obrázok carouselu |
| `citaty:` | z každého citátu vznikne samostatný príspevok na Instagram |
| `zaver` | posledný obrázok carouselu |
| `draft: true` | kniha je rozpísaná a **nezverejní sa** |

### 4. Napíš recenziu

Pod hlavičkou. Kostra je predpripravená: **O knihe**, **Hodnotenie**,
**Kedy by som ju otvorila znova**.

### 5. Pozri si to

```bash
npm start
```

Otvor `http://localhost:1313/`. Stránka sa obnovuje sama pri každej zmene.

### 6. Sprav obrázky na Instagram

```bash
npm run ig
```

Vzniknú dve veci:

**`ig/out/nazov-knihy/`** — carousel ku knihe, štyri obrázky na nočnej
oblohe: obálka, zhrnutie jednou vetou, B612 Compass, kedy ju otvorím
znova. Nahraj ich v poradí 01 až 04. Text príspevku je v `popis.txt`.

**`ig/out/citaty/`** — každý citát ako samostatný obrázok na krémovom
papieri, aby sa v profile striedali s tmavými knižnými postami. Ku
každému je `.txt` s textom príspevku. Postuj ich jednotlivo, kedykoľvek
medzi knihami.

### 7. Zverejni

V hlavičke zmeň `draft: true` na `draft: false` a pošli to von:

```bash
git add -A
git commit -m "Názov knihy"
git push
```

Asi minútu potrvá, kým sa web prestaví. Priebeh vidíš na GitHube v karte
**Actions**.

---

## Kde sa čo mení

| Chcem zmeniť | Súbor |
|---|---|
| farby, veľkosti, vzhľad | `assets/css/extended/b612.css` |
| názvy osí kompasu, hashtagy | `data/b612.json` |
| menu, uvítací text, jazyky | `hugo.toml` |
| text O blogu | `content/sk/o-blogu.md` |
| vzhľad carouselu ku knihe | `layouts/_default/single.igslides.html` |
| vzhľad citátových kariet | `layouts/_default/single.igquotes.html` |
| text popisu pod príspevkom | `layouts/_default/single.igcaption.txt` |
| kostra novej recenzie | `archetypes/knihy.md` |

## Príkazy

```bash
npm start                     web u teba v počítači
npm run nova -- "Názov"       nová recenzia
npm run ig                    obrázky na Instagram (všetky knihy)
npm run ig -- nazov-knihy     obrázky len k jednej knihe
npm run build                 postaví web do public/ (robí to aj GitHub sám)
```

---

## Poznámky pre budúcnosť

**Téma je submodul.** PaperMod nie je súčasťou tohto repozitára, len naň
ukazuje. Po stiahnutí projektu na nový počítač treba spustiť:

```bash
git submodule update --init --recursive
```

**Tri súbory sú prekopírované z témy** a upravené:
`layouts/partials/header.html`, `footer.html` a `home_info.html`.
Pri aktualizácii PaperModu ich treba zosúladiť ručne. Všetko ostatné
v `layouts/` sú vlastné súbory, ktoré tému len dopĺňajú.

**Základná adresa.** V `hugo.toml` je `baseURL` nastavená na
`http://localhost:1313/` kvôli písaniu. Pri nasadení ju GitHub prepíše na
skutočnú adresu blogu, takže ju nemusíš meniť. Nesmie však obsahovať
podpriečinok — PaperMod z nej počíta drobčekovú navigáciu.

**Pracovné podklady** (wordy, pôvodné fotky z mobilu, logá) sú naschvál
mimo gitu — repozitár je verejný. Zálohuj si ich zvlášť.
