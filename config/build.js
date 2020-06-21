const { list, tree, normalize, title } = require('./files');
const path = require('path');
const fs = require('fs').promises;
const fse = require('fs-extra');
const showdown  = require('showdown');
const { markdownToTxt } = require('markdown-to-txt');
const converter = new showdown.Converter({ tables: true });

const src = './src/';
const dist = './dist/';
const build = './build/';
const index = './build/index.html';

const treeToPanel = _tree => _tree
  .map(v => v.children.length
      ? `<div class="group"><h2 class="group-header">${title(v.name)}</h2> <div class="group-children">${treeToPanel(v.children)}</div></div>`
      : `<a class="link" href="${normalize(v.path)}">${title(v.name)}</a>`)
  .join('');

const filterVersion = (_tree, version = 'v1.0.0') => _tree.filter(v => v.name === version)[0].children;

(async () => {
  let indexFile = false;
  const arr = list(src);
  const arrFiles = JSON.stringify(arr);
  const header = await fs.readFile(index, 'utf8');
  const panel = treeToPanel(filterVersion(tree(src)));

  await fse.remove(dist);

  // copy parcel build over
  for (const file of list(build)) {
    // const content = await fs.readFile(path.join(build, file), 'utf8');
    // await fse.outputFile(path.join(dist, file), content);

    await fse.copy(path.join(build, file), path.join(dist, file));
  }

  // build markdown
  var i = 0;
  for (const file of arr) {
    const content = await fs.readFile(path.join(src, file), 'utf8');
    const html = header
      .replace("'%%files%%'", arrFiles)
      .replace('"%%files%%"', arrFiles)
      .replace('%%file%%', file)
      .replace('%%nextTitle%%', title(arr[i + 1] || arr[0]))
      .replace('%%next%%', normalize(arr[i + 1] || arr[0]))
      .replace('%%title%%', title(file))
      .replace('%%content%%', converter.makeHtml(content))
      .replace('%%panel%%', panel);
    await fse.outputFile(path.join(dist, normalize(file)), html);
    await fse.outputFile(path.join(dist, normalize(file) + '.md'), markdownToTxt(content));

    if (!indexFile) {
      await fse.outputFile(path.join(dist, 'index.html'), html);
      indexFile = true;
    }
    i++;
  }

})();
