# Home Page Components

This directory contains all components specifically designed for the home page (Index.jsx).

## Component Overview

### 1. **HeroSlider** (`HeroSlider.jsx`)
- **Purpose**: Main hero banner with rotating slides showcasing featured products/categories
- **Features**:
  - Auto-rotating carousel with manual navigation
  - Responsive design (mobile-first)
  - Call-to-action buttons
  - Slide indicators
  - Background images with overlays
- **Props**: None (uses internal data)
- **Usage**: `<HeroSlider />`

### 2. **CategoryGrid** (`CategoryGrid.jsx`)
- **Purpose**: Display product categories in a grid layout
- **Features**:
  - Fetches categories from API
  - Responsive grid (2 cols mobile, 4 cols desktop)
  - Hover effects and animations
  - Links to category product listings
- **Props**: None (fetches data internally)
- **Usage**: `<CategoryGrid />`

### 3. **DealOfTheDay** (`DealOfTheDay.jsx`)
- **Purpose**: Showcase time-limited deals and featured products
- **Features**:
  - Countdown timer display
  - Featured products grid
  - Special pricing highlights
  - Link to all deals page
- **Props**: None
- **Usage**: `<DealOfTheDay />`

### 4. **BestSellers** (`BestSellers.jsx`)
- **Purpose**: Display best-selling products
- **Features**:
  - Gallery layout for products
  - Trending indicator
  - Product cards with ratings
- **Props**: None
- **Usage**: `<BestSellers />`

### 5. **PromoBanners** (`PromoBanners.jsx`)
- **Purpose**: Display promotional banners and marketing campaigns
- **Features**:
  - Multiple banner layouts
  - Call-to-action buttons
  - Responsive images
- **Props**: None
- **Usage**: `<PromoBanners />`

### 6. **ProductShowcase** (`ProductShowcase.jsx`)
- **Purpose**: Showcase featured/recommended products
- **Features**:
  - Horizontal scroll on mobile
  - Grid layout on desktop
  - Product cards with add-to-cart
  - Swipe indicators
- **Props**: None
- **Usage**: `<ProductShowcase />`

### 7. **TrustBadges** (`TrustBadges.jsx`)
- **Purpose**: Display trust indicators and guarantees
- **Features**:
  - Social proof elements
  - Guarantee badges
  - Customer satisfaction metrics
- **Props**: None
- **Usage**: `<TrustBadges />`

### 8. **BrandShowcase** (`BrandShowcase.jsx`)
- **Purpose**: Display featured brands
- **Features**:
  - Brand logos grid
  - Brand filtering
  - Links to brand products
- **Props**: None
- **Usage**: `<BrandShowcase />`

### 9. **BundleOffers** (`BundleOffers.jsx`)
- **Purpose**: Display bundle/combo offers
- **Features**:
  - Special pricing for bundles
  - Product combinations
  - Savings highlights
- **Props**: None
- **Usage**: `<BundleOffers />`

### 10. **FeaturedProjects** (`FeaturedProjects.jsx`)
- **Purpose**: Showcase customer projects/installations
- **Features**:
  - Image galleries
  - Project descriptions
  - Before/after comparisons
- **Props**: None
- **Usage**: `<FeaturedProjects />`

### 11. **SignupDialog** (`SignupDialog.jsx`)
- **Purpose**: User signup/registration modal
- **Features**:
  - OTP-based authentication
  - Phone number input
  - Auto-triggered on first visit
- **Props**: 
  - `open`: boolean - Controls dialog visibility
  - `onOpenChange`: function - Callback for open state changes
- **Usage**: `<SignupDialog open={showSignup} onOpenChange={handleChange} />`

## Component Structure

```
home/
├── HeroSlider.jsx          # Main hero banner
├── CategoryGrid.jsx        # Category browsing grid
├── DealOfTheDay.jsx       # Time-limited deals
├── BestSellers.jsx        # Best-selling products
├── PromoBanners.jsx       # Promotional banners
├── ProductShowcase.jsx    # Featured products
├── TrustBadges.jsx        # Trust indicators
├── BrandShowcase.jsx      # Featured brands
├── BundleOffers.jsx       # Bundle deals
├── FeaturedProjects.jsx   # Customer projects
├── SignupDialog.jsx       # Signup modal
├── index.js               # Component exports
└── README.md              # This file
```

## Usage Example

```jsx
import {
  HeroSlider,
  CategoryGrid,
  DealOfTheDay,
  BestSellers,
  ProductShowcase
} from '@/components/home';

// Or import individually
import { HeroSlider } from '@/components/home/HeroSlider';
```

## Design Principles

1. **Mobile-First**: All components are designed mobile-first with responsive breakpoints
2. **Performance**: Lazy loading images, code splitting where possible
3. **Accessibility**: ARIA labels, keyboard navigation, semantic HTML
4. **Consistency**: Shared design tokens, consistent spacing, unified animations
5. **Reusability**: Components can be used on other pages if needed

## Animation

Components use AOS (Animate On Scroll) for entrance animations:
- Fade-up animations with staggered delays
- Disabled on mobile for performance
- Smooth transitions and hover effects

## Data Fetching

Most components fetch their own data:
- Use React Query or direct API calls
- Handle loading and error states
- Show skeletons during loading
- Graceful error handling

## Styling

- Tailwind CSS for styling
- Consistent spacing using Tailwind scale
- Dark mode support where applicable
- Custom animations and transitions

