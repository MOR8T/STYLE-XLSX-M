const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { python } = require('./helpers');
const directory = process.env.PACKAGE_TEST_DIR;
assert(directory, 'Run through npm test so the examples use the installed tarball');
const readme = fs.readFileSync(path.join(process.env.XLSX_PACKAGE, 'README.md'), 'utf8');
const blocks = [...readme.matchAll(/```(?:js|javascript)\s*\n([\s\S]*?)```/g)].map(match => match[1]);
assert.strictEqual(blocks.length, 6, 'Every JS example must have a verification case');
fs.copyFileSync(path.join(__dirname, 'fixtures', 'book1.xlsx'), path.join(directory, 'Book1.xlsx'));
const prefixes = ['', '', "const XLSX = require('style-xlsx-m');\nconst ws = XLSX.readFile('demo.xlsx', { cellStyles: true }).Sheets.demo;\n", '',
  "const XLSX = require('style-xlsx-m');\nconst wb = XLSX.utils.book_new();\nconst ws = XLSX.utils.aoa_to_sheet([['Product A']]);\nXLSX.utils.book_append_sheet(wb, ws, 'demo');\n"];
const suffixes = ['', '', "\nrequire('assert').deepStrictEqual(out[0], ['line\\nbreak', 'Courier: 24', 'fill: color', 'bold & color']);\nrequire('assert').strictEqual(styles[0][0].alignment.wrapText, true);\nrequire('assert').strictEqual(styles[0][2].fill.fgColor.rgb, 'E9E9E9');\nrequire('assert').strictEqual(styles[0].length, 4);\n",
  "\nconst XLSX = require('style-xlsx-m');\nconst wb = XLSX.utils.book_new();\nconst ws = XLSX.utils.aoa_to_sheet([[{v: 'Product A', t: 's', s: style}]]);\nXLSX.utils.book_append_sheet(wb, ws, 'demo');\nXLSX.writeFile(wb, 'reference.xlsx');\n",
  "\nXLSX.writeFile(wb, 'page-setup.xlsx');\n"];
prefixes.splice(3, 0, "import fs from 'node:fs';\nglobalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => { const data = fs.readFileSync('Book1.xlsx'); return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength); } });\n");
suffixes.splice(3, 0, "\nawait editTemplateInBrowser();\n");
for (let i = 0; i < blocks.length; i++) {
  const file = path.join(directory, `readme-example-${i + 1}.${i === 3 ? 'mjs' : 'js'}`);
  fs.writeFileSync(file, prefixes[i] + blocks[i] + suffixes[i]);
  execFileSync(process.execPath, [file], { cwd: directory, stdio: 'inherit' });
  console.log(`README JavaScript example ${i + 1}: passed`);
}
console.log(python('examples', directory).trim());
