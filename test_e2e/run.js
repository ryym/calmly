const path = require('path');
const { build } = require('calmly/server');

const args = process.argv.slice(2);
if (args.length === 0) {
  throw new Error('specify target sample directory');
}

const cwd = path.isAbsolute(args[0]) ? args[0] : path.join(__dirname, 'samples', args[0]);
build({ cwd });
