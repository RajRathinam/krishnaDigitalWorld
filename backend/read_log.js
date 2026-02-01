
import fs from 'fs';

try {
    const content = fs.readFileSync('server.log', 'utf8'); // Try utf8 first
    console.log(content);
} catch (e) {
    try {
        const content = fs.readFileSync('server.log', 'ucs2'); // Try utf16
        console.log(content);
    } catch (e2) {
        console.error(e2);
    }
}
