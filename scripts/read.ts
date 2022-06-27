'use strict';

import * as fs from 'fs';
import * as path from 'path';

const ROOT_PATH = path.resolve(__dirname, '..');

// read SVG file and reform it to string data
const svg = fs.readFileSync(path.join(ROOT_PATH, 'images', 'hello_world.svg')).toString();
let svgStr: string = '';
for (const d of svg.split('\n')) {
    svgStr += d;
}
svgStr = svgStr.replaceAll("> ", ">");
svgStr = svgStr.replaceAll(" <", "<");

console.log(svgStr);