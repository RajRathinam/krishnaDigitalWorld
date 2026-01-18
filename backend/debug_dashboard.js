import fs from 'fs';
import { Order, Product, User, sequelize } from './models/index.js';

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('debug_out.txt', msg + '\n');
};

const debug = async () => {
    try {
        fs.writeFileSync('debug_out.txt', 'Starting Debug\n');
        await sequelize.authenticate();
        log("DB Connected");

        // 1. Check Order Counts by Status
        const orders = await Order.findAll({ attributes: ['orderStatus'] });
        const statusCounts = {};
        orders.forEach(o => {
            const s = o.orderStatus;
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });
        log("Order Status Counts: " + JSON.stringify(statusCounts));

        // 2. Check Recent Orders Query (Pending)
        try {
            const pending = await Order.findAll({
                where: { orderStatus: 'pending' },
                limit: 5,
                include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
            });
            log(`Found ${pending.length} pending orders.`);
        } catch (e) {
            log("Pending Query Failed: " + e.message);
        }

        // 3. Check Order Items for Popularity
        const lastOrder = await Order.findOne({
            order: [['id', 'DESC']],
            attributes: ['id', 'orderItems']
        });
        if (lastOrder) {
            log("Last Order Items Value: " + JSON.stringify(lastOrder.orderItems));
        } else {
            log("No orders found.");
        }

        process.exit();
    } catch (e) {
        log("Fatal: " + e.message);
        process.exit(1);
    }
};

debug();
