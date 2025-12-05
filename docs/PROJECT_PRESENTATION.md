# 🏨 Royal Elegance Hotel Booking System
## Project Presentation - Development Process

---

# 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Design](#4-database-design)
5. [Key Features](#5-key-features)
6. [User Interface Design](#6-user-interface-design)
7. [Security Implementation](#7-security-implementation)
8. [Development Process](#8-development-process)
9. [Challenges & Solutions](#9-challenges--solutions)
10. [Demo & Screenshots](#10-demo--screenshots)
11. [Future Improvements](#11-future-improvements)
12. [Conclusion](#12-conclusion)

---

# 1. Project Overview

## 🎯 Project Name
**Royal Elegance** - Luxury Hotel Booking System

## 📝 Description
A comprehensive, full-stack hotel management and booking system designed to provide a luxury experience for guests while offering powerful management tools for hotel staff and administrators.

## 🎨 Theme
- **Cultural Identity**: Khmer/Cambodian luxury hospitality
- **Design Philosophy**: Premium, elegant, and user-friendly
- **Target Audience**: Hotel guests, staff, and administrators

## ✨ Project Goals
- Create a seamless booking experience for guests
- Provide efficient management tools for hotel operations
- Implement secure authentication and authorization
- Enable online payments (Stripe & KHQR)
- Build a responsive, modern UI

---

# 2. Technology Stack

## 🖥️ Frontend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React Framework (App Router) | 15.5.2 |
| **React** | UI Library | 18.3.1 |
| **TypeScript** | Type-safe JavaScript | 5.x |
| **Tailwind CSS** | Utility-first CSS | 4.1.17 |
| **Framer Motion** | Animations | 12.23.24 |
| **Radix UI** | Accessible Components | Latest |
| **Lucide React** | Icon Library | 0.454.0 |

## 🗄️ Backend & Database

| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend as a Service (BaaS) |
| **PostgreSQL** | Relational Database |
| **Row Level Security (RLS)** | Database Security |
| **Supabase Auth** | Authentication |

## 💳 Payment Integration

| Technology | Purpose |
|------------|---------|
| **Stripe** | International Payments |
| **KHQR** | Local Cambodian Payments |

## 🛠️ Development Tools

| Tool | Purpose |
|------|---------|
| **Git/GitHub** | Version Control |
| **VS Code** | IDE |
| **Vercel** | Deployment Platform |
| **ESLint** | Code Linting |
| **PostCSS** | CSS Processing |

---

# 3. System Architecture

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Guest     │  │   Staff     │  │   Admin     │              │
│  │   Portal    │  │  Dashboard  │  │  Dashboard  │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APPLICATION                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    App Router                            │    │
│  │  /              → Landing Page                          │    │
│  │  /home          → User Dashboard                        │    │
│  │  /rooms         → Room Browsing                         │    │
│  │  /services      → Hotel Services                        │    │
│  │  /bookings      → User Bookings                         │    │
│  │  /admin/*       → Admin Panel                           │    │
│  │  /staff/*       → Staff Portal                          │    │
│  │  /api/*         → API Routes                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Components Layer                       │    │
│  │  • UI Components (59+ reusable components)              │    │
│  │  • Layout Components (Navbar, Footer, Sidebar)          │    │
│  │  • Feature Components (Booking, Payment, Auth)          │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Auth      │  │  Database   │  │   Storage   │              │
│  │  Service    │  │ PostgreSQL  │  │   (Files)   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Row Level Security (RLS)                    │    │
│  │  • 50+ Security Policies                                │    │
│  │  • Role-based Access Control                            │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

```
User Action → React Component → API Route/Supabase Client → 
Database → RLS Check → Response → UI Update
```

---

# 4. Database Design

## 📊 Database Statistics

| Metric | Count |
|--------|-------|
| **Tables** | 18 |
| **Views** | 5 |
| **Functions** | 12 |
| **Triggers** | 9 |
| **RLS Policies** | 50+ |
| **Lines of SQL** | 1,200+ |

## 🗄️ Core Tables

### User Management
```
┌─────────────────────────────────────┐
│              PROFILES               │
├─────────────────────────────────────┤
│ id (UUID, PK)                       │
│ email (text)                        │
│ full_name (text)                    │
│ role (admin/staff/user)             │
│ avatar_url (text)                   │
│ phone (text)                        │
│ phone_verified (boolean)            │
│ created_at (timestamp)              │
│ last_login_at (timestamp)           │
└─────────────────────────────────────┘
```

### Room Management
```
┌─────────────────────────────────────┐
│              ROOM_TYPES             │
├─────────────────────────────────────┤
│ id (UUID, PK)                       │
│ name (text)                         │
│ slug (text, unique)                 │
│ description (text)                  │
│ base_price (decimal)                │
│ max_occupancy (int)                 │
│ amenities (JSONB)                   │
│ images (text[])                     │
│ thumbnail_url (text)                │
│ tags (text[])                       │
│ is_active (boolean)                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│               ROOMS                 │
├─────────────────────────────────────┤
│ id (UUID, PK)                       │
│ room_number (text)                  │
│ room_type_id (FK → room_types)      │
│ floor_id (FK → floors)              │
│ status (available/occupied/...)     │
│ last_cleaned (timestamp)            │
│ next_maintenance (timestamp)        │
└─────────────────────────────────────┘
```

### Booking System
```
┌─────────────────────────────────────┐
│              BOOKINGS               │
├─────────────────────────────────────┤
│ id (UUID, PK)                       │
│ user_id (FK → profiles)             │
│ room_id (FK → rooms)                │
│ check_in_date (date)                │
│ check_out_date (date)               │
│ status (pending/confirmed/...)      │
│ total_amount (decimal)              │
│ payment_status (paid/pending/...)   │
│ payment_method (stripe/khqr/cash)   │
│ special_requests (text)             │
│ created_at (timestamp)              │
└─────────────────────────────────────┘
```

## 🔐 Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Admin** | Full CRUD on all tables, manage users, view analytics |
| **Staff** | Manage bookings, rooms, check-ins/check-outs |
| **User** | View rooms, make bookings, manage own profile |
| **Guest** | Browse rooms and services (read-only) |

---

# 5. Key Features

## 👤 User Features

### 🔐 Authentication System
- ✅ Email & Password Login
- ✅ Social OAuth (Google, Facebook)
- ✅ Phone OTP Verification
- ✅ Password Reset
- ✅ Email Verification
- ✅ Session Management

### 🛏️ Room Booking
- ✅ Browse Available Rooms
- ✅ Filter by Type, Price, Amenities
- ✅ Date Selection Calendar
- ✅ Real-time Availability Check
- ✅ Instant Booking Confirmation
- ✅ Booking History

### 🛎️ Hotel Services
- ✅ Spa & Wellness
- ✅ Dining & Restaurant
- ✅ Transportation
- ✅ Concierge Services
- ✅ Service Booking

### 💳 Payment System
- ✅ Stripe Integration (Credit/Debit)
- ✅ KHQR (Cambodian QR Payment)
- ✅ Cash Payment Option
- ✅ Secure Payment Processing
- ✅ Payment History & Receipts

## 👨‍💼 Admin Features

### 📊 Dashboard
- ✅ Booking Statistics
- ✅ Revenue Analytics
- ✅ Occupancy Reports
- ✅ User Management

### 🏠 Room Management
- ✅ CRUD Room Types
- ✅ CRUD Individual Rooms
- ✅ Floor Management
- ✅ Availability Calendar
- ✅ Pricing Management

### 🛎️ Service Management
- ✅ CRUD Services
- ✅ Service Categories
- ✅ Pricing & Duration

### 📋 Booking Management
- ✅ View All Bookings
- ✅ Approve/Reject Bookings
- ✅ Check-in/Check-out
- ✅ Cancellation Handling

## 👷 Staff Features

- ✅ Daily Task Dashboard
- ✅ Room Status Management
- ✅ Guest Check-in/Check-out
- ✅ Housekeeping Logs
- ✅ Booking Updates

---

# 6. User Interface Design

## 🎨 Design System

### Color Palette
```css
/* Primary Colors */
--gold:          #d4af37    /* Luxury Gold */
--gold-light:    #f3e5b5    /* Accent Gold */
--slate-dark:    #1e293b    /* Dark Background */
--slate-light:   #f8fafc    /* Light Background */

/* Semantic Colors */
--success:       #22c55e    /* Green */
--warning:       #f59e0b    /* Amber */
--error:         #ef4444    /* Red */
--info:          #3b82f6    /* Blue */
```

### Typography
- **Headings**: Serif font (elegant, luxury feel)
- **Body**: Sans-serif (clean, readable)
- **Accent**: Italic serif (special highlights)

### Components (59+ Reusable)
- Buttons, Cards, Dialogs
- Forms, Inputs, Selects
- Navigation, Tabs, Accordions
- Tables, Charts, Calendars
- Toasts, Alerts, Loading States

## 📱 Responsive Design

| Breakpoint | Target |
|------------|--------|
| `sm` (640px) | Mobile Phones |
| `md` (768px) | Tablets |
| `lg` (1024px) | Laptops |
| `xl` (1280px) | Desktops |
| `2xl` (1536px) | Large Monitors |

## ✨ Animations

Using **Framer Motion** for:
- Page Transitions
- Scroll-based Animations
- Hover Effects
- Loading States
- Micro-interactions

---

# 7. Security Implementation

## 🔒 Authentication Security

```
┌─────────────────────────────────────────────┐
│           AUTHENTICATION FLOW               │
├─────────────────────────────────────────────┤
│ 1. User submits credentials                 │
│ 2. Supabase Auth validates                  │
│ 3. JWT token generated                      │
│ 4. Session stored (HttpOnly cookie)         │
│ 5. Client receives auth state               │
└─────────────────────────────────────────────┘
```

## 🛡️ Row Level Security (RLS)

Every database operation is filtered by security policies:

```sql
-- Example: Users can only see their own bookings
CREATE POLICY "Users view own bookings" ON bookings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can see all bookings
CREATE POLICY "Admins view all" ON bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
```

## 🔐 Security Measures

| Measure | Implementation |
|---------|----------------|
| **Authentication** | Supabase Auth with JWT |
| **Authorization** | Role-based RLS Policies |
| **Data Validation** | Zod Schema Validation |
| **XSS Prevention** | React's built-in escaping |
| **CSRF Protection** | Supabase session tokens |
| **Secure Headers** | Next.js security headers |
| **API Protection** | Admin-only endpoints |
| **Input Sanitization** | Form validation |

---

# 8. Development Process

## 📅 Development Timeline

### Phase 1: Planning & Setup (Week 1-2)
- ✅ Requirements gathering
- ✅ Technology selection
- ✅ Database schema design
- ✅ Project structure setup
- ✅ Environment configuration

### Phase 2: Core Development (Week 3-6)
- ✅ Authentication system
- ✅ User profile management
- ✅ Room listing & details
- ✅ Booking system
- ✅ Admin dashboard

### Phase 3: Features & Integration (Week 7-10)
- ✅ Payment integration (Stripe)
- ✅ KHQR payment support
- ✅ Service booking
- ✅ Staff dashboard
- ✅ Email notifications

### Phase 4: Polish & Deployment (Week 11-12)
- ✅ UI/UX refinements
- ✅ Bug fixes
- ✅ Performance optimization
- ✅ Security audit
- ✅ Vercel deployment

## 🔄 Development Methodology

### Agile Approach
- Iterative development
- Regular feature releases
- Continuous improvement
- User feedback integration

### Code Quality Practices
- TypeScript for type safety
- ESLint for code standards
- Component-based architecture
- Reusable utility functions
- Clear file organization

## 📁 Project Structure

```
ite_hotel/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin pages
│   ├── api/               # API routes
│   ├── auth/              # Auth pages
│   ├── bookings/          # Booking pages
│   ├── home/              # User dashboard
│   ├── payment/           # Payment pages
│   ├── profile/           # User profile
│   ├── rooms/             # Room pages
│   ├── services/          # Service pages
│   └── staff/             # Staff pages
├── components/             # React components
│   ├── admin/             # Admin components
│   ├── auth/              # Auth components
│   ├── booking/           # Booking components
│   ├── landing/           # Landing page
│   ├── layout/            # Layout components
│   ├── payment/           # Payment components
│   ├── ui/                # UI components (59+)
│   └── user/              # User components
├── database/               # SQL schemas
├── docs/                   # Documentation
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities & configs
├── public/                 # Static assets
├── scripts/                # Dev scripts
├── styles/                 # Global styles
├── types/                  # TypeScript types
└── utils/                  # Utility functions
```

---

# 9. Challenges & Solutions

## 🚧 Challenge 1: Hydration Mismatch Errors

**Problem**: React hydration errors causing UI inconsistencies

**Solution**:
- Removed `typeof window !== 'undefined'` checks from useEffect
- Used proper client/server component separation
- Fixed random values in SSR

## 🔐 Challenge 2: Database Security

**Problem**: Ensuring data isolation between users

**Solution**:
- Implemented comprehensive RLS policies
- Created role-based access control
- Added 50+ security policies

## 💳 Challenge 3: Payment Integration

**Problem**: Supporting both international and local payments

**Solution**:
- Integrated Stripe for credit/debit cards
- Added KHQR for Cambodian users
- Built unified payment flow

## 🎨 Challenge 4: Responsive Design

**Problem**: Consistent experience across all devices

**Solution**:
- Mobile-first approach with Tailwind CSS
- Responsive breakpoints (5 sizes)
- Adaptive components

## ⚡ Challenge 5: Performance

**Problem**: Fast loading and smooth interactions

**Solution**:
- Next.js App Router with Server Components
- Image optimization with Sharp
- Code splitting and lazy loading
- Framer Motion for smooth animations

---

# 10. Demo & Screenshots

## 🏠 Landing Page
- Hero section with video background
- Luxury Khmer-inspired design
- Smooth scroll animations
- Call-to-action buttons

## 🛏️ Rooms Page
- Grid/List view toggle
- Filtering by type and price
- Room details with gallery
- Instant booking

## 📅 Booking Flow
1. Select room type
2. Choose dates
3. Enter guest details
4. Select payment method
5. Complete payment
6. Receive confirmation

## 👨‍💼 Admin Dashboard
- Statistics overview
- Room management
- Booking management
- User management

## 💳 Payment Page
- Stripe card payment
- KHQR code generation
- Payment confirmation
- Receipt generation

---

# 11. Future Improvements

## 🚀 Planned Features

| Feature | Priority | Status |
|---------|----------|--------|
| Mobile App (React Native) | High | Planned |
| Multi-language Support | High | Planned |
| Advanced Analytics | Medium | Planned |
| AI Chatbot Support | Medium | Planned |
| Loyalty Program | Low | Planned |
| Integration with OTAs | Low | Planned |

## 🔧 Technical Improvements

- [ ] Unit & Integration Testing
- [ ] E2E Testing with Playwright
- [ ] CI/CD Pipeline
- [ ] Performance Monitoring
- [ ] Error Tracking (Sentry)
- [ ] SEO Optimization

---

# 12. Conclusion

## 📊 Project Summary

| Aspect | Details |
|--------|---------|
| **Project Type** | Full-Stack Web Application |
| **Technology** | Next.js 15, React 18, Supabase |
| **Database** | PostgreSQL with RLS |
| **Components** | 59+ Reusable UI Components |
| **Security** | 50+ RLS Policies |
| **Deployment** | Vercel |

## ✅ Key Achievements

1. **Complete Hotel Booking System** with user, staff, and admin portals
2. **Secure Authentication** with multiple providers
3. **Payment Integration** supporting Stripe and KHQR
4. **Beautiful UI** with luxury Khmer-inspired design
5. **Production Ready** with comprehensive error handling

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **Supabase** for the backend infrastructure
- **Radix UI** for accessible components
- **Vercel** for deployment platform

---

# 📎 Appendix

## 🔗 Links

- **Repository**: github.com/sakkol-git/royal-elegance
- **Live Demo**: [Deployed on Vercel]
- **Documentation**: /docs folder

## 📚 References

- Next.js Documentation: nextjs.org/docs
- Supabase Documentation: supabase.com/docs
- Tailwind CSS: tailwindcss.com
- Framer Motion: framer.com/motion

---

## 🎓 Thank You!

### Questions?

**Project**: Royal Elegance Hotel Booking System  
**Developer**: [Your Name]  
**Date**: December 2025

---

*This presentation was created for academic purposes to demonstrate the development process of a full-stack hotel booking application.*
