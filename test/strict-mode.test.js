const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createRequire } = require('module');
const directory = process.env.XLSX_PACKAGE || path.resolve(__dirname, '..');
const filename = path.join(directory, 'xlsx.js');
const moduleObject = { exports: {} };
// ES modules (including Vite production bundles) execute in strict mode.
const context = vm.createContext({
  module: moduleObject, exports: moduleObject.exports,
  require: createRequire(filename), console, Buffer, process,
});
vm.runInContext('"use strict";\n' + fs.readFileSync(filename, 'utf8'), context, { filename });
assert.strictEqual(typeof moduleObject.exports.read, 'function');
assert.strictEqual(typeof moduleObject.exports.write, 'function');
for (const name of ['paperSize', 'scale', 'fitToWidth']) {
  assert.strictEqual(Object.hasOwn(context, name), false, `Leaked global: ${name}`);
}
console.log('Strict-mode import without leaked print-setting globals: passed');
