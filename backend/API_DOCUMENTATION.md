# Krishna Stores Backend API Documentation

## Base URL
```
"http://localhost:5000/api"
```

## Authentication
Most endpoints require authentication via JWT token. Include the token in the request header:
```
Authorization: Bearer <token>
```

---

## Table of Contents
1. [Authentication](#authentication-endpoints)
2. [Users](#user-endpoints)
3. [Products](#product-endpoints)
4. [Cart](#cart-endpoints)
5. [Orders](#order-endpoints)
6. [Reviews](#review-endpoints)
7. [Coupons](#coupon-endpoints)
8. [Categories](#category-endpoints)
9. [Brands](#brand-endpoints)

10. [Admin](#admin-endpoints)

---

## Authentication Endpoints

### Register
**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com" // optional
}
```

**Note:** Registration is passwordless. OTP verification is required to complete registration.

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your phone",
  "data": {
    "phone": "+1234567890"
  }
}
```

### Verify OTP
**POST** `/api/auth/verify-otp`

Verify OTP during registration or login.

**Request Body:**
```json
{
  "phone": "+1234567890",
  "otp": "123456",
  "purpose": "register" // or "login", "reset"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "name": "John Doe",
      "phone": "+1234567890",
      "role": "customer"
    }
  }
}
```

### Login
**POST** `/api/auth/login`

Initiate login process. Login is passwordless and uses OTP verification.

**Request Body:**
```json
{
  "phone": "+1234567890"
}
```

**Note:** No password required. OTP will be sent to the phone number for verification.

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to your phone"
}
```

### Verify Login
**POST** `/api/auth/verify-login`

Verify OTP for login.

**Request Body:**
```json
{
  "phone": "+1234567890",
  "otp": "123456",
  "purpose": "login"
}
```

### Resend OTP
**POST** `/api/auth/resend-otp`

Resend OTP to user's phone.

**Request Body:**
```json
{
  "phone": "+1234567890",
  "purpose": "register" // or "login", "reset"
}
```

### Get Current User
**GET** `/api/auth/me`

Get authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

### Update Profile
**PUT** `/api/auth/me`

Update authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "newemail@example.com",
  "dateOfBirth": "1990-01-01",
  "address": {
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "zipCode": "12345",
    "country": "Country"
  }
}
```

### Logout
**POST** `/api/auth/logout`

Logout current user.

**Headers:** `Authorization: Bearer <token>`

---

## Product Endpoints

### Get All Products
**GET** `/api/products`

Get paginated list of products with filters.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `categoryId` - Filter by category
- `brandId` - Filter by brand
- `categoryId` or `categorySlug` - Filter by category (id or slug)
- `subcategoryId` or `subcategorySlug` - Filter by subcategory (id or slug)
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `search` - Search in name, code, description, SKU, variant
- `sortBy` - Sort field (name, price, rating, created_at, etc.)
- `sortOrder` - asc or desc
- `availability` - true/false
- `isFeatured` - true/false

Note: The response includes `filters.computedMinPrice` and `filters.computedMaxPrice` which indicate available price range for the current filtered dataset (useful to build dynamic price sliders).

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 200,
      "itemsPerPage": 20
    }
  }
}
```

### Get Single Product
**GET** `/api/products/:identifier`

Get product by ID or slug.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "code": "PROD001",
    "name": "Product Name",
    "slug": "product-slug",
    "price": 1000.00,
    "discountPrice": 800.00,
    "stock": {
      "Red": 10,
      "Blue": 5
    },
    "colorsAndImages": {
      "Red": [
        {
          "url": "https://...",
          "publicId": "...",
          "type": "main",
          "alt": "Red image"
        }
      ]
    },
    "category": {...},
    "brand": {...}
  }
}
```

### Get Products by Category
**GET** `/api/products/category/:categorySlug`

Get products in a specific category.

### Get Featured Products
**GET** `/api/products/featured`

Get featured products.

### Get Related Products
**GET** `/api/products/:id/related`

Get related products (same category and brand).

### Create Product
**POST** `/api/products`

Create a new product. Requires authentication and admin/seller role.

**Headers:** `Authorization: Bearer <token>`

**Request Body (multipart/form-data):**
```
code: "PROD001" (required, unique)
name: "Product Name" (required)
variant: "Color Variant" (optional)
description: "Product description" (optional)
brandId: 1 (required)
categoryId: 1 (required)
modelCode: "M123" (required if `modelId` not provided)
modelName: "Model Name" (required if `modelId` not provided)
modelId: 1 (optional - use an existing model to infer code and name)
price: 1000.00 (required)
discountPrice: 800.00 (optional)
tax: 5.00 (optional, default: 0)
stock: {"Red": 10, "Blue": 5} (JSON string or object, per color)
sku: "SKU-001" (required, unique)
colorsAndImages: {"Red": [], "Blue": []} (JSON string or object, required)
attributes: {} (optional, JSON)
isFeatured: true/false (optional, default: false)
metaTitle: "SEO Title" (optional)
metaDescription: "SEO Description" (optional)
keywords: ["keyword1", "keyword2"] (optional, JSON array)
fileColorMapping: {"Red": [0, 1], "Blue": [2, 3]} (optional, JSON string)
colorName: "Red" (optional, if all files belong to one color)
images: [files] (multipart files)
```

**Note:** 
- `code` field is required and must be unique
- Stock is stored per color as JSON: `{"Red": 10, "Blue": 5}`
- Products support multiple colors with multiple images per color
- Color model has been removed; colors are now managed via `colorsAndImages` field

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {...}
}
```

### Update Product
**PUT** `/api/products/:id`

Update a product. Requires authentication and ownership/admin role.

**Headers:** `Authorization: Bearer <token>`

**Request Body:** Same as create, all fields optional.

### Delete Product
**DELETE** `/api/products/:id`

Delete or deactivate a product.

**Query Parameters:**
- `hardDelete` - true for permanent deletion (default: false, soft delete)

### Update Product Stock
**PUT** `/api/products/:id/stock`

Update product stock.

**Request Body:**
```json
{
  "stock": {"Red": 15, "Blue": 8}, // JSON object
  "colorName": "Red", // optional, for single color update
  "operation": "set" // "set", "increment", "decrement"
}
```

---

## Cart Endpoints

### Get Cart
**GET** `/api/cart`

Get user's cart.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "items": [
      {
        "productId": 1,
        "quantity": 2,
        "colorName": "Red",
        "price": 1000.00,
        "addedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "totalAmount": 2000.00
  }
}
```

### Add to Cart
**POST** `/api/cart/items`

Add item to cart. For products with multiple colors, `colorName` is required.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 2,
  "colorName": "Red" // Required if product has multiple colors
}
```

**Response (if color required but not provided):**
```json
{
  "success": false,
  "message": "Color selection is required for this product",
  "availableColors": ["Red", "Blue", "Black"]
}
```

### Update Cart Item
**PUT** `/api/cart/items/:productId`

Update cart item quantity.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "quantity": 3
}
```

### Remove from Cart
**DELETE** `/api/cart/items/:productId`

Remove item from cart.

**Headers:** `Authorization: Bearer <token>`

### Clear Cart
**DELETE** `/api/cart`

Clear all items from cart.

**Headers:** `Authorization: Bearer <token>`

### Get Cart Count
**GET** `/api/cart/count`

Get total item count in cart.

**Headers:** `Authorization: Bearer <token>`

---

## Order Endpoints

### Create Order
**POST** `/api/orders`

Create order from cart.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "shippingAddress": {
    "street": "123 Main St",
    "city": "City",
    "state": "State",
    "zipCode": "12345",
    "country": "Country"
  },
  "billingAddress": {...}, // optional
  "paymentMethod": "cod", // "cod", "card", "upi", "emi"
  "emiTenure": 6, // required if paymentMethod is "emi"
  "couponCode": "DISCOUNT10", // optional
  "notes": "Delivery instructions" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": 1,
    "orderNumber": "ORD1234567890",
    "orderItems": [...],
    "totalPrice": 2000.00,
    "finalAmount": 1800.00,
    "emiPayment": {...} // if EMI payment
  }
}
```

### Get My Orders
**GET** `/api/orders`

Get authenticated user's orders.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `status` - Filter by order status

### Get Order Details
**GET** `/api/orders/:id`

Get order details.

**Headers:** `Authorization: Bearer <token>`

### Cancel Order
**PUT** `/api/orders/:id/cancel`

Cancel an order.

**Headers:** `Authorization: Bearer <token>`

---

## Review Endpoints

### Get Product Reviews
**GET** `/api/reviews/product/:productId`

Get reviews for a product.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)

### Create Review
**POST** `/api/reviews`

Create a product review.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "productId": 1,
  "rating": 5,
  "comment": "Great product!"
}
```

### Update Review
**PUT** `/api/reviews/:id`

Update own review.

**Headers:** `Authorization: Bearer <token>`

### Delete Review
**DELETE** `/api/reviews/:id`

Delete own review.

**Headers:** `Authorization: Bearer <token>`

---

## Coupon Endpoints

### Validate Coupon
**POST** `/api/coupons/validate`

Validate coupon for cart.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "code": "DISCOUNT10",
  "cartTotal": 1000.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "discountAmount": 100.00,
    "finalAmount": 900.00
  }
}
```

### Get My Coupons
**GET** `/api/coupons/my-coupons`

Get user's available coupons.

**Headers:** `Authorization: Bearer <token>`

### Admin: Get All Coupons
**GET** `/api/coupons/admin`

Get all coupons (admin only).

**Headers:** `Authorization: Bearer <token>`

### Admin: Create Coupon
**POST** `/api/coupons/admin`

Create a new coupon (admin only).

**Request Body:**
```json
{
  "code": "DISCOUNT10",
  "discountType": "percentage", // or "fixed"
  "discountValue": 10,
  "validFrom": "2024-01-01",
  "validUntil": "2024-12-31",
  "usageLimit": 100,
  "minOrderAmount": 500.00,
  "maxDiscount": 500.00
}
```

### Admin: Update Coupon
**PUT** `/api/coupons/admin/:id`

Update coupon (admin only).

### Admin: Toggle Coupon Status
**PUT** `/api/coupons/admin/:id/status`

Toggle coupon active status (admin only).

### Admin: Delete Coupon
**DELETE** `/api/coupons/admin/:id`

Delete coupon (admin only).

---

## Category Endpoints

### Get All Categories
**GET** `/api/categories`

Get all categories. Returns top-level categories with a `subcategories` array for each top-level category. Example response:

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Electronics", "slug": "electronics", "subcategories": [ { "id": 5, "name": "TVs", "slug": "tvs" } ] }
  ]
}
```

### Get Category
**GET** `/api/categories/:id`

Get category by ID or slug.

### Admin: Create Category
**POST** `/api/categories`

Create category (admin only).

**Headers:** `Authorization: Bearer <token>`

### Admin: Update Category
**PUT** `/api/categories/:id`

Update category (admin only).

### Admin: Delete Category
**DELETE** `/api/categories/:id`

Delete category (admin only).

---

## Brand Endpoints

### Get All Brands
**GET** `/api/brands`

Get all brands.

### Get Brand
**GET** `/api/brands/:id`

Get brand by ID or slug.

### Admin: Create Brand
**POST** `/api/brands`

Create brand (admin only).

### Admin: Update Brand
**PUT** `/api/brands/:id`

Update brand (admin only).

### Admin: Delete Brand
**DELETE** `/api/brands/:id`

Delete brand (admin only).

---


**GET** `/api/admin/emi/payments`

Get all EMI payments (admin only).

**Query Parameters:**
- `page`, `limit`, `status`, `userId`

### Admin: Get Pending Installments
**GET** `/api/admin/emi/installments/pending`

Get pending installments (admin only).

### Admin: Get Overdue Installments
**GET** `/api/admin/emi/installments/overdue`

Get overdue installments (admin only).

### Admin: Mark Installment as Paid
**PUT** `/api/admin/emi/installments/:id/mark-paid`

Mark installment as paid (admin only).

**Request Body:**
```json
{
  "paymentMethod": "cod",
  "transactionId": "TXN123",
  "paidDate": "2024-01-15",
  "notes": "Payment received"
}
```

### Admin: Send Installment Reminder
**POST** `/api/admin/emi/installments/:id/send-reminder`

Send reminder for installment (admin only).

### Admin: Get EMI Statistics
**GET** `/api/admin/emi/stats`

Get EMI statistics (admin only).

---

## Admin Endpoints

### Get Dashboard Stats
**GET** `/api/admin/dashboard`

Get admin dashboard statistics.

**Headers:** `Authorization: Bearer <token>` (admin only)

### Get All Users
**GET** `/api/admin/users`

Get all users (admin only).

**Query Parameters:**
- `page`, `limit`, `role`, `search`

### Get User Details
**GET** `/api/admin/users/:id`

Get user details (admin only).

### Update User
**PUT** `/api/admin/users/:id`

Update user (admin only).

### Delete User
**DELETE** `/api/admin/users/:id`

Delete user (admin only).

### Admin: Get All Orders
**GET** `/api/admin/orders`

Get all orders (admin only).

**Query Parameters:**
- `page`, `limit`, `status`, `userId`

### Admin: Update Order Status
**PUT** `/api/admin/orders/:id/status`

Update order status (admin only).

**Request Body:**
```json
{
  "orderStatus": "shipped",
  "trackingId": "TRK123456"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [...] // optional, for validation errors
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Notes

1. All dates should be in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)
2. Prices are in decimal format (e.g., 1000.00)
3. Stock is stored as JSON object per color: `{"Red": 10, "Blue": 5}`
4. Product images are stored in `colorsAndImages` JSON structure
5. File uploads use `multipart/form-data` content type
6. Rate limiting is applied in production environment
7. JWT tokens expire after 7 days (configurable)
8. **Color Selection**: For products with multiple colors, `colorName` is required when adding to cart
9. **Stock Management**: Stock is automatically deducted when order is created and restored when order is cancelled
10. **Product Code**: All products must have a unique `code` field
11. **Color Model Removed**: The separate Color model has been removed. Colors are now managed through the `colorsAndImages` field in products
12. **Passwordless Authentication**: The system uses OTP-based authentication. No passwords are required for registration or login. Users register with name and phone, then verify via OTP. Login requires only phone number and OTP verification.

---

## Rate Limiting

In production environment, rate limiting is enabled:
- General API: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes per IP
- OTP endpoints: 3 requests per 15 minutes per IP

