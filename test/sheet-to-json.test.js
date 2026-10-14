const assert = require('assert');
const { XLSX: load } = require('./helpers');
const XLSX = load();
const style = { font: { bold: true } };
const ws = XLSX.utils.aoa_to_sheet([
  ['Product', 'Amount'],
  [{ v: 'Product A', t: 's', s: style }, 100],
]);
const expected = [{ Product: 'Product A', Amount: 100 }];
assert.deepStrictEqual(XLSX.utils.sheet_to_json(ws), expected);
assert.deepStrictEqual(XLSX.utils.sheet_to_json(ws, undefined), expected);
assert.deepStrictEqual(XLSX.utils.sheet_to_json(ws, null), expected);
assert.deepStrictEqual(XLSX.utils.sheet_to_json(ws, {}), expected);
assert.deepStrictEqual(XLSX.utils.sheet_to_json(ws, { getCellStyles: false }), expected);
const styled = XLSX.utils.sheet_to_json(ws, { getCellStyles: true });
assert.deepStrictEqual(styled.out, expected);
assert.deepStrictEqual(styled.styles, [[style, {}]]);
assert.strictEqual(styled.styles[0][0], style);
const array = XLSX.utils.sheet_to_json(ws, { header: 1, getCellStyles: true });
assert.deepStrictEqual(array.out, [['Product', 'Amount'], ['Product A', 100]]);
assert.deepStrictEqual(array.styles, [[{}, {}], [style, {}]]);
assert.deepStrictEqual(XLSX.utils.sheet_to_json({}, { getCellStyles: true }), []);
console.log('sheet_to_json optional options and unchanged style results: passed');
