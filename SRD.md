# Software Requirement Document (SRD) - ProMS (Production Management System)

## 1. Introduction
ProMS is a web-based application designed to manage production details for equipment in the mining sector. The system facilitates manual data entry via keyboard and Excel uploads, ensuring data integrity, minimizing duplicate entries, and providing comprehensive audit trails.

## 2. Technology Stack Recommendation
Based on the requirements for a high-performance, lightweight, and data-intensive application:
- **Frontend**: Next.js (React Framework)
  - Validation: React Hook Form
  - Charts: Chart.js or Recharts
  - Styling: Vanilla CSS (CSS Modules) for maximum control and premium aesthetics.
  - **Theming**: Custom Theme Context (Light/Dark mode) persisted via Cookies/LocalStorage.
- **Backend**: Next.js API Routes (Node.js)
  - Database Driver: `mssql/msnodesqlv8` (for Windows Authentication)
- **Database**: Microsoft SQL Server (Schema provided)
  - Server: `MURALI\SQLEXPRESS` (Windows Auth)
  - DB Name: `ProdMS_live`


## 3. Functional Requirements

### 3.1. User Types & Authentication
- **Admin**: Full access (User management, Role assignment, Page allocation).
- **User**: Restricted access based on assigned roles.
- **Features**:
  - Login page with DB selection (Gear icon).
  - Password toggle visibility.
  - Auto-logout after 10 minutes of inactivity.
  - User Profile page (Edit Name, Password).

### 3.2. Menu Structure
- **Left Sidebar**: Collapsible menu.
- **Header**: App Name (Pro-MS), Location Icon, Login User info, Notification icon, Search bar (Navigation).
- **Footer**: ProMs Copyright 2026.

### 3.3. Modules
1.  **Dashboard**:
    -   Date Range Filter.
    -   Cards: Day/Month/Avg Coal Production, OB Handling, Rehandling (Indian Number System formatting).
    -   Charts: Top & Bottom 10 Performing Haulers, Top & Bottom 10 Frequent BD Equipment.
2.  **Masters**:
    -   Management of master data (Company, Activity, Depth Slab, Equipment, etc.).
    -   New Master: Stoppage Reason (Needs to be created).
    -   Features: Add/Edit/Delete (Soft Delete), Active/Inactive Toggle.
3.  **Authorization**:
    -   Role Management, Role Authorization, User Management.
4.  **Transactions**:
    -   Forms: Loading, Material Rehandling, Equipment Reading, Drilling, Blasting, Crusher, Stone Crusher.
    -   Features: Auto-fill suggestions, Excel upload support, Duplicate prevention.
5.  **Reports**:
    -   Material Loading Report.
6.  **Settings**:
    -   Menu Allocation, DB Connection Settings, Audit Logs, Sub-Master Configuration.

### 3.4. Data Entry & UI Features
-   **Data Tables**:
    -   Paging (10, 20, 50, ALL).
    -   Sorting (Column click).
    -   Search/Filter.
    -   Download options (Excel/PDF).
-   **Forms**:
    -   Keyboard navigation (Enter/Tab moves to next).
    -   Dropdowns with search capability.
    -   Mandatory & Unique field indicators.
    -   Confirmation dialogs for Update/Delete.
-   **Performance**: One-click data loading, highly responsive.

## 4. Database Schema Analysis
The provided Schema includes:
-   **Schema Names**: `Master`, `Trans`.
-   **Core Tables**: Companies, Equipment, Materials, Users, Shifts, etc.
-   **New Table Requirement**: `[Master].[TblStoppageReason]` was mentioned as missing in the User Request ("Not found the create new master table called Stoppage Reason").

## 5. Security & Non-Functional Requirements
-   **Security**:
    -   **Authentication**: JWT (JSON Web Tokens) stored in HTTP-only cookies.
    -   **Role-Based Access Control (RBAC)**: Middleware to verify user roles against page permissions.
    -   **Data Integrity**: Parameterized SQL queries to prevent Injection.
    -   **Input Validation**: Server-side validation using Zod for all API inputs.
    -   **Session Management**: Auto-logout on token expiration (10 mins inactivity).
-   **Design & UX**: 
    -   **Theme Support**: User toggle for Light/Dark mode. System remembers preference.
    -   **Aesthetics**: Premium, "Super Awesome", Glassmorphism, Animations.
    -   **Performance**: Fast load times, optimized SQL queries.
-   **Audit**: Track CreatedBy/UpdatedBy for all records.

## 6. Implementation Plan
1.  **Setup**: Initialize Next.js project.
2.  **UI/UX**: Build Layout, Header, Sidebar, and Reusable Components (DataGrid, Modal, Inputs).
3.  **Masters**: Implement screens for key masters.
4.  **Transactions**: Build complex transaction forms.
5.  **Backend Integration**: Connect API routes to MS SQL.
