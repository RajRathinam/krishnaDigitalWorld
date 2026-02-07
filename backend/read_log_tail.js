
import fs from 'fs';

try {
    const content = fs.readFileSync('server.log', 'utf8');
    const lines = content.split('\n');
    console.log(lines.slice(-50).join('\n'));
} catch (e) {
    console.error(e);
}
