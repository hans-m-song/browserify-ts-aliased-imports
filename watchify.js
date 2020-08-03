const fs = require('fs');
const watchify = require('watchify');
const {configureBrowserify} = require('./browserify');

const [entrypoint, destination] = process.argv.slice(2);

if (!entrypoint || !destination) {
  console.log('usage: $0 entrypoint destination');
  process.exit(1);
}

const update = (ids) => {
  console.log('updated', ids);
  b.bundle().on('error', console.error).pipe(fs.createWriteStream(destination));
};

const b = configureBrowserify()
  .plugin(watchify, {
    delay: 1000,
    ignoreWatch: ['**/node_modules/**', '**/dist/**'],
  })
  .add(entrypoint)
  .on('update', update);

update();
