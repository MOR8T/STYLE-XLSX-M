const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'style-xlsx-package-'));
const cache = process.env.npm_config_cache || path.join(os.tmpdir(), 'style-xlsx-npm-cache');
function npm(args, cwd) {
  return execFileSync('npm', [...args, '--cache', cache, '--fetch-retries=0'], {cwd, encoding: 'utf8'});
}
const [pack] = JSON.parse(npm(['pack', '--json', '--pack-destination', directory], root));
assert(!pack.files.some(file => /(?:node_modules|test\/|\.map$|REPORT\.md)/.test(file.path)), 'Unexpected release files');
fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({name: 'synthetic-package-check', private: true}));
const webpackVersion = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).devDependencies.webpack;
npm(['install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund', `webpack@${webpackVersion}`, path.join(directory, pack.filename)], directory);
const packagePath = path.join(directory, 'node_modules', 'style-xlsx-m');
assert(!fs.lstatSync(packagePath).isSymbolicLink(), 'Must install the tarball, not a folder link');
const metadata = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8'));
for (const entry of ['main', 'module', 'unpkg', 'jsdelivr']) {
  assert.strictEqual(typeof require(path.resolve(packagePath, metadata[entry])).writeFile, 'function', `${entry}: runtime entry cannot load`);
}
assert(fs.existsSync(path.resolve(packagePath, metadata.types)), 'Types entry is missing');
const env = {...process.env, XLSX_PACKAGE: packagePath, PACKAGE_TEST_DIR: directory};
for (const test of ['strict-mode.test.js', 'browser-styles.test.js', 'sheet-to-json.test.js', 'roundtrip.test.js', 'readme-examples.test.js', 'bundler.test.js']) {
  execFileSync(process.execPath, [path.join(__dirname, test)], {cwd: root, env, stdio: 'inherit'});
}
console.log(`Installed tarball verified: ${pack.filename}; ${pack.entryCount} files; ${pack.unpackedSize} unpacked bytes`);
console.log(`Test outputs retained in ${directory}`);
