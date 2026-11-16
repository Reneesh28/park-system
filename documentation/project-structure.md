# PARKWISE — Project Structure Documentation

## Overview
ParkWise is organized around a clean separation of concerns, supporting a **Frontend-First** architecture. The client codebase runs natively in standard browser environments (e.g., via VS Code Live Server or static web servers) without any bundlers, transpilers, or build steps.

```
parkwise/
├── frontend/
│   ├── index.html                   # Application landing portal & 1-click evaluation logins
│   ├── login.html                   # Authentication view with show/hide password and demo buttons
│   ├── register.html                # Account registration view with client-side validation
│   ├── pages/                       # Individual application page views
│   │   ├── student-dashboard.html   # Main student dashboard with live session banner & recommendation hero
│   │   ├── parking-lots.html        # Campus parking lot directory with filters, search, & QR details modal
│   │   ├── scan-parking.html        # QR check-in & check-out camera interface with laser animation
│   │   ├── find-vehicle.html        # Vehicle location, live elapsed timer, & walking distance guide
│   │   ├── rewards.html             # Point redemption catalog, incentive rules, & transaction ledger
│   │   ├── parking-history.html     # Past parking sessions and logs with filtering
│   │   └── admin-dashboard.html     # Administrative monitoring, capacity controls, & audit feeds
│   ├── assets/                      # Static static media
│   │   ├── images/                  # Promotional, campus map, and logo assets
│   │   ├── icons/                   # UI iconography
│   │   └── fonts/                   # Typography assets
│   ├── css/                         # Modular CSS architecture
│   │   ├── variables.css            # Central design tokens (colors, spacing, typography, radii, elevations)
│   │   ├── main.css                 # CSS reset, base typography & layout utilities
│   │   ├── components.css           # Atomic UI component styles (buttons, cards, badges, modals, toasts, tables)
│   │   ├── auth.css                 # Auth form & container layout styles
│   │   ├── dashboard.css            # Dashboard layout, sidebar & metric card styles
│   │   └── responsive.css           # Breakpoints & mobile/tablet responsive rules
│   ├── js/                          # Vanilla ES Modules JavaScript layer
│   │   ├── api/                     # Decoupled API abstraction layer
│   │   │   ├── api.js               # Base client, envelope wrappers & mock dispatcher
│   │   │   ├── auth.api.js          # Authentication endpoint contracts & mock login/register
│   │   │   ├── parking.api.js       # Lot, session, & QR contracts (check-in, check-out, lot capacity)
│   │   │   ├── rewards.api.js       # Rewards catalog, voucher generation, & transaction ledger
│   │   │   └── users.api.js         # User profile & vehicle contracts
│   │   ├── components/              # Dynamic UI component factories
│   │   │   ├── badge.component.js   # Availability & status badge renderers
│   │   │   ├── card.component.js    # Card container generator
│   │   │   ├── modal.component.js   # Accessible modal dialog system
│   │   │   ├── navbar.component.js  # Navigation header generator with auth state & logout
│   │   │   ├── sidebar.component.js # Responsive sidebar navigation (student & admin variants)
│   │   │   └── toast.component.js   # Non-blocking notification toasts
│   │   ├── data/                    # Seed mock datasets
│   │   │   └── mock-data.js         # Seed users, lots, sessions, reward rules, & catalog
│   │   ├── middleware/              # Client-side routing & auth checks
│   │   │   └── auth.middleware.js   # Role-based session verification guards
│   │   ├── pages/                   # Page-specific business controllers
│   │   │   ├── admin-dashboard.page.js  # Controller for campus analytics & lot capacity editor
│   │   │   ├── find-vehicle.page.js     # Controller for vehicle locator & live timer
│   │   │   ├── index.page.js            # Controller for landing portal & quick logins
│   │   │   ├── login.page.js            # Controller for authentication view
│   │   │   ├── parking-history.page.js  # Controller for session activity log
│   │   │   ├── parking-lots.page.js     # Controller for lot directory, filters, & QR modals
│   │   │   ├── register.page.js         # Controller for student registration
│   │   │   ├── rewards.page.js          # Controller for rewards balance, catalog, & vouchers
│   │   │   ├── scan-parking.page.js     # Controller for QR scanning & session lifecycle
│   │   │   └── student-dashboard.page.js# Controller for student dashboard & stats
│   │   ├── services/                # Cross-cutting application services
│   │   │   ├── recommendation.service.js# Recommendation algorithm (S = 0.6A + 0.4D)
│   │   │   └── storage.service.js   # Persistent localStorage manager with auto-hydration
│   │   └── utils/                   # Pure helper functions
│   │       ├── formatters.js        # Date, time, duration, and occupancy formatters
│   │       ├── helpers.js           # DOM query and debounce utilities
│   │       └── validators.js        # Email, password, and vehicle license validators
│   └── README.md                    # Frontend documentation & launch instructions
├── backend/                         # Backend directory (Node.js, Express, MongoDB, Mongoose)
├── documentation/                   # Architectural & progress documentation
│   ├── project-structure.md         # Detailed directory structure explanation
│   ├── frontend-progress.md         # Phase tracking & milestone roadmap
│   └── development-guidelines.md    # Coding standards & AI agent rules
└── README.md                        # Project root documentation
```
