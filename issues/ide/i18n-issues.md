# Tauri Desktop App — Internationalization (i18n) Issues

> Package: `packages/desktop/src/i18n/`
> Generated: 2026-03-28
> Verified: 2026-03-28
> Scope: i18n initialization, locale mapping, translation files (14 locales), locale detection

---

## Medium

| #     | Issue                                                           | File                | Line(s)   | Details                                                                                                                                                                                                                                                 |
| ----- | --------------------------------------------------------------- | ------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | **Portuguese always maps to Brazilian Portuguese**              | `i18n/index.ts`     | 100       | `if (language.toLowerCase().startsWith("pt")) return "br"` — European Portuguese (`pt-PT`) users always get Brazilian Portuguese translations. **Fix:** Check for `pt-BR` explicitly and fall back to `en` (or add `pt`) for other Portuguese variants. |
| ~~2~~ | ~~**`LOCALES` array order doesn't match `Locale` type order**~~ | ~~`i18n/index.ts`~~ | ~~56-72~~ | ~~The last 4 entries are left-rotated (not just a simple swap): `Locale` type ends with `ar, no, br, bs` while `LOCALES` ends with `bs, ar, no, br`. Not a runtime bug.~~                                                                               |

## Low

| #   | Issue                                              | File                                         | Line(s)    | Details                                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------------- | -------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3   | **Incorrect French elision**                       | `i18n/fr.ts`                                 | 14, 19, 43 | Three instances of `"d'Kilo"` which should be `"de Kilo"` (French elision: _de_ before consonant). Lines: `"Vous utilisez déjà la dernière version d'Kilo"`, `"La version {{version}} d'Kilo"`, `"Documentation d'Kilo"`. **Fix:** Replace all `d'Kilo` with `de Kilo`. |
| 4   | **OC-prefixed env vars for Linux display backend** | N/A (documented in linux-platform-issues.md) | —          | `OC_ALLOW_WAYLAND`, `OC_FORCE_X11`, etc. should be `KILO_*` prefixed. These env-var-driven strings may need i18n-aware documentation.                                                                                                                                   |

## Completeness

All 14 non-English locale files contain the same 53 keys as `en.ts`. No missing keys detected across locales:

| Locale              | File     | Keys | Status                                                                                                                                                     |
| ------------------- | -------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| English             | `en.ts`  | 53   | Baseline                                                                                                                                                   |
| Arabic              | `ar.ts`  | 53   | Complete                                                                                                                                                   |
| Bosnian             | `bs.ts`  | 53   | Complete                                                                                                                                                   |
| Breton              | `br.ts`  | 53   | ~~Complete~~ Note: `br` is non-standard; file contains Brazilian Portuguese, not Breton (standard ISO 639-1 `br` = Breton, `pt-BR` = Brazilian Portuguese) |
| Danish              | `da.ts`  | 53   | Complete                                                                                                                                                   |
| German              | `de.ts`  | 53   | Complete                                                                                                                                                   |
| Spanish             | `es.ts`  | 53   | Complete                                                                                                                                                   |
| French              | `fr.ts`  | 53   | Complete (3 elision errors)                                                                                                                                |
| Japanese            | `ja.ts`  | 53   | Complete                                                                                                                                                   |
| Korean              | `ko.ts`  | 53   | Complete                                                                                                                                                   |
| Norwegian           | `no.ts`  | 53   | Complete                                                                                                                                                   |
| Polish              | `pl.ts`  | 53   | Complete                                                                                                                                                   |
| Russian             | `ru.ts`  | 53   | Complete                                                                                                                                                   |
| Chinese Simplified  | `zh.ts`  | 53   | Complete                                                                                                                                                   |
| Chinese Traditional | `zht.ts` | 53   | Complete                                                                                                                                                   |

## Summary

| Severity  | Count |
| --------- | ----- |
| Medium    | 1     |
| Low       | 2     |
| **Total** | **3** |

### Recommendation

- Fix the French elision errors (quick win)
- Add European Portuguese support or fix the locale mapping
- ~~Align `LOCALES` array order with `Locale` type definition~~ (low severity, not a runtime issue)
