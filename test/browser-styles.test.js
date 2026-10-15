const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { XLSX: load } = require('./helpers');
const XLSX = load();
const template = path.join(__dirname, 'fixtures', 'book1.xlsx');
const workbook = XLSX.read(new Uint8Array(fs.readFileSync(template)), { type: 'array', cellStyles: true });
const sheet = workbook.Sheets.Sheet1;
assert.strictEqual(sheet.A2.t, 'z', 'A styled blank must remain blank, not a space');
assert.strictEqual(sheet.A2.v, undefined);
assert.strictEqual(sheet.A1.s.font.family, 2);
assert.strictEqual(sheet.A1.s.font.scheme, 'minor');
sheet.B3.v = 'Проверено в React';
const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
const restored = XLSX.read(new Uint8Array(output), { type: 'array', cellStyles: true });
assert.strictEqual(restored.Sheets.Sheet1.A2.t, 'z');
assert.strictEqual(restored.Sheets.Sheet1.A2.v, undefined);
assert.deepStrictEqual(restored.Sheets.Sheet1.A2.s.font, sheet.A2.s.font);
assert.deepStrictEqual(restored.Sheets.Sheet1.A2.s.alignment, sheet.A2.s.alignment);
assert.strictEqual(restored.Sheets.Sheet1.B3.v, 'Проверено в React');
const colors = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(colors, XLSX.utils.aoa_to_sheet([[
  { v: 1, t: 'n', s: { fill: {} } },
  { v: 'Theme zero', t: 's', s: { font: { color: { theme: 0, tint: 0.2 } }, fill: { patternType: 'solid', fgColor: { theme: 0 } } } },
]]), 'Colors');
const colorBytes = XLSX.write(colors, { type: 'array', bookType: 'xlsx' });
const colorSheet = XLSX.read(new Uint8Array(colorBytes), { type: 'array', cellStyles: true }).Sheets.Colors;
assert.strictEqual(colorSheet.A1.s.fill.patternType || 'none', 'none', 'An empty fill must not become solid black');
assert.strictEqual(colorSheet.B1.s.font.color.theme, 0);
assert.strictEqual(colorSheet.B1.s.font.color.tint, 0.2);
assert.strictEqual(colorSheet.B1.s.fill.fgColor.theme, 0);
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'style-xlsx-browser-styles-'));
fs.writeFileSync(path.join(directory, 'book1-edited.xlsx'), new Uint8Array(output));
console.log('Browser array input/output preserves styled blanks and font family/scheme: passed');
