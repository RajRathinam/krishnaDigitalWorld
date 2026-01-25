# E-Commerce Frontend Structure

This document outlines the organized folder structure for the e-commerce frontend application.

## 📁 Folder Structure

```
frontend/
├── src/
│   ├── index.jsx                 # Main export file for all components
│   ├── main.jsx                  # React entry point
│   ├── App.jsx                   # Main app component with routing
│   ├── index.css                 # Global styles
│   │
│   ├── components/               # Reusable UI components
│   │   ├── auth/                 # Authentication components
│   │   │   └── CustomerGuard.jsx
│   │   │
│   │   ├── layout/               # Layout components
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── MobileBottomNav.jsx
│   │   │
│   │   ├── home/                 # Home page specific components
│   │   │   ├── HeroSlider.jsx
│   │   │   ├── CategoryGrid.jsx
│   │   │   ├── DealOfTheDay.jsx
│   │   │   ├── BestSellers.jsx
│   │   │   ├── PromoBanners.jsx
│   │   │   ├── ProductShowcase.jsx
│   │   │   ├── TrustBadges.jsx
│   │   │   ├── BrandShowcase.jsx
│   │   │   ├── BundleOffers.jsx
│   │   │   ├── FeaturedProjects.jsx
│   │   │   └── SignupDialog.jsx
│   │   │
│   │   ├── product/              # Product-related components
│   │   │   ├── ProductCard.jsx
│   │   │   └── FloatingContactButtons.jsx
│   │   │
│   │   ├── cart/                 # Shopping cart components (to be added)
│   │   │   ├── CartItem.jsx
│   │   │   ├── CartSummary.jsx
│   │   │   └── EmptyCart.jsx
│   │   │
│   │   ├── checkout/             # Checkout components (to be added)
│   │   │   ├── CheckoutForm.jsx
│   │   │   ├── PaymentMethod.jsx
│   │   │   └── OrderSummary.jsx
│   │   │
│   │   ├── account/              # User account components (to be added)
│   │   │   ├── ProfileForm.jsx
│   │   │   ├── OrderHistory.jsx
│   │   │   └── AddressBook.jsx
│   │   │
│   │   ├── contentPages/         # Static content pages
│   │   │   ├── Careers.jsx
│   │   │   ├── Contact.jsx
│   │   │   ├── HelpSupport.jsx
│   │   │   ├── InstallationSupport.jsx
│   │   │   ├── OurPromise.jsx
│   │   │   ├── PrivacyPolicy.jsx
│   │   │   ├── RefundPolicy.jsx
│   │   │   ├── ReturnPolicy.jsx
│   │   │   ├── ShippingPolicy.jsx
│   │   │   ├── TermsConditions.jsx
│   │   │   └── WarrantyInfo.jsx
│   │   │
│   │   ├── ui/                   # Reusable UI primitives (shadcn/ui)
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── input.jsx
│   │   │   ├── dialog.jsx
│   │   │   └── ... (other UI components)
│   │   │
│   │   ├── ScrollToTop.jsx       # Utility components
│   │   └── NavLink.jsx
│   │
│   ├── pages/                    # Page components (routes)
│   │   ├── Index.jsx             # Home page
│   │   ├── ProductListing.jsx    # Product listing page
│   │   ├── ProductDetail.jsx     # Product detail page
│   │   ├── Cart.jsx              # Shopping cart page
│   │   ├── Checkout.jsx          # Checkout page
│   │   ├── Account.jsx           # User account page
│   │   ├── Help.jsx              # Help page
│   │   ├── NotFound.jsx          # 404 page
│   │   ├── TodaysDeals.jsx       # Deals page
│   │   ├── NewArrivals.jsx       # New arrivals page
│   │   ├── BestSellers.jsx       # Best sellers page
│   │   └── AboutUs.jsx           # About us page
│   │
│   ├── contexts/                 # React contexts
│   │   ├── AuthContext.jsx       # Authentication context
│   │   └── CartContext.jsx       # Shopping cart context
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-media-query.jsx
│   │   ├── use-mobile.jsx
│   │   └── use-toast.js
│   │
│   ├── services/                 # API services
│   │   ├── api.js                # API client
│   │   └── mockData.jsx          # Mock data for development
│   │
│   ├── lib/                      # Utility libraries
│   │   ├── api.js                # API utilities
│   │   └── utils.js              # General utilities
│   │
│   ├── config/                   # Configuration files
│   │   └── baseUrl.js            # API base URL
│   │
│   └── data/                     # Static data
│       └── products.js            # Product data
│
├── public/                       # Static assets
│   ├── SK_Logo.png
│   ├── sk.png
│   └── vite.svg
│
├── index.html                    # HTML entry point
├── package.json                  # Dependencies
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── postcss.config.js            # PostCSS configuration
```

## 🎯 Component Organization Principles

### 1. **Feature-Based Organization**
Components are organized by feature/domain:
- `home/` - Home page specific components
- `product/` - Product-related components
- `cart/` - Shopping cart components
- `checkout/` - Checkout flow components
- `account/` - User account components

### 2. **Reusability**
- `ui/` - Highly reusable UI primitives (shadcn/ui components)
- `layout/` - Layout components used across pages
- `components/` root - Shared utility components

### 3. **Separation of Concerns**
- `pages/` - Full page components (routes)
- `components/` - Reusable components
- `contexts/` - State management
- `services/` - API calls
- `hooks/` - Custom hooks

## 📦 Usage Example

### Using the index.jsx exports:

```jsx
// Instead of:
import { Header } from '@/components/layout/Header';
import { ProductCard } from '@/components/product/ProductCard';
import { useAuth } from '@/contexts/AuthContext';

// You can use:
import { Header, ProductCard, useAuth } from '@/index';
```

### Or continue using direct imports (recommended for tree-shaking):

```jsx
import { Header } from '@/components/layout/Header';
import { ProductCard } from '@/components/product/ProductCard';
```

## 🚀 Adding New Components

When adding new components:

1. **Feature Components**: Add to the appropriate feature folder (`product/`, `cart/`, etc.)
2. **UI Components**: Add to `ui/` if it's a reusable primitive
3. **Layout Components**: Add to `layout/` if it's a layout element
4. **Export**: Add export to `index.jsx` if it's commonly used

## 📝 Best Practices

1. **Component Naming**: Use PascalCase for component files
2. **Folder Structure**: Keep related components together
3. **Imports**: Use `@/` alias for cleaner imports
4. **Exports**: Export from `index.jsx` for commonly used components
5. **Type Safety**: Consider adding TypeScript in the future

## 🔄 Future Enhancements

Consider adding:
- `components/cart/` - Cart-specific components
- `components/checkout/` - Checkout flow components
- `components/account/` - Account management components
- `components/filters/` - Product filtering components
- `components/reviews/` - Product review components
- `components/wishlist/` - Wishlist components

