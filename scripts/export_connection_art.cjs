const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const temporary = path.join(root, 'out');
const destination = path.join(root, 'public/assets/artwork/connection-rebuilt');
fs.mkdirSync(temporary, {recursive: true});
fs.mkdirSync(destination, {recursive: true});
const source = fs.readFileSync(path.join(root, 'src/art/ConnectionArt.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022}});
const moduleFile = path.join(temporary, 'connection-art-export.cjs');
fs.writeFileSync(moduleFile, compiled.outputText);
const art = require(moduleFile);
const entries = [
  ['mira-standing', 'MiraStanding', '-180 -650 400 710', 480, 852, {frame: 140}],
  ['mira-seated', 'MiraSeated', '-150 -440 420 750', 504, 900, {frame: 360, attention: 1, reply: .5}],
  ['sol-profile', 'SolSeated', '-310 -440 470 750', 564, 900, {frame: 360, gesture: .7}],
  ['sol-rear', 'SolBack', '-250 -450 550 800', 660, 960, {frame: 540}],
  ['terrace', 'Terrace', '0 0 1920 1080', 1920, 1080, {}],
  ['night-street', 'NightStreet', '0 0 1920 1080', 1920, 1080, {}],
];
for (const [name, component, viewBox, width, height, props] of entries) {
  const svg = React.createElement('svg', {xmlns: 'http://www.w3.org/2000/svg', width, height, viewBox},
    React.createElement(art.ArtDefinitions), React.createElement(art[component], props));
  fs.writeFileSync(path.join(destination, `${name}.svg`), renderToStaticMarkup(svg));
}
console.log(`Saved ${entries.length} original SVG assets in public/assets/artwork/connection-rebuilt.`);
