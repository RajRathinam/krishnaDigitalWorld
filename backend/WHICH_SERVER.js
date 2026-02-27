import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- DIAGNOSTIC START ---');
console.log('Absolute path of this script:', __filename);
console.log('Current Working Directory (process.cwd()):', process.cwd());

const servicePath = path.join(__dirname, 'services', 'phonePeService.js');
if (fs.existsSync(servicePath)) {
    console.log('Found phonePeService.js at:', servicePath);
    const content = fs.readFileSync(servicePath, 'utf8');
    const firstLine = content.split('\n')[0];
    const versionMatch = content.match(/Version ([\d.]+)/);
    console.log('First line:', firstLine);
    console.log('Detected Version:', versionMatch ? versionMatch[1] : 'Unknown');
} else {
    console.log('phonePeService.js NOT FOUND at:', servicePath);
}
console.log('--- DIAGNOSTIC END ---');
process.exit(0);
