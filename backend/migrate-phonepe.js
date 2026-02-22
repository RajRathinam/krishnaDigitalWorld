// migrate-phonepe.js — run once to add PhonePe columns to the orders table
// Usage: node migrate-phonepe.js

import sequelize from './config/database.js';

const migrate = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        const queries = [
            `ALTER TABLE orders ADD COLUMN merchantOrderId VARCHAR(120) NULL`,
            `ALTER TABLE orders ADD UNIQUE INDEX uq_merchant_order_id (merchantOrderId)`,
            `ALTER TABLE orders ADD COLUMN phonePeTransactionId VARCHAR(120) NULL`,
            `ALTER TABLE orders ADD COLUMN phonePeResponse JSON NULL`,
        ];

        for (const q of queries) {
            try {
                await sequelize.query(q);
                console.log('✅', q.substring(0, 70));
            } catch (e) {
                const code = e.original?.code || e.parent?.code;
                // ER_DUP_FIELDNAME = column already exists, ER_DUP_KEYNAME = index already exists — safe to skip
                if (['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME'].includes(code)) {
                    console.log('⏭️  Already exists, skipping:', q.substring(0, 70));
                } else {
                    throw e;
                }
            }
        }

        console.log('\n🎉 Migration complete! Orders table now has PhonePe columns.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
};

migrate();
