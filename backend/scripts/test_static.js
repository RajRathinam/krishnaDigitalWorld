import http from 'http';

const filename = '1769329140751_IMG_2107.jpg'; // One of the files confirmed to exist
const url = `http://localhost:5000/uploads/${filename}`;

console.log(`Testing URL: ${url}`);

http.get(url, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Content-Type: ${res.headers['content-type']}`);
    console.log(`Content-Length: ${res.headers['content-length']}`);

    if (res.statusCode === 200) {
        console.log('✅ File is accessible');
    } else {
        console.log('❌ File is NOT accessible');
    }
    res.resume();
}).on('error', (e) => {
    console.error(`❌ Connection error: ${e.message}`);
});
