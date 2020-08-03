const fs = require('fs');
const path = require('path');
const browserify = require('browserify');
const pathmodify = require('pathmodify');
const tsify = require('tsify');

const getPathMaps = () => {
  const tsconfig = fs
    .readFileSync('./tsconfig.json')
    .toString()
    .replace(/(\s+\/\/.*\n)|(\/\*.*\*\/)/g, '');

  const {baseUrl, paths} = JSON.parse(tsconfig).compilerOptions;

  return Object.entries(paths).map(([alias, paths]) => ({
    alias: new RegExp(alias),
    path: path.join(baseUrl, paths[0].replace(/\/\*/, '')),
  }));
};

const configureBrowserify = () => {
  const paths = getPathMaps();

  const mods = [
    ({id, opts}) => {
      if (id[0] !== '@') {
        return;
      }

      const matchedMap = paths.find(({alias}) => alias.test(id));

      if (!matchedMap) {
        return;
      }

      const module = path.join(
        __dirname,
        matchedMap.path,
        `${path.basename(id)}.ts`,
      );

      const relative = path.join(
        path.relative(path.dirname(opts.filename), module),
      );

      return {id: relative};
    },
  ];

  return browserify().plugin(pathmodify, {mods}).plugin(tsify);
};

const compile = (src, dest) => {
  const b = configureBrowserify();
  const stream = fs.createWriteStream(dest);

  if (require.main === module) {
    b.on('err', (err) => console.error);
  }

  b.add(src).bundle().pipe(stream);

  stream.on('finish', () => console.log('compiled', src, '->', dest));
};

module.exports = {configureBrowserify};

if (require.main === module) {
  const [entrypoint, destination] = process.argv.slice(2);
  if (!entrypoint || !destination) {
    console.log('usage: $0 entrypoint destination');
    process.exit(1);
  }

  compile(entrypoint, destination);
}
