const assert = require('assert');
const { execFileSync } = require('child_process');
const { XLSX: load } = require('./helpers');
const XLSX = load();
const python = process.env.PYTHON || 'python3';
const fill = { patternType: 'solid', fgColor: { rgb: 'FFAA00' } };

// Every XML part must be well-formed; prints the worksheet and styles XML as JSON.
const inspect = `
import sys, zipfile, io, json
from xml.dom.minidom import parseString
z = zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()))
for name in z.namelist():
    if name.endswith('.xml') or name.endswith('.rels'):
        parseString(z.read(name))
print(json.dumps({'sheet': z.read('xl/worksheets/sheet1.xml').decode(), 'styles': z.read('xl/styles.xml').decode()}))
`;
function write(cells) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, { '!ref': 'A1:D1', ...cells }, 'S');
  const bytes = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  const parts = JSON.parse(execFileSync(python, ['-I', '-c', inspect], { input: bytes, encoding: 'utf8' }));
  return { ...parts, sheet: parts.sheet, workbook: XLSX.read(bytes, { type: 'buffer', cellStyles: true, sheetStubs: true }).Sheets.S };
}

// Cells that carry only a style must stay blank instead of becoming <v>undefined</v>.
const blank = write({ A1: { s: { fill } }, B1: { t: 'n', v: null, s: { fill } }, C1: { t: 'z', s: { fill } } });
assert(!/<v>(?:undefined|null)<\/v>/.test(blank.sheet), 'Blank styled cells must not write undefined/null values');
for (const ref of ['A1', 'B1', 'C1']) {
  assert(new RegExp(`<c r="${ref}" s="\\d+"></c>`).test(blank.sheet), `${ref}: expected an empty styled cell`);
  assert.strictEqual(blank.workbook[ref].s.fill.fgColor.rgb, 'FFAA00', `${ref}: style must survive`);
  assert.strictEqual(blank.workbook[ref].v, undefined, `${ref}: must remain blank`);
}

// Font values and number formats with XML metacharacters must still produce a readable styles.xml.
const name = 'A&B<C>"D"';
const escaped = write({
  A1: { t: 's', v: 'x', s: { font: { name, scheme: '<x/>&', family: '2" injected="1' } } },
  B1: { t: 'n', v: 1, z: '0.0 "R&D"' },
});
assert(!/<scheme val="[^"]*[<>]/.test(escaped.styles), 'Unescaped markup in scheme');
assert(/&amp;/.test(escaped.styles) && !/&amp;amp;|&amp;quot;|&amp;lt;/.test(escaped.styles), 'Attribute values must be escaped exactly once');
assert(/formatCode="0\.0 &quot;R&amp;D&quot;"/.test(escaped.styles), 'Number format must be escaped once, not twice');
assert(escaped.styles.includes('<name val="A&amp;B&lt;C&gt;&quot;D&quot;"/>'), 'Font name must be escaped in styles.xml');
// The reader keeps XML entities in font names as-is; a second write must not escape them again.
const again = write({ A1: escaped.workbook.A1, B1: escaped.workbook.B1 });
assert(again.styles.includes('<name val="A&amp;B&lt;C&gt;&quot;D&quot;"/>'), 'Re-writing a read workbook must not double-escape');
console.log('Writer produces well-formed XML for blank styled cells and special characters: passed');
