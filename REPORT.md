# Release readiness report: style-xlsx-m 0.1.32

Completed on 2026-10-14 (Asia/Dushanbe), on branch `chore/release-ready`. Nothing was pushed or published. No registry-changing command was run.

## 1. Independent round-trip results

`test/fixtures/styled-template.xlsx` was generated with openpyxl 3.1.5, independently of either JavaScript library. Its text, values and author metadata are synthetic. The test reads it with exactly `{ cellStyles: true }`, changes A1 to `Product A edited`, saves through the installed npm tarball, then opens the saved file with openpyxl. Every property below is compared with the original. RGB comparisons ignore the alpha prefix, which the writer normalizes.

| Property | Present in `s` immediately after read | Preserved in saved file |
| :-- | :-- | :-- |
| `A1.fill.patternType` | Yes | Yes |
| `A1.fill.fgColor` | Yes | Yes |
| `B1.fill.patternType` | Yes | Yes |
| `B1.fill.fgColor` | Yes | Yes |
| `C1.fill.patternType` | Yes | Yes |
| `C1.fill.fgColor` | Yes | No (colour lost) |
| `A1.border.left.style` | Yes | Yes |
| `A1.border.left.color` | Yes | Yes |
| `A1.border.right.style` | Yes | Yes |
| `A1.border.right.color` | Yes | Yes |
| `A1.border.top.style` | Yes | Yes |
| `A1.border.top.color` | Yes | Yes |
| `A1.border.bottom.style` | Yes | Yes |
| `A1.border.bottom.color` | Yes | RGB colour kept; indexed reference changed |
| `A1.font.name` | Yes | Yes |
| `A1.font.sz` | Yes | Yes |
| `A1.font.bold` | Yes | Yes |
| `A1.font.italic` | Yes | Yes |
| `A1.font.underline` | Yes | Yes |
| `A1.font.color` | Yes | Yes |
| `A1.alignment.horizontal` | Yes | Yes |
| `A1.alignment.vertical` | Yes | Yes |
| `A1.alignment.wrapText` | Yes | Yes |
| `A1.alignment.textRotation` | Yes | Yes |
| `A2.number_format` | No (stored outside `s`) | Yes |
| `B2.number_format` | No (stored outside `s`) | Yes |
| `merges` | No (stored outside `s`) | Yes |
| `column.A.width` | No (stored outside `s`) | Yes |
| `row.1.height` | No (stored outside `s`) | Yes |
| `pageSetup.paperSize` | No (stored outside `s`) | Yes |
| `pageSetup.orientation` | No (stored outside `s`) | Yes |
| `pageSetup.scale` | No (stored outside `s`) | Yes |

The exact in-memory cell styles are recorded in `test/fixtures/read-styles.json` and asserted in `test/roundtrip.test.js`. Theme-index-0 is correctly exposed as `{ theme: 0 }`, but the upstream writer drops it. Indexed red becomes `FF0000`, so the colour is retained while its palette reference is lost. Number/date formats are not in `s`; `cellNF: true` exposes them as `cell.z`, verified separately. Merges, widths and heights are in worksheet metadata; page setup is a raw XML string.

## 2. Bugs fixed and remaining limitations

- Fixed disabled fill mapping in the fork’s `safe_format`: parsed fills now become `s.fill`, the shape the writer needs. The regression test asserts RGB fill content and the theme-4/tint values in memory and after saving.
- Fixed the fork’s border-colour handling, which overwrote RGB colours with an undefined index. Theme references and tint are now retained. Indexed RGB values are padded to six hex digits; the old conversion produced `ff00` for indexed red and made openpyxl reject the saved workbook. The regression test asserts RGB colours, theme/tint, valid output, and the RGB conversion.
- The original minimal border assertion failed with `undefined` instead of `123456`; the original independently saved workbook failed openpyxl validation with “Colors must be aRGB hex values”. The fixed fixture opens and passes.
- No upstream writer behaviour was changed. Theme-index-0 fill loss and indexed-border conversion are explicitly documented and asserted as limitations.
- Documented existing `sheet_to_json` edge cases: non-empty sheets require an options object; missing options throw. Empty sheets return `[]` even with `getCellStyles: true`. Tests confirm both; no public behaviour was changed.
- Documented partial preservation, unverified underline variants/gradients/conditional formatting/diagonal border reading/custom themes, raw page-setup tags and string-valued setup objects. The tests confirm only the supplied fixture, not arbitrary workbooks or visual rendering in Excel.
- Documented entry-point differences: Node CommonJS is the tested style reader, `module` remains a separate xlsx-js-style bundle, CDN entries remain upstream SheetJS. Async writes still use the inherited writer. Existing entry paths are kept and smoke-tested.
- Optional TypeScript tightening was skipped: `s` is inherited as `any`, worksheet metadata uses a broad indexer, and `sheet_to_json` lacks the object-return overload. Narrowing these safely across inherited formats needs a separate compatibility review. No `tsc` result is claimed. README states this limitation.

## 3. README examples

`npm test` runs `test/run.js`, which packs the package, installs the tarball into a fresh temporary directory with no folder link, extracts every JavaScript block from the packed README into a separate script, runs it, and independently inspects the workbooks. Sections that show fragments receive only the surrounding workbook setup or a save call. Their code is not rewritten by the harness.

| Example | Result | Independent checks |
| :-- | :-- | :-- |
| Quick start | Passed | Wrap text, Courier font/size, solid RGB fill, bold red font |
| Reading a file with styles | Passed; explanation corrected | Edited value, alignment and fill retained |
| `sheet_to_json` / `getCellStyles` | Passed; indexing comment corrected | `{ out, styles }`, exact row values and four corresponding styles |
| Cell styles reference | Fixed and passed | Diagonal flags moved to `border`; alignment, all four borders, diagonal direction, font colour/size/superscript, fill |
| Page setup | Passed | A4, landscape, scale 91, fitToWidth 0 in openpyxl |

All five scripts ran, and the final independent output checks passed. The first print check had a test error (openpyxl exposes `paperSize` as an integer); it was corrected after checking the actual XML, then re-run successfully.

The “Why this fork” comparison was also checked against downloaded `xlsx@0.18.5` and `xlsx-js-style@1.2.0`: both expose fill metadata in `s` but not writer-ready full styles, both ignore `!pageSetup` on save, and both return a plain array with `getCellStyles`. The table now describes writer-ready selected styles rather than claiming SheetJS reads no styles at all.

Final full test command (use the Python executable in your own openpyxl environment):

```sh
PYTHON=/path/to/openpyxl-environment/bin/python3 npm test
```

Tested with Node.js 22.19.0, npm 11.6.1 and openpyxl 3.1.5. The inherited `engines: >=0.8` field was left unchanged to avoid silently changing the support contract, but this modern JavaScript fork is not verified on that range; see the open TODO below.

## 4. License and attribution

Fetched original tarballs using `npm pack xlsx@0.18.5 xlsx-js-style@1.2.0` and compared source files byte-for-byte. xlsx-js-style’s build banner and style_version identify 1.2.0. Neither tarball ships a NOTICE file, so no upstream NOTICE content was omitted.

Root `LICENSE`, `dist/LICENSE` and `xlsx-js-style/dist/LICENSE` match the full upstream Apache 2.0 text byte-for-byte (SHA-256 `4d2a38ac35cda06a555c84074a819d413339cd3691b822cae50f8f322fe01f64`). Original copyright headers and license text remain intact. NOTICE credits both upstream projects, records the selected-style limitations, and uses Shahrom Shukurov.

Each modified source found in the upstream comparison now carries a “Modified by Shahrom Shukurov” line immediately after its original leading header:

| File | Local changes / release status |
| :-- | :-- |
| `xlsx.js` | Style reading, style collection, page setup, delegated writes; fixed fill mapping and border colours. |
| `xlsx.mjs` | Pre-existing diagnostic logging; not shipped. |
| `dist/xlsx.core.min.js` | Pre-existing local build differences; not shipped. |
| `dist/xlsx.mini.min.js` | Pre-existing local build differences; not shipped. |
| `dist/xlsx.extendscript.js` | Pre-existing local build differences; not shipped. |
| `xlsx-js-style/dist/shim.min.js` | Pre-existing reformatted shim; not shipped. |
| `xlsx-js-style/dist/xlsx.min.js` | Pre-existing printing/style collection extensions and formatting; shipped writer. |
| `xlsx-js-style/dist/xlsx.bundle.js` | Pre-existing printing/style collection extensions and formatting; shipped module entry. |
| `xlsx-js-style/types/index.d.ts` | Pre-existing getCellStyles option; not shipped. |
| `types/index.d.ts` | Pre-existing getCellStyles option and worksheet naming declaration; shipped types. |

Other root dist files and source maps were byte-identical to upstream. Attribution notes do not alter the old builds’ runtime logic. Legacy local builds remain in the repository but are excluded unless referenced by package metadata.

Existing codepage, adler-32 and commander license files remain in the repository. Exact copies are shipped in `third-party-licenses/` so pruning nested vendor files from the tarball does not prune their notices. The seven external runtime dependencies (`adler-32`, `cfb`, `codepage`, `crc-32`, `ssf`, `wmf`, `word`) all have LICENSE files in the fresh installation.

Package metadata: `license` is `Apache-2.0`; author is `Shahrom Shukurov` (personal email removed); description states the fork and its purpose; keywords include xlsx, excel, styles, export, sheetjs and page-setup. Repository, homepage and bugs retain the existing MOR8T/STYLE-XSLX-M URLs. Git’s origin/default branch is `main`, and README uses absolute repository URLs for LICENSE/NOTICE. The security note, credits, and non-endorsement statement remain.

## 5. Company and sensitive content

Scanned all working-tree files (including legacy vendor code and source maps), the fixture’s decompressed XML, and all 16 files unpacked from the final installed tarball. Git object storage/history was not rewritten. The scan covered the supplied company keyword, internal-domain markers, IP-shaped values, emails, phone patterns, common token/key assignments and formats, private-key headers, `.env` names, and Cyrillic text. URL hosts and local source changes were reviewed for company-specific material and report names.

- No company-specific names, internal domains, actual IP addresses, phone numbers, credentials, `.env` files or real report data were found in the scanned contents.
- Removed the author’s personal email from package metadata; no employer content needed removal.
- Email matches in legacy vendor files are upstream project contacts; the commander license’s upstream contact is carried into the tarball. These are attribution, not private credentials.
- IP-shaped strings are OOXML/specification section numbers, not network endpoints. Every such match and every Cyrillic match in shipped sources was verified against upstream. Cyrillic is encoding tables and upstream localized strings, not company fixture data. These remain intact.
- Fixture creator/lastModifiedBy are “Synthetic fixture”; values are Product A/B/C, 100.25, 2026-01-01 and a synthetic heading.
- Content scanning cannot establish ownership of work originally created at an employer. Permission to release that work remains an owner decision, listed below.

## 6. Package hygiene

Ran `npm pkg fix`; removed the CLI `bin` entry because CLI support is outside this release’s documented use. Added an explicit files whitelist for licenses, README, main/module/CDN/type entries, required codepage runtime files, and vendor license copies. No nested node_modules, test files, fixtures, logs, source maps or REPORT.md are shipped. The runtime requires no files from the legacy nested node_modules tree; it uses the bundled codepage files. Legacy files are retained locally with their licenses.

| Metric | Before (0.1.31) | After (0.1.32) |
| :-- | --: | --: |
| File count (`npm pack --dry-run`) | 212 | 16 |
| Unpacked size, bytes | 17574056 | 4356995 |
| Packed size, bytes | 5195767 | 1261189 |
| Nested node_modules files | 178 | 0 |

Unpacked size reduced by 75.2%. Final main, module, unpkg, jsdelivr and types entry paths exist; JavaScript entries load successfully from the installed tarball. `npm test` passed after cleanup and after the patch bump. `git diff --check` passed. Version was bumped using `npm version patch --no-git-tag-version` and committed; no tag or push was created.

## 7. Open TODOs requiring owner input

- Confirm the existing repository URL is the intended public portfolio destination. No URL was invented. LICENSE/NOTICE links point at origin’s existing `main` branch; local changes remain on `chore/release-ready` until you publish the Git changes yourself.
- Confirm authorization to release changes originally created during employment. The source/content/license checks do not establish that authorization.
- Decide the supported Node.js range before claiming older runtime support. The inherited `>=0.8` metadata predates the fork’s modern syntax; the completed tests establish Node.js 22.19.0 only.
- TypeScript style/page-setup/object-return typing remains a documented optional follow-up.

## 8. Publishing commands (for you to run)

No publish or login command was executed. From the package repository, with an authenticated npm session and an openpyxl Python environment:

```sh
PYTHON=/path/to/openpyxl-environment/bin/python3 npm test
npm pack --dry-run
npm publish --otp=<code>
```

Replace `<code>` with your current npm one-time code. REPORT.md is excluded from the package whitelist.
