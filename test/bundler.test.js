const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { python } = require('./helpers');
const directory = process.env.PACKAGE_TEST_DIR;
assert(directory, 'Run through npm test to verify the installed tarball');
const webpack = require(path.join(directory, 'node_modules', 'webpack'));
const packagePath = fs.realpathSync(process.env.XLSX_PACKAGE);
const entry = path.join(directory, 'bundler-example.js');
fs.writeFileSync(entry, `import XLSX from 'style-xlsx-m';
export function editTemplate(input) {
  const wb = typeof input === 'string'
    ? XLSX.readFile(input, { cellStyles: true })
    : XLSX.read(new Uint8Array(input), { type: 'array', cellStyles: true });
  const ws = wb.Sheets.Template;
  const styles = JSON.parse(JSON.stringify(ws.A1.s));
  ws.A1.v = 'Product A edited';
  return { styles, output: XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) };
}
`);
function build(target) {
  return new Promise((resolve, reject) => {
    const compiler = webpack({
      context: directory,
      mode: 'production',
      target,
      entry,
      devtool: false,
      optimization: { minimize: false },
      output: { path: path.join(directory, `webpack-${target}`), filename: 'bundle.js', library: { name: 'StyleExample', type: 'var' } },
      // Default package resolution: no aliases, mainFields override, or polyfills.
    });
    compiler.run((error, stats) => compiler.close(closeError => {
      if (error || closeError) return reject(error || closeError);
      if (stats.hasErrors()) return reject(new Error(stats.toString({all: false, errors: true})));
      const ids = [...stats.compilation.modules].map(module => module.resource);
      assert(ids.includes(path.join(packagePath, 'xlsx.js')), `${target}: style-reading entry missing from bundle`);
      assert(!ids.includes(path.join(packagePath, 'xlsx-js-style', 'dist', 'xlsx.bundle.js')), `${target}: stale module entry selected`);
      resolve(path.join(directory, `webpack-${target}`, 'bundle.js'));
    }));
  });
}
async function main() {
  const fixture = path.join(__dirname, 'fixtures', 'styled-template.xlsx');
  for (const target of ['web', 'node']) {
    const bundle = await build(target);
    const context = vm.createContext(target === 'web' ? {console} : {console, require, Buffer, process});
    vm.runInContext(fs.readFileSync(bundle, 'utf8'), context, {filename: bundle});
    const input = target === 'web' ? [...fs.readFileSync(fixture)] : fixture;
    const result = context.StyleExample.editTemplate(input);
    const styles = JSON.parse(JSON.stringify(result.styles));
    const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'read-styles.json'), 'utf8')).A1;
    assert.deepStrictEqual(styles, expected, `${target}: parsed styles differ from Node main`);
    const output = path.join(directory, `webpack-${target}-edited.xlsx`);
    fs.writeFileSync(output, Buffer.from(result.output));
    const inspected = JSON.parse(python('inspect', output));
    assert.strictEqual(inspected['A1.value'], 'Product A edited');
    assert.strictEqual(inspected['A1.fill.fgColor'].value, '12AB34');
    assert.strictEqual(inspected['A1.border.left.color'].value, '123456');
    assert.strictEqual(inspected['A1.font.bold'], true);
    assert.strictEqual(inspected['pageSetup.orientation'], 'landscape');
    console.log(`webpack ${webpack.version}, target ${target}: imported packed reader and edited styled template successfully`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
