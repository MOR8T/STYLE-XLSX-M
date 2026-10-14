const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { python, XLSX: load } = require('./helpers');
const XLSX = load();
const fixture = path.join(__dirname, 'fixtures', 'styled-template.xlsx');
if (!fs.existsSync(fixture)) python('generate', fixture);
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'style-xlsx-roundtrip-'));
const wb = XLSX.readFile(fixture, { cellStyles: true });
const ws = wb.Sheets.Template;
const memory = JSON.parse(JSON.stringify(ws));
ws.A1.v = 'Product A edited';
const output = path.join(directory, 'roundtrip.xlsx');
XLSX.writeFile(wb, output);
const original = JSON.parse(python('inspect', fixture));
const saved = JSON.parse(python('inspect', output));
const rows = Object.entries(original).filter(([key]) => key !== 'A1.value').map(([property, value]) => {
  let exposed;
  if (/^[A-Z][0-9]\./.test(property)) {
    const [cell, ...parts] = property.split('.');
    exposed = parts.reduce((object, key) => object && object[key], memory[cell].s);
    if (parts[parts.length - 1] === 'fgColor' && exposed && !Object.keys(exposed).length) exposed = undefined;
  }
  return { property, presentInS: exposed !== undefined && exposed !== null,
    preserved: JSON.stringify(value) === JSON.stringify(saved[property]), original: value, saved: saved[property] };
});
const result = { rows, memory, output };
fs.writeFileSync(path.join(directory, 'results.json'), JSON.stringify(result, null, 2));
if (process.env.RESULTS_FILE) fs.writeFileSync(process.env.RESULTS_FILE, JSON.stringify(result, null, 2));
console.table(rows.map(({property, presentInS, preserved}) => ({property, presentInS, preserved})));
assert.strictEqual(saved['A1.value'], 'Product A edited');
if (!process.env.BASELINE) {
  const limitations = ['C1.fill.fgColor', 'A1.border.bottom.color'];
  for (const row of rows) assert.strictEqual(row.preserved, !limitations.includes(row.property), `${row.property}: unexpected round-trip result`);
  assert.strictEqual(saved['A1.border.bottom.color'].value, 'FF0000');
  assert.strictEqual(saved['A1.border.bottom.color'].type, 'rgb');
  assert.strictEqual(memory.B1.s.fill.fgColor.theme, 4);
  assert.strictEqual(memory.B1.s.fill.fgColor.tint, 0.4);
  assert.strictEqual(memory.A1.s.border.top.color.theme, 4);
  assert.strictEqual(memory.A1.s.border.top.color.tint, 0.2);
  assert.deepStrictEqual(memory.A1.s.fill, { patternType: 'solid', fgColor: { rgb: '12AB34' } });
  assert.strictEqual(memory.A1.s.border.left.color.rgb, '123456');
  const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'read-styles.json'), 'utf8'));
  for (const cell of Object.keys(expected)) assert.deepStrictEqual(memory[cell].s, expected[cell], `${cell}: in-memory style changed`);
  const withFormats = XLSX.readFile(fixture, {cellStyles: true, cellNF: true}).Sheets.Template;
  assert.strictEqual(withFormats.A2.z, '#,##0.00');
  assert.strictEqual(withFormats.B2.z, 'yyyy-mm-dd');
  assert.strictEqual(typeof memory['!pageSetup'], 'string');
  assert.deepStrictEqual(XLSX.utils.sheet_to_json({ '!ref': 'A1:A2', A1: {t: 's', v: 'Product'}, A2: {t: 's', v: 'Product A'} }, {}), [{Product: 'Product A'}]);
  assert.throws(() => XLSX.utils.sheet_to_json(ws), /getCellStyles/);
  assert.deepStrictEqual(XLSX.utils.sheet_to_json({}, { getCellStyles: true }), []);
}
console.log('Round-trip output and in-memory snapshot:', directory);
