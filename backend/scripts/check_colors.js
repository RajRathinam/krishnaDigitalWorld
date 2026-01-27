import 'dotenv/config';
import { sequelize } from '../models/index.js';
import { Product } from '../models/index.js';

const checkColors = async () => {
    try {
        await sequelize.authenticate();

        // Fetch product 25 specifically (or recent ones)
        const products = await Product.findAll({
            limit: 5,
            order: [['updated_at', 'DESC']],
            attributes: ['id', 'name', 'colorsAndImages', 'updated_at'],
            raw: true
        });

        console.log('Recent Products Colors Data Analysis:');
        products.forEach(p => {
            console.log(`\n--------------------------------------------------`);
            console.log(`Product ID: ${p.id} (${p.name})`);

            const raw = p.colorsAndImages;
            console.log('Raw Type:', typeof raw);

            if (typeof raw === 'string') {
                console.log('Raw Value (first 100 char):', raw.substring(0, 100));

                try {
                    const parsed1 = JSON.parse(raw);
                    console.log('Parsed Once Type:', typeof parsed1);

                    if (typeof parsed1 === 'string') {
                        console.log('🚨 ALARM: Parsed Once is STILL A STRING! This indicates DOUBLE ENCODING.');
                        console.log('Parsed Once Value (first 100 char):', parsed1.substring(0, 100));

                        try {
                            const parsed2 = JSON.parse(parsed1);
                            console.log('Parsed Twice Type:', typeof parsed2);
                            console.log('Parsed Twice Value Keys:', Object.keys(parsed2));
                        } catch (e) {
                            console.log('Failed to parse second time.');
                        }
                    } else {
                        console.log('Parsed Once Value Keys:', Object.keys(parsed1));

                        if (Array.isArray(parsed1)) {
                            console.log('Note: Parsed value is an ARRAY.');
                        } else {
                            console.log('Note: Parsed value is an OBJECT.');
                        }
                    }
                } catch (e) {
                    console.log('Failed to parse first time:', e.message);
                }
            } else {
                console.log('Raw Value is NOT a string. It is:', raw);
            }
        });
        process.exit(0);
    } catch (error) {
        console.error('ERROR:', error);
        process.exit(1);
    }
};

checkColors();
