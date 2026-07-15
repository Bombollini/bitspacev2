
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WIRE_FRAMES_DIR = path.join(__dirname, 'docs', 'wireframes');

async function fixSvgFiles() {
  console.log('Finding SVG files...');
  const svgFiles = await glob('*.svg', { cwd: WIRE_FRAMES_DIR, absolute: true });
  
  for (const file of svgFiles) {
    console.log(`Fixing: ${path.basename(file)}`);
    let content = fs.readFileSync(file, 'utf8');
    // Replace & with &amp;
    content = content.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, '&amp;');
    fs.writeFileSync(file, content, 'utf8');
  }
  
  console.log('All SVG files fixed!');
}

fixSvgFiles();
