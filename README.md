# style-xlsx-m

Read and write `.xlsx` files in Node.js with cell styles kept, and set page setup for printing.

Based on [SheetJS Community Edition](https://github.com/SheetJS/sheetjs) (`xlsx` 0.18.5) and [xlsx-js-style](https://github.com/gitbrent/xlsx-js-style).

> **Security note:** this package is built on SheetJS 0.18.5, which has known vulnerabilities fixed upstream in later versions (prototype pollution, CVE-2023-30533, and ReDoS, CVE-2024-22363). **Do not use it to parse untrusted files.** `npm audit` will not flag this, because the SheetJS code is bundled into the package rather than installed as a dependency.

## Why this fork

| | SheetJS (npm `xlsx`) | xlsx-js-style | style-xlsx-m |
| :-- | :-- | :-- | :-- |
| Write cell styles | no | yes | yes |
| Read cell styles from an existing `.xlsx` | no | no | yes (`cellStyles: true`) |
| `sheet_to_json` returns styles | no | no | yes (`getCellStyles: true`) |
| Page setup (`!pageSetup`) | no | no | yes |

The use case is editing an existing styled Excel template: read it, change the data, and save it without losing the formatting.

## Installation

```sh
npm install style-xlsx-m
```

```sh
yarn add style-xlsx-m
```

## Quick start

```js
const XLSX = require('style-xlsx-m');

const wb = XLSX.utils.book_new();

const row = [
  { v: 'line\nbreak', t: 's', s: { alignment: { wrapText: true } } },
  { v: 'Courier: 24', t: 's', s: { font: { name: 'Courier', sz: 24 } } },
  { v: 'fill: color', t: 's', s: { fill: { patternType: 'solid', fgColor: { rgb: 'E9E9E9' } } } },
  { v: 'bold & color', t: 's', s: { font: { bold: true, color: { rgb: 'FF0000' } } } },
];

const ws = XLSX.utils.aoa_to_sheet([row]);
XLSX.utils.book_append_sheet(wb, ws, 'demo');
XLSX.writeFile(wb, 'demo.xlsx');
```

For everything else (`utils`, `read` options, other formats) see the [SheetJS documentation](https://docs.sheetjs.com/). It applies, except where this README says otherwise.

## Reading a file with styles

Pass `{ cellStyles: true }` to `readFile` (or `read`). Each cell then has an `s` property. Edit values, save with `writeFile`, and the styles are written back.

```js
const XLSX = require('style-xlsx-m');

const wb = XLSX.readFile('./demo.xlsx', { cellStyles: true });
const ws = wb.Sheets['demo'];

ws.A1.v = 'changed'; // value changes, style stays
XLSX.writeFile(wb, 'demo-edited.xlsx');
```

Styles are also available per row from `sheet_to_json`:

```js
const { out, styles } = XLSX.utils.sheet_to_json(ws, { header: 1, getCellStyles: true });
// out[r][c]    -> cell value
// styles[r][c] -> style object of that cell ({} if the cell has no style)
```

Note: `styles[r]` lists the cells that `sheet_to_json` visits in that row, in order. It can be shorter than the sheet's width.

Reading styles works for `.xlsx` only, not `.xls`.

## Cell styles reference

A cell is `{ v: value, t: type, s: style }`. The supported style properties are `alignment`, `border`, `fill` and `font`.

```js
const COLOR = { rgb: 'FF0000' };          // hex value, no leading "#"
const COLOR_THEME = { theme: 4 };         // theme colour index
const COLOR_TINT = { theme: 1, tint: 0.4 };

const border = { style: 'thick', color: COLOR };

const style = {
  alignment: {
    vertical: 'center',      // 'top' | 'center' | 'bottom'
    horizontal: 'center',    // 'left' | 'center' | 'right'
    wrapText: true,
    textRotation: 0,         // 0 to 180, or 255 (vertical text)
  },
  border: {
    top: border,
    bottom: border,
    left: border,
    right: border,
    diagonal: { style: 'thin', color: COLOR, diagonalUp: false, diagonalDown: true },
  },
  font: {
    name: 'Calibri',
    sz: 11,                  // points
    color: COLOR,
    bold: false,
    italic: false,
    strike: false,
    underline: false,
    vertAlign: 'superscript', // 'superscript' | 'subscript'
  },
  fill: {
    patternType: 'solid',    // 'solid' | 'none'
    fgColor: COLOR,          // background colour of a solid fill
  },
};
```

Border `style` is one of: `dashDotDot`, `dashDot`, `dashed`, `dotted`, `hair`, `mediumDashDotDot`, `mediumDashDot`, `mediumDashed`, `medium`, `slantDashDot`, `thick`, `thin`.

## Page setup for printing

Set `!pageSetup` on a worksheet before writing:

```js
ws['!pageSetup'] = {
  paperSize: '9',          // '9' = A4
  scale: '91',             // percent
  fitToWidth: '0',         // '0' | '1'
  orientation: 'landscape' // 'landscape' | 'portrait'
};
```

When a file is **read**, `ws['!pageSetup']` is the raw `<pageSetup .../>` XML tag as a string, not an object. If you edit and re-save a file, assign an object as shown above to change the settings.

## Limitations / Known issues

- Based on SheetJS 0.18.5 (see the security note above). Do not parse untrusted files.
- Cell styles are read from `.xlsx` only, not `.xls`.
- Reading is not a full round trip. In testing, a solid cell fill and border colours written to a file did not come back in the cell's `s` object after `readFile`. Check your own templates and test before relying on this.
- `!pageSetup` is returned as a raw XML string on read (see above).
- The TypeScript definitions are inherited from SheetJS with a `getCellStyles` option added. The `s` style property and `!pageSetup` are not fully typed.
- Only the write functions come from xlsx-js-style: `write`, `writeFile`, `writeFileSync`, `writeXLSX`, `writeFileXLSX`.

## Credits & License

This package is a fork of [SheetJS Community Edition](https://github.com/SheetJS/sheetjs) and includes code from [xlsx-js-style](https://github.com/gitbrent/xlsx-js-style). Both are licensed under the Apache License 2.0.

Changes in this fork (by Shukurov Shahrom):
- Reading existing `.xlsx` files with cell styles preserved (`cellStyles: true`)
- `getCellStyles` option for `sheet_to_json`
- Page setup for printing (paper size, orientation, scale)

This project is not affiliated with or endorsed by SheetJS LLC.
Licensed under the Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).