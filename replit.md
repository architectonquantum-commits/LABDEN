# SaaS Dental Laboratory Management System

## Overview

This is a multi-role SaaS application for dental laboratory management that connects dentists, laboratories, and system administrators. The system allows dentists to create work orders for dental laboratories, enables laboratories to manage and track these orders, and provides superadministrators with global oversight and laboratory management capabilities.

The application features role-based dashboards with specialized functionality for each user type: SuperAdmin (manages laboratories and global metrics), Laboratory (processes orders and manages associated dentists), and Doctor (creates orders and tracks their progress). Key features include order management with status tracking, dental odontogram visualization for treatment planning, comprehensive metrics and analytics, and a responsive design built with modern web technologies.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server for fast hot module replacement
- **Tailwind CSS** with custom design system following Material Design principles
- **ShadCN UI** component library for consistent and accessible interface elements
- **TanStack Query** for efficient server state management and caching
- **React Hook Form** with Zod validation for robust form handling
- **Wouter** for lightweight client-side routing

### Backend Architecture
- **Express.js** server with TypeScript for API development
- **RESTful API** design with role-based authentication and authorization
- **JWT token-based authentication** with bcrypt password hashing
- **Memory storage implementation** with interface for future database integration
- **Role-based access control** supporting three user roles: superadmin, laboratorio, and doctor

### Database Design
- **Drizzle ORM** configured for PostgreSQL with type-safe database operations
- **Neon Database** integration for serverless PostgreSQL hosting
- **Comprehensive schema** including users, laboratories, orders, and notifications tables
- **Enums for status management** (user roles, order statuses, user statuses)
- **JSON fields** for flexible data storage (services, odontogram data)

### Authentication & Authorization
- **JWT-based session management** with localStorage token storage
- **Role-based middleware** protecting API endpoints based on user permissions
- **Bcrypt password hashing** for secure credential storage
- **Token validation** with automatic logout on authentication failures

### Design System
- **Custom Tailwind configuration** with dental-specific color palette
- **Professional medical blue theme** (HSL 210 100% 50%) for primary branding
- **Comprehensive spacing system** using Tailwind's spacing primitives
- **Dark/light theme support** with persistent user preferences
- **Responsive grid layouts** optimized for dashboard and form interfaces

### Order Management System
- **Multi-status workflow** (pendiente → iniciada → en_proceso → terminada)
- **Interactive odontogram component** for dental condition visualization using FDI numbering system
- **Service-based pricing** with flexible service selection
- **Progress tracking** with percentage completion and status updates
- **Real-time notifications** for order status changes

### State Management
- **TanStack Query** for server state with automatic caching and background updates
- **Local state management** using React hooks for component-specific state
- **Form state** handled by React Hook Form with Zod schema validation
- **Theme state** managed through Context API with localStorage persistence

## External Dependencies

### Database & Storage
- **Neon Database** - Serverless PostgreSQL database hosting
- **Drizzle ORM** - Type-safe database toolkit and query builder

### UI & Styling
- **Radix UI primitives** - Accessible, unstyled UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library for consistent iconography
- **Recharts** - Charting library for dashboard analytics

### Development Tools
- **TypeScript** - Static type checking and enhanced developer experience
- **Vite** - Fast build tool and development server
- **ESBuild** - Fast JavaScript bundler for production builds
- **PostCSS** - CSS processing with Tailwind integration

### Authentication & Security
- **jsonwebtoken** - JWT token generation and verification
- **bcrypt** - Password hashing and verification
- **crypto** - UUID generation for entity identifiers

### Form & Data Handling
- **React Hook Form** - Performant form library with minimal re-renders
- **Zod** - TypeScript-first schema validation
- **@hookform/resolvers** - Validation resolver for React Hook Form integration

### Charts & Visualization
- **Recharts** - React charting library for dashboard metrics
- **Date-fns** - Date utility library for formatting and manipulation