# PARKWISE — Frontend Architecture & Execution Guide

## Overview

PARKWISE is a smart campus two-wheeler parking management system. The frontend is built strictly with **HTML5, CSS3, and Vanilla JavaScript** with zero external runtime frameworks or UI libraries.

---

## Navigation Structure

The application features the required 7-item navigation structure:

1. **Home** (`pages/student-dashboard.html`)
2. **Find Parking** (`pages/parking-lots.html`)
3. **Campus Map** (`pages/campus-map.html`) — *Dedicated first-class navigation item*
4. **Scan QR** (`pages/scan-parking.html`) — *Dedicated primary feature*
5. **My Parking** (`pages/find-vehicle.html`)
6. **Rewards** (`pages/rewards.html`)
7. **Profile** (`pages/profile.html`)

### Desktop Navigation
A compact Navy sidebar (`#0B2447`) with Inter typography and vector SVG icons.

### Mobile Navigation
A fixed bottom navigation bar (`< 768px`) prioritizing the most critical student workflows:
- **Home**
- **Find**
- **Scan QR** (*Elevated center action button for immediate 1-tap thumb reach*)
- **Map**
- **More** (*Bottom sheet / drawer revealing My Parking, Rewards, History, Profile, and Admin*)

---

## Campus Map & QR Scanning Architecture

### Interactive Campus Map
- **Illustrative Layout**: SVG canvas rendering Academic Block (Engineering & Sciences), Central Library, Student Center, Main Gate, roadways, pedestrian paths, trees, and university parking zones.
- **Three Parking Lots**:
  - `Lot A` (Academic Block Parking): 100 capacity
  - `Lot B` (Library Parking): 150 capacity
  - `Lot C` (Main Gate Parking): 80 capacity
- **Real-Time Indicators**: Live color-coded availability badges (Green: >60% open, Amber: 30–60%, Red: <30% full) on each lot.
- **Dynamic Lot Details Panel**: Clicking any lot zone smoothly focuses the map, highlights the boundary, draws the animated marching walking route from the target academic block, and populates the details panel with live bays, walking distance, and a direct **"Proceed to Park (Scan QR)"** action.
- **Dashboard Preview**: A compact map preview is embedded on the student dashboard with an **"Open Full Interactive Map"** option.

### QR Scanning Workflow
- **Accessibility**: Available from the top header on every page, the mobile bottom navigation bar, the active session banner, recommended lot cards, and the campus map lot details panel.
- **Permanent Identifiers**:
  - Lot A: `PARKWISE-LOT-A`
  - Lot B: `PARKWISE-LOT-B`
  - Lot C: `PARKWISE-LOT-C`
- **Dual Mode (Check-In & Checkout)**: The same QR code automatically triggers check-in (when not parked) or checkout (when already parked).
- **Scanning Capabilities**:
  1. Live camera stream with `navigator.mediaDevices.getUserMedia` and permission handling.
  2. 1-Click quick simulation buttons for all three lots.
  3. Manual code entry with invalid code validation and feedback.

---

## How to Run the Application

### Option 1: Direct File System Access (Zero Configuration)
Double-click any HTML file in Windows Explorer or open via `file:///` in Google Chrome / Microsoft Edge:
- [index.html](file:///c:/Users/Bloodblade/Desktop/PROJECTS/park%20system/frontend/index.html) (Landing Portal & Quick Logins)
- [pages/student-dashboard.html](file:///c:/Users/Bloodblade/Desktop/PROJECTS/park%20system/frontend/pages/student-dashboard.html) (Student Dashboard)
- [pages/campus-map.html](file:///c:/Users/Bloodblade/Desktop/PROJECTS/park%20system/frontend/pages/campus-map.html) (Dedicated Campus Map)
- [pages/scan-parking.html](file:///c:/Users/Bloodblade/Desktop/PROJECTS/park%20system/frontend/pages/scan-parking.html) (QR Scanner)
- [pages/admin-dashboard.html](file:///c:/Users/Bloodblade/Desktop/PROJECTS/park%20system/frontend/pages/admin-dashboard.html) (Admin Dashboard)

> **CORS Resolution**: Standalone IIFE bundles in `dist/` loaded via classic `<script src="...">` tags ensure zero CORS errors under `file:///` protocol.

### Option 2: Local Static Development Server
- **Windows**: Double-click [start.bat](file:///c:/Users/Bloodblade/Desktop/PROJECTS/park%20system/frontend/start.bat)
- **CLI**:
  ```bash
  cd frontend
  npm start
  ```
Opens at `http://localhost:3000`.
