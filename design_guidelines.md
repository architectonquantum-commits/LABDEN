# Design Guidelines for SaaS Dental Laboratory Management System

## Design Approach Documentation

**Selected Approach:** Design System Approach (Material Design)
**Justification:** This is a utility-focused application prioritizing efficiency, data management, and role-based workflows over visual marketing appeal.

## Core Design Elements

### A. Color Palette

**Primary Colors:**
- Primary: 210 100% 50% (Medical blue - professional and trustworthy)
- Primary Dark: 210 100% 40%
- Secondary: 180 25% 25% (Muted teal for accents)

**Status Colors:**
- Success: 120 60% 50% (Order completed)
- Warning: 45 100% 60% (Order in process)
- Error: 0 70% 50% (Urgent/overdue orders)
- Info: 210 50% 60% (Pending orders)

**Neutral Palette:**
- Background: 220 15% 97% (Light mode), 220 15% 8% (Dark mode)
- Surface: 0 0% 100% (Light mode), 220 15% 12% (Dark mode)
- Text Primary: 220 15% 15% (Light mode), 220 15% 95% (Dark mode)
- Text Secondary: 220 10% 45% (Light mode), 220 10% 65% (Dark mode)

### B. Typography

**Font Family:** Inter (Google Fonts)
- Primary: Inter 400, 500, 600, 700
- Monospace: JetBrains Mono (for order IDs, technical data)

**Scale:**
- Headings: text-3xl (dashboard titles), text-xl (section headers), text-lg (card titles)
- Body: text-base (primary content), text-sm (secondary info), text-xs (metadata)

### C. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Micro spacing: p-2, gap-2 (within components)
- Standard spacing: p-4, m-4, gap-4 (between elements)
- Section spacing: p-6, m-8 (between major sections)
- Page spacing: p-12, m-16 (page margins, hero sections)

**Grid System:**
- Dashboard: 12-column grid with responsive breakpoints
- Cards: Consistent 4-unit padding, 2-unit gaps
- Forms: Single column with 6-unit vertical spacing

### D. Component Library

**Navigation:**
- Top navigation bar with role-based menu items
- Breadcrumb navigation for deep pages
- Sidebar for laboratory admin panel

**Data Display:**
- Metric cards with large numbers and trend indicators
- Data tables with sorting, filtering, and pagination
- Status badges with color-coded backgrounds
- Progress indicators for order workflow

**Forms:**
- Clean input fields with floating labels
- Multi-step forms for order creation
- Interactive odontogram with clickable tooth selection
- File upload areas with drag-and-drop

**Interactive Elements:**
- Primary buttons: Solid fills with medical blue
- Secondary buttons: Outlined with subtle hover states
- Icon buttons for quick actions
- Notification bell with unread count badge

**Overlays:**
- Modal dialogs for order details and confirmations
- Toast notifications for status updates
- Dropdown menus for user actions

### E. Role-Specific Design Patterns

**SuperAdmin Dashboard:**
- Global metrics in prominent cards
- Laboratory management table with action buttons
- System-wide analytics with chart visualizations

**Laboratory Dashboard:**
- Order management interface with status columns
- Doctor management section with CRUD operations
- Revenue and performance metrics

**Doctor Dashboard:**
- Simple order creation flow with clear steps
- Order history with visual status indicators
- Streamlined interface focusing on essential actions

### F. Specialized Components

**Odontogram Interface:**
- Interactive dental chart with numbered teeth (11-48)
- Color-coded conditions: caries (red), ausente (gray), fractura (orange), endodoncia (purple)
- Click-to-select functionality with visual feedback
- Condition legend and selection summary

**Notification System:**
- Header notification bell with red badge for unread count
- Notification dropdown with grouped messages
- Auto-marking as read on interaction

**Order Management:**
- Kanban-style status columns (Pendiente, En Proceso, Completada)
- Drag-and-drop status updates for laboratory users
- Order cards with essential info preview

### G. Accessibility & Responsive Design

- Consistent dark mode implementation across all interfaces
- Mobile-first responsive design with touch-friendly interactions
- High contrast ratios for medical professional use
- Screen reader support for all interactive elements
- Keyboard navigation for power users

### H. Visual Hierarchy

- Clear information architecture with consistent spacing
- Typography scale that emphasizes important actions and data
- Color usage that supports workflow understanding
- Visual grouping of related functionality by role

This design system ensures a professional, efficient interface that supports the complex multi-role workflow while maintaining visual consistency and usability across all user types.