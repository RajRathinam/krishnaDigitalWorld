// Mock data for frontend-only development
export const mockDashboardStats = {
    totalUsers: 1250,
    totalOrders: 847,
    totalRevenue: 125000,
    orderedCustomers: 623,
    nonOrderedCustomers: 627,
    todayBirthdays: 3,
    pendingOrders: 12,
    lowStockProducts: 5,
};
export const mockUsers = [
    {
        id: '1',
        name: 'John Doe',
        phone: '+91 9876543210',
        email: 'john@example.com',
        role: 'user',
        createdAt: '2024-01-15T10:30:00Z',
        dob: '1990-01-01',
        address: '123 Main St, Mumbai, MH 400001',
        hasOrdered: true,
    },
    {
        id: '2',
        name: 'Jane Smith',
        phone: '+91 9876543211',
        email: 'jane@example.com',
        role: 'user',
        createdAt: '2024-02-20T14:45:00Z',
        dob: '1995-06-15',
        address: '456 Park Ave, Delhi, DL 110001',
        hasOrdered: true,
    },
    {
        id: '3',
        name: 'Mike Wilson',
        phone: '+91 9876543212',
        email: 'mike@example.com',
        role: 'user',
        createdAt: '2024-03-10T09:15:00Z',
        dob: '1988-12-25',
        hasOrdered: false,
    },
    {
        id: '4',
        name: 'Sarah Johnson',
        phone: '+91 9876543213',
        email: 'sarah@example.com',
        role: 'user',
        createdAt: '2024-03-25T11:00:00Z',
        dob: new Date().toISOString().split('T')[0], // Today's birthday
        address: '789 Oak Lane, Bangalore, KA 560001',
        hasOrdered: true,
    },
    {
        id: '5',
        name: 'Admin User',
        phone: '+91 9876543214',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
        hasOrdered: false,
    },
];
// Product mocks removed — using backend APIs for production data
export const mockProducts = [];
export const mockOrders = [
    {
        id: 'ORD-001',
        userId: '1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+91 9876543210',
        customerDob: '1990-01-01',
        address: '123 Main St, Mumbai, MH 400001',
        mapLocation: { lat: 19.076, lng: 72.8777 },
        products: [
            { productId: 'P001', productName: 'Classic Cotton T-Shirt', colorName: 'Red', quantity: 2, price: 999 },
            { productId: 'P004', productName: 'Leather Wallet', colorName: 'Brown', quantity: 1, price: 1299 },
        ],
        totalValue: 3297,
        orderStatus: 'delivered',
        trackingId: 'TRK123456',
        isCancelled: false,
        isShipped: true,
        createdAt: '2024-03-10T15:30:00Z',
        updatedAt: '2024-03-15T10:00:00Z',
    },
    {
        id: 'ORD-002',
        userId: '2',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        customerPhone: '+91 9876543211',
        customerDob: '1995-06-15',
        address: '456 Park Ave, Delhi, DL 110001',
        mapLocation: { lat: 28.6139, lng: 77.209 },
        products: [
            { productId: 'P002', productName: 'Denim Jeans Premium', colorName: 'Dark Blue', quantity: 1, price: 2499 },
        ],
        totalValue: 2499,
        orderStatus: 'shipped',
        trackingId: 'TRK789012',
        isCancelled: false,
        isShipped: true,
        createdAt: '2024-03-18T09:45:00Z',
        updatedAt: '2024-03-20T14:30:00Z',
    },
    {
        id: 'ORD-003',
        userId: '4',
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah@example.com',
        customerPhone: '+91 9876543213',
        customerDob: new Date().toISOString().split('T')[0],
        address: '789 Oak Lane, Bangalore, KA 560001',
        mapLocation: { lat: 12.9716, lng: 77.5946 },
        products: [
            { productId: 'P001', productName: 'Classic Cotton T-Shirt', colorName: 'Blue', quantity: 3, price: 999 },
        ],
        totalValue: 2997,
        orderStatus: 'pending',
        isCancelled: false,
        isShipped: false,
        createdAt: '2024-03-22T11:00:00Z',
        updatedAt: '2024-03-22T11:00:00Z',
    },
    {
        id: 'ORD-004',
        userId: '1',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '+91 9876543210',
        customerDob: '1990-01-01',
        address: '123 Main St, Mumbai, MH 400001',
        products: [
            { productId: 'P003', productName: 'Summer Floral Dress', colorName: 'Pink', quantity: 1, price: 1899 },
        ],
        totalValue: 1899,
        orderStatus: 'cancelled',
        isCancelled: true,
        isShipped: false,
        createdAt: '2024-03-05T16:20:00Z',
        updatedAt: '2024-03-06T09:00:00Z',
    },
];
// Helper function to get today's birthdays
export const getTodayBirthdays = () => {
    const today = new Date().toISOString().split('T')[0].slice(5); // MM-DD format
    return mockUsers.filter(user => {
        if (!user.dob)
            return false;
        const userBirthday = user.dob.slice(5); // MM-DD format
        return userBirthday === today;
    });
};
