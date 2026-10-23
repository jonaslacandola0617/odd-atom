// Export the original neutral character to an editable, self-contained SVG.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src/characters/Ember.tsx'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022}});
fs.mkdirSync(path.join(root, 'out'), {recursive: true});
const tmp = path.join(root, 'out/ember-export.cjs');
fs.writeFileSync(tmp, compiled.outputText);
const {Ember} = require(tmp);
const svg = renderToStaticMarkup(React.createElement(Ember, {frame: 0, openness: .55, id: 'ember-original'}));
fs.mkdirSync(path.join(root, 'public/assets/characters'), {recursive: true});
fs.writeFileSync(path.join(root, 'public/assets/characters/ember.svg'), svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
console.log('Exported original Ember character SVG.');
