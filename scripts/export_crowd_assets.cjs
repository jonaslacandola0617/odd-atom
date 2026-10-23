const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'out');
fs.mkdirSync(output, {recursive: true});
function load(relative, name) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022}});
  const file = path.join(output, `${name}.cjs`);
  fs.writeFileSync(file, compiled.outputText);
  return require(file);
}
const {Citizen, MIRA, SOL} = load('src/characters/Citizen.tsx', 'citizen-export');
const {StreetArt, CafeArt} = load('src/art/City.tsx', 'city-export');
const characters = path.join(root, 'public/assets/characters');
const sets = path.join(root, 'public/assets/sets');
fs.mkdirSync(characters, {recursive: true});
fs.mkdirSync(sets, {recursive: true});
for (const [name, colors, variant] of [['mira', MIRA, 'sweep'], ['sol', SOL, 'curls']]) {
  const svg = React.createElement('svg', {xmlns: 'http://www.w3.org/2000/svg', width: 480, height: 640, viewBox: '-180 -430 360 480'}, React.createElement(Citizen, {id: name, frame: 20, colors, variant, attention: .5, mood: .5}));
  fs.writeFileSync(path.join(characters, `${name}.svg`), renderToStaticMarkup(svg));
}
for (const [name, Component] of [['street', StreetArt], ['cafe', CafeArt]]) {
  const svg = React.createElement('svg', {xmlns: 'http://www.w3.org/2000/svg', width: 1920, height: 1080, viewBox: '0 0 1920 1080'}, React.createElement(Component));
  fs.writeFileSync(path.join(sets, `${name}.svg`), renderToStaticMarkup(svg));
}
console.log('Exported original Mira, Sol, street, and cafe SVG assets.');
