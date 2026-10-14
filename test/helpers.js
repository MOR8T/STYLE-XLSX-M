const { execFileSync } = require('child_process');
const path = require('path');
const python = process.env.PYTHON || 'python3';
exports.python = (action, file) => execFileSync(python, [path.join(__dirname, 'workbook.py'), action, file], { encoding: 'utf8' });
exports.XLSX = () => require(process.env.XLSX_PACKAGE || '..');
