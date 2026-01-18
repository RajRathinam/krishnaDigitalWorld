import { Order, Product, User, sequelize } from './models/index.js';

const test = async () => {
    try {
        await sequelize.authenticate();
        console.log('DB Connected');
    } catch (e) {
        console.error('DB Connection Failed:', e.message);
        process.exit(1);
    }

    try {
        console.log("Testing Recent Orders (with created_at)...");
        await Order.findAll({
            limit: 5,
            order: [['created_at', 'DESC']],
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
        });
        console.log("Recent Orders (created_at) OK");
    } catch (e) {
        console.error("Recent Orders (created_at) Failed:", e.message);
    }

    try {
        console.log("Testing Recent Orders (with createdAt)...");
        await Order.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
        });
        console.log("Recent Orders (createdAt) OK");
    } catch (e) {
        console.error("Recent Orders (createdAt) Failed:", e.message);
    }

    try {
        console.log("Testing Popular Products...");
        await Product.findAll({
            where: { isActive: true },
            limit: 5,
            order: [['totalReviews', 'DESC'], ['rating', 'DESC']],
            attributes: ['id', 'name', 'price', 'rating', 'totalReviews', 'colorsAndImages']
        });
        console.log("Popular Products OK");
    } catch (e) {
        console.error("Popular Products Failed:", e.message);
    }
    process.exit();
};

test();
