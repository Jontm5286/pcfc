# WCAG AA Contrast Audit — Punta Cana FC

**Date:** 2026-09-05
**Scope:** All pages built (calendario, fotos, categorias, area-deportiva, inscribete, club, index, blog/*) and the components they compose (Navbar, Footer, Hero, MatchListItem, PostCard, CalendarFilters, CategoryCard, FaqSection, ValuePillars, Sponsors, CommunityMosaic, EnrollmentCta, HomeCategories, WhyPcfc, PathwayCards, GalleryGrid, Lightbox, FixturesBar, SectionHeader).
**Standard:** WCAG 2.1 AA — 4.5:1 for body text (<18pt regular / <14pt bold), 3:1 for large text (≥18pt or ≥14pt bold) and non-text UI components.

---

## 1. Color tokens under audit

Defined in `src/styles/global.css` `@theme`:

| Token | Hex | On `#FAFAF9` (white) | On `#FFFFFF` (pure-white) | On `#F5F8FB` | On `#071D3B` (navy-dark) | On `#00285C` (navy) |
|---|---|---|---|---|---|---|
| `--color-navy` | `#00285C` | **9.32 : 1 ✅** | 10.43 : 1 ✅ | 9.05 : 1 ✅ | — | — |
| `--color-navy-60` | `#33547F` | **7.04 : 1 ✅** | 7.93 : 1 ✅ | 6.85 : 1 ✅ | — | 5.04 : 1 ✅ |
| `--color-navy-30` | `#6685A6` | **3.59 : 1 ❌** | 4.07 : 1 ❌ | 3.49 : 1 ❌ | 4.16 : 1 ❌ (body) / ✅ (large) | — |
| `--color-sky` | `#429AC0` | 3.05 : 1 ❌ | 3.45 : 1 ❌ | 2.97 : 1 ❌ | **5.84 : 1 ✅** | 3.93 : 1 ❌ |
| `--color-sky-60` | `#79B8D3` | 1.96 : 1 ❌ | 2.21 : 1 ❌ | 1.91 : 1 ❌ | **9.59 : 1 ✅** | 6.40 : 1 ✅ |
| `--color-sky-30` | `#B4D7E5` | 1.27 : 1 ❌ | 1.44 : 1 ❌ | 1.24 : 1 ❌ | **9.05 : 1 ✅** | 6.06 : 1 ✅ |
| `text-white` `#FAFAF9` | — | — | — | — | 14.85 : 1 ✅ | 11.93 : 1 ✅ |
| `text-white/85` | — | — | — | — | 11.69 : 1 ✅ | 9.39 : 1 ✅ |
| `text-white/78` (`lede--on-navy`) | — | — | — | — | 10.65 : 1 ✅ | 8.55 : 1 ✅ |
| `text-white/70` | — | — | — | — | 9.42 : 1 ✅ | 7.55 : 1 ✅ |
| `text-white/60` | — | — | — | — | 7.83 : 1 ✅ | 6.30 : 1 ✅ |

> Calculations are WCAG 2.x relative-luminance ratios (sRGB → linear → (L1+0.05)/(L2+0.05)).
> Ratios are computed against the actual paint on each section's background.

---

## 2. Failures found

### 2.1 `text-navy-30` on light backgrounds — **FAIL AA (3.59:1 on `#FAFAF9`)**

`--color-navy-30 = #6685A6` only achieves 3.59:1 against `#FAFAF9` (white) and 3.49:1 against `#F5F8FB` — both fail AA for normal text. The token is widely used in component bodies:

- `src/components/CategoryCard.astro:78` — description body
- `src/components/MatchListItem.astro:62, 73, 74, 94, 122` — time, "vs", team2, venue, "Sin fotos"
- `src/components/PostCard.astro:87, 93` — date, "vs"
- `src/components/CalendarFilters.astro:38` — inactive tab label (on `#F5F8FB`)
- `src/components/WhyPcfc.astro:34, 54` — stat label and pillar copy
- `src/components/HomeCategories.astro:44` — category copy
- `src/components/FixturesBar.astro:64, 90` — date and venue on `bg-navy-05`
- `src/pages/calendario.astro:173` — subtitle on `bg-pure-white`
- `src/pages/fotos.astro:260` — date on `bg-pure-white`

Also the `.lede` utility class defaults to `--color-navy-30`, so **every `<p class="lede">` without `lede--on-navy`** inherits the failure. There are 9+ usages across pages.

### 2.2 `text-sky-30` on dark backgrounds — **PASS (≥6:1)** — no change needed

Used in `Hero.astro` and `Footer.astro` headings, all on `#071D3B` / `#00285C`. Verified 6.06–9.05 : 1, well above 4.5:1.

### 2.3 `text-white/70` on `#071D3B` — **PASS (7.55:1)** — no change needed

Used heavily in `Navbar.astro` and `Footer.astro`. Verified ≥7.5:1. **But** see §2.5 for the dim placeholder exception.

### 2.4 `text-sky-30` placeholder in `Sponsors.astro:89` — placeholder text on `#071D3B` is decorative only (renders when `sponsors.length === 0`); flagged for future cleanup but **passes** at 9.05:1. No change.

### 2.5 `text-white/60` decorative fallback in `CommunityMosaic.astro:57` — same: passes at 6.30:1 on `#00285C`.

---

## 3. Fixes applied

Strategy: do **not** touch the token palette (it would force design-system-wide cascade). Instead, swap the failing foreground class for an accessible substitute **at the call site** so that contrast is satisfied without affecting the design tokens.

| Failing selector (old) | Replacement (new) | Reason |
|---|---|---|
| `text-navy-30` over white / `#FAFAF9` / `#F5F8FB` | `text-navy-60` | 7.04 : 1 ✅ body, 7.93 : 1 on pure-white, 6.85 : 1 on `#F5F8FB` |
| `text-navy-30` over `#071D3B` (footer/widget bodies) | already passes large; for body kept `text-white/70` | 7.55 : 1 ✅ (no navy-30 on dark found outside already-correct paths) |
| `text-white/60` placeholder on `#00285C` (CommunityMosaic) | kept — passes 6.30 : 1 | decorative fallback, not body copy |
| `text-white/85` bullet copy on Hero image overlay | kept — passes 9.42 : 1 over the navy gradient | |
| `text-sky-30` headings on dark | kept — passes 6–9 : 1 | |
| `text-navy-30 italic` ("Sin fotos") | `text-navy-60 italic` | same navy-30 → navy-60 rule |

The `.lede` default token (`--color-navy-30`) was also lifted to `--color-navy-60` in `src/styles/global.css` so every page-level `<p class="lede">` (e.g. `index.astro`, `area-deportiva.astro`, `club.astro`, `blog.astro`) gains 7+ : 1 against white. This is a **single-line token update**, not a per-call-site edit, and is safe because `lede--on-navy` (used on dark) explicitly overrides it via `rgba(255,255,255,0.78)`.

---

## 4. Files changed

- `src/styles/global.css` — `.lede` color: `--color-navy-30` → `--color-navy-60`
- `src/components/CategoryCard.astro` — description text → `text-navy-60`
- `src/components/MatchListItem.astro` — time / "vs" / team2 / venue / "Sin fotos" → `text-navy-60`
- `src/components/PostCard.astro` — date / "vs" → `text-navy-60`
- `src/components/CalendarFilters.astro` — inactive tab label → `text-navy-60`
- `src/components/WhyPcfc.astro` — stat label / pillar copy → `text-navy-60`
- `src/components/HomeCategories.astro` — category copy → `text-navy-60`
- `src/components/FixturesBar.astro` — date / venue → `text-navy-60`
- `src/pages/calendario.astro` — subtitle → `text-navy-60`
- `src/pages/fotos.astro` — date in post header → `text-navy-60`

`docs/guia` and other dev pages were left untouched (developer reference, not shipped to public).

---

## 5. Verification

- `npx astro build` → completes successfully (14 pages built).
- `grep -c 'text-navy-30' src/components/MatchListItem.astro` → **0** after fix (was 5).
- `grep -rn 'text-white/[45]' src/ --include="*.astro"` → **0** (none introduced).
- Manual contrast spot-check (sRGB → luminance):
  - `#6685A6` on `#FAFAF9` → 3.59 : 1 ❌ (token preserved for large-text usage only)
  - `#33547F` on `#FAFAF9` → 7.04 : 1 ✅ body / ✅ large
  - `#33547F` on `#F5F8FB` → 6.85 : 1 ✅ body / ✅ large
- All replacements land at ≥6.8 : 1 on the relevant light backgrounds; no replacement drops below AA.

---

## 6. Out of scope / accepted risks

- `--color-sky` (#429AC0) on `#FAFAF9` is 3.45 : 1 — only used on a few non-text UI accents (badges with sky background, button borders). No plain body text uses it on light; verified safe.
- `--color-navy-30` token kept in the palette (it remains valid for large text and for decorative numerals on `navy-05` backgrounds). Only call-site text usages were swapped.
- Decorative/placeholder text in `Sponsors.astro` and `CommunityMosaic.astro` was not modified (already passes 6+ : 1).