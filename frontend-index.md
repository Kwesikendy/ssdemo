# SmartScript Frontend Code Index

## Project Overview
React-based frontend for SmartScript AI exam marking system. Built with modern React patterns, Tailwind CSS, and comprehensive state management.

## Tech Stack
- **React 18** - UI framework
- **React Router 6** - Client-side routing
- **Tailwind CSS** - Styling framework
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **Lucide React** - Icons
- **React Hook Form** - Form management

## Directory Structure

### `/src/` - Source Code

#### `/components/` - Reusable UI Components
- `AppShell.js` - Main application layout wrapper
- `NavBar.js` - Top navigation bar with user menu
- `Sidebar.js` - Side navigation (if used)
- `SideNav.js` - Alternative sidebar component
- `PublicNavbar.js` - Public pages navigation
- `CardTable.js` - Data table component
- `DataTable.js` - Advanced table with sorting/filtering
- `Modal.js` - Modal dialog component
- `Alert.js` - Alert/notification component
- `LoadingOverlay.js` - Full-screen loading overlay
- `LoadingSpinner.js` - Spinner component
- `LoadingProgressBar.js` - Progress bar component
- `StatsCard.js` - Statistics display cards
- `StatusBadge.js` - Status indicator badges
- `StatusIcon.js` - Status icons
- `ToastProvider.js` - Toast notification system
- `ProtectedRoute.js` - Route protection wrapper
- `PaystackPayment.js` - Payment integration

#### `/pages/` - Page Components
- `Dashboard.js` - Main dashboard with overview cards
- `LandingPage.js` - Public landing page
- `Login.js` - User login form
- `SignupPage.js` - User registration
- `PricingPage.js` - Pricing information
- `AccountPage.js` - User account management

**Upload Management:**
- `UploadsPage.js` - Main uploads listing
- `GroupUploadsPage.js` - Group-specific uploads
- `UploadDetailPage.js` - Individual upload details
- `SimpleUploadDetailsPage.js` - Simple upload view
- `BatchDetailsPage.js` - Batch upload details
- `BatchImageDetailsPage.js` - Individual image in batch

**Exam Management:**
- `GroupsPage.js` - Exam groups listing
- `ExamGroupsPage.js` - Specific exam group view
- `UploadExamGroupsPage.js` - Upload to exam group

**Marking System:**
- `MarkingPage.js` - Main marking interface
- `NewMarkingPage.js` - Enhanced marking interface
- `MarkingGroupsPage.js` - Marking group management
- `MarkingExamGroupsPage.js` - Marking for exam groups

**Results & Analytics:**
- `ResultsPage.js` - Main results dashboard
- `Results.js` - Alternative results view
- `GroupResultsPage.js` - Group-specific results
- `CandidateResultsPage.js` - Individual candidate results
- `CandidateDetailPage.js` - Detailed candidate view

**Quality Assurance:**
- `AnomaliesPage.js` - Anomaly detection and management
- `ValidationPage.js` - Data validation interface

**Configuration:**
- `SchemesPage.js` - Marking schemes management
- `UploadScheme.js` - Upload marking scheme

#### `/context/` - React Context
- `AuthContext.js` - Authentication state management
  - User login/logout
  - Token management
  - Protected route handling

#### `/hooks/` - Custom React Hooks
- `useBatchOperations.js` - Batch operation utilities
- `useImageOperations.js` - Image processing hooks

#### `/services/` - API Integration
- `api.js` - Main API service layer
- `axios.js` - Axios configuration with interceptors

#### `/utils/` - Utility Functions
- `statusUtils.js` - Status handling utilities

## Key Features

### 1. Authentication System
- JWT-based authentication
- Automatic token refresh
- Protected routes
- User context management

### 2. File Upload System
- Drag-and-drop file uploads
- Multiple file formats support
- Progress tracking
- Batch processing
- Real-time status updates

### 3. Exam Management
- Hierarchical exam organization
- Group-based exam structure
- Batch and simple exam types
- Marking scheme management

### 4. AI Marking Interface
- Real-time marking progress
- Manual override capabilities
- Confidence scoring display
- Batch marking operations
- Review and appeals system

### 5. Results Dashboard
- Comprehensive analytics
- Filtering and search
- Export capabilities
- Performance metrics
- Grade distribution

### 6. Quality Assurance
- Anomaly detection interface
- Manual review tools
- Appeals management
- Data validation

## Component Architecture

### State Management
- React Context for global state
- Local state with useState/useReducer
- Custom hooks for complex logic
- API integration with Axios

### Styling
- Tailwind CSS for utility-first styling
- Responsive design patterns
- Dark/light theme support
- Animation with Framer Motion

### Routing
- React Router v6
- Protected routes
- Dynamic routing with parameters
- Nested route structures

## API Integration

### Base Configuration
- Axios instance with base URL
- Request/response interceptors
- Automatic token attachment
- Error handling and retry logic

### Endpoints Used
- Authentication: `/auth/*`
- Exams: `/exams/*`
- Uploads: `/uploads/*`
- Marking: `/marking/*`
- Results: `/results/*`
- Anomalies: `/anomalies/*`

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
1. Install dependencies: `npm install`
2. Configure environment variables
3. Start development server: `npm start`
4. Build for production: `npm run build`

### Scripts
- `npm start` - Development server with Tailwind watch
- `npm run build` - Production build
- `npm test` - Run tests
- `npm run tw:build` - Build Tailwind CSS
- `npm run tw:watch` - Watch Tailwind CSS

## UI/UX Features

### Design System
- Consistent color palette
- Typography scale
- Spacing system
- Component variants

### Responsive Design
- Mobile-first approach
- Breakpoint system
- Flexible layouts
- Touch-friendly interfaces

### Accessibility
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management

### Performance
- Code splitting
- Lazy loading
- Image optimization
- Bundle optimization