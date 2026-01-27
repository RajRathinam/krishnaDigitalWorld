import http from 'http';

const url = 'http://localhost:5000/api/products?limit=1';

console.log(`Fetching: ${url}`);

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const products = json.data.products;
            if (products && products.length > 0) {
                const p = products[0];
                console.log('Product:', p.name);
                console.log('colorsAndImages Type:', typeof p.colorsAndImages);
                console.log('colorsAndImages Value:', JSON.stringify(p.colorsAndImages, null, 2));

                if (typeof p.colorsAndImages === 'string') {
                    console.log('Use JSON.parse?');
                    try {
                        console.log('Parsed:', JSON.parse(p.colorsAndImages));
                    } catch (e) { console.log('Parse failed'); }
                }
            }
        } catch (e) {
            console.error('Error parsing response:', e);
        }
    });
}).on('error', (e) => {
    console.error(`Error: ${e.message}`);
});
