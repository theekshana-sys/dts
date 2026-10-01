# Document Tracking System (DTS)

**Created by Theekshana Rajapaksha | Version 1.0**

A complete, production-ready, web-based Document Tracking System (DTS) designed to manage document logistics between Branch Offices and the Head Office. The system provides batch processing, nested sub-document tracking, chain-of-custody transfer workflows, role-based access control, dynamic statuses, and trilingual support.

---

## 🌟 Key Features

### 1. Branding & Multilingual (i18n) Support
- **Persistent Global Notice**: Every view, dashboard, report, printout, and audit sheet displays:
  `Created by Theekshana Rajapaksha | Version 1.0`
- **Trilingual Interface**: Instant switcher in the header between:
  - **English (Default)**
  - **Sinhala (සිංහල)**
  - **Tamil (தமிழ்)**

### 2. User Roles & Security
- **ADMIN**:
  - Full system configuration & master data management.
  - Approve new user registrations & review reset password requests.
  - Promote/demote user roles.
  - Configure Google Drive backup link & download instant database snapshots.
  - Deletion rights across all documents at any stage.
- **USER (Branch / Head Office Staff)**:
  - Document & batch creation.
  - Branch auto-assignment (user's registered branch is automatically selected).
  - Receiving documents via the `"හරි"` (Received) check action.
  - Custody transfers to any registered officer.
  - Document status updates & finalization.
  - Personal Dashboard (automatically filters out terminal statuses like "Entered" and "Document End").
  - Restricted from accessing the Admin Panel.

### 3. Default Seed Credentials
| Role | Email / Username | Password |
|---|---|---|
| **Administrator** | `admin@dts.local` | `Admin@12345` |
| **Head Office Officer** | `headoffice@dts.local` | `Staff@12345` |
| **Colombo Branch Officer**| `colombo@dts.local` | `Staff@12345` |

---

## 🚀 How to Run the System

### Option A: Using Windows Batch Script
Double-click `run_dts.bat` in this folder, or execute in PowerShell / Command Prompt:
```cmd
.\run_dts.bat
```

### Option B: Using Node.js
```bash
node server.js
```
Open your browser and navigate to: **`http://localhost:3000`**

---

## 📁 Project Architecture

```
DOT 30.09.226/
├── data/
│   └── dts.sqlite          # SQLite relational database
├── public/                 # Responsive Frontend Single Page Application
│   ├── index.html          # Semantic HTML5 layout with persistent footer
│   ├── css/
│   │   └── style.css       # Enterprise styling, badges, timeline, and A4 print engine
│   └── js/
│       ├── i18n.js         # Full English, Sinhala, Tamil translation dictionary
│       ├── api.js          # REST API Client with JWT authorization
│       └── app.js          # SPA Controller, reactive views, workflows, modals
├── server/
│   ├── db.js               # SQLite engine (sql.js) with migrations, indexes & seeding
│   ├── auth.js             # JWT authentication & role-based middleware
│   ├── app.js              # Express 5 server configuration & routes
│   └── routes/
│       ├── auth.routes.js       # Register, login, profile, forgot-password
│       ├── users.routes.js      # User management, approvals, roles, password reset
│       ├── branches.routes.js   # Branch office CRUD
│       ├── docTypes.routes.js   # Document types CRUD
│       ├── docStatuses.routes.js# Customizable final document statuses
│       ├── mainFiles.routes.js  # Main file batch creation, dispatch & locking
│       ├── documents.routes.js  # Receiving ("හරි"), custody transfer, finalization
│       ├── settings.routes.js   # Google Drive backup link & database download
│       └── reports.routes.js    # Excel (.xlsx) generator, metrics, audit logs
├── server.js               # Main web server startup script
├── test_system.js          # Automated end-to-end verification test suite
├── run_dts.bat             # One-click Windows startup batch script
└── package.json            # Dependencies and npm script configuration
```

---

## 🧪 Automated Testing

To run the automated verification test suite:
```powershell
node test_system.js
```
All 12 critical workflow tests verify:
- Seeded master data & branch auto-assignment
- Registration and Admin approval blocking (HTTP 403)
- Batch creation with nested sub-documents
- Immutability and data locking upon dispatch
- Receiving action (`"හරි"`) and custodian reassignment
- Deletion rights matrix enforcement
- Custody chain transfer & audit trail logging
- Automatic filtering of `"Entered"` and `"Document End"` from personal dashboard
- Excel (.xlsx) binary generation
- Database backup snapshot download

---

**Developed with precision for enterprise document logistics.**  
*Created by Theekshana Rajapaksha | Version 1.0*
