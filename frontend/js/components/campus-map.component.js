/**
 * PARKWISE - Interactive SVG Campus Parking Map Component
 * Visual Reference: ParkSmart Campus Map with zoom, pan, zone highlights, and real-time occupancy.
 */

import { icon } from '../utils/icons.js';

export const ZONE_COORDS = {
  A: {
    name: 'Lot A',
    subtitle: 'Academic Block Parking',
    r: { x: 60, y: 200, w: 230, h: 100 },
    focus: { x: 15, y: 170, w: 320, h: 192 }
  },
  B: {
    name: 'Lot B',
    subtitle: 'Library Parking',
    r: { x: 510, y: 200, w: 230, h: 100 },
    focus: { x: 465, y: 170, w: 320, h: 192 }
  },
  C: {
    name: 'Lot C',
    subtitle: 'Main Gate Parking',
    r: { x: 450, y: 360, w: 250, h: 80 },
    focus: { x: 330, y: 270, w: 400, h: 240 }
  }
};

const DEFAULT_VIEWBOX = { x: 0, y: 0, w: 800, h: 480 };

const TREES = [
  [30, 30], [330, 40], [460, 30], [780, 40],
  [30, 170], [350, 190], [430, 190], [780, 170],
  [20, 380], [330, 390], [740, 370], [760, 440], [250, 430]
];

export class CampusMapController {
  constructor({ containerId, lots = [], selectedZone = null, onZoneSelect = null, showRoute = false, activeLotCode = null }) {
    this.container = document.getElementById(containerId);
    this.lots = lots;
    this.selectedZone = selectedZone;
    this.onZoneSelect = onZoneSelect;
    this.showRoute = showRoute;
    this.activeLotCode = activeLotCode;
    this.viewBox = { ...DEFAULT_VIEWBOX };
    this.targetViewBox = { ...DEFAULT_VIEWBOX };
    this.animationFrame = null;

    if (this.container) {
      this.render();
      if (this.selectedZone && ZONE_COORDS[this.selectedZone]) {
        this.animateTo(ZONE_COORDS[this.selectedZone].focus);
      }
    }
  }

  setSelectedZone(zoneCode, animate = true) {
    if (!zoneCode) return;
    this.selectedZone = zoneCode.toUpperCase();
    if (animate && ZONE_COORDS[this.selectedZone]) {
      this.animateTo(ZONE_COORDS[this.selectedZone].focus);
    }
    this.render();
  }

  updateLots(lots, selectedZone = this.selectedZone, activeLotCode = this.activeLotCode) {
    this.lots = lots;
    this.selectedZone = selectedZone;
    this.activeLotCode = activeLotCode;
    this.render();
  }

  zoom(factor) {
    const cur = this.viewBox;
    const w = Math.min(800, Math.max(200, cur.w * factor));
    const h = w * 0.6;
    this.animateTo({
      x: Math.min(800 - w, Math.max(0, cur.x + (cur.w - w) / 2)),
      y: Math.min(480 - h, Math.max(0, cur.y + (cur.h - h) / 2)),
      w,
      h
    });
  }

  reset() {
    if (this.selectedZone && ZONE_COORDS[this.selectedZone]) {
      this.animateTo(ZONE_COORDS[this.selectedZone].focus);
    } else {
      this.animateTo(DEFAULT_VIEWBOX);
    }
  }

  animateTo(target) {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    const start = { ...this.viewBox };
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const duration = 400;

    const step = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - progress, 3);

      this.viewBox = {
        x: start.x + (target.x - start.x) * ease,
        y: start.y + (target.y - start.y) * ease,
        w: start.w + (target.w - start.w) * ease,
        h: start.h + (target.h - start.h) * ease
      };

      const svg = this.container?.querySelector('svg');
      if (svg) {
        svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.w} ${this.viewBox.h}`);
      }

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(step);
      }
    };

    this.animationFrame = requestAnimationFrame(step);
  }

  render() {
    if (!this.container) return;

    // Helper: calculate lot status colors
    const getZoneMetrics = (lotCode) => {
      const lot = this.lots.find((l) => l.lotCode === lotCode);
      if (!lot) return { available: 0, total: 100, color: '#16a34a', statusText: 'Available' };
      const available = Math.max(0, lot.totalCapacity - lot.occupiedSpaces);
      const ratio = lot.totalCapacity > 0 ? available / lot.totalCapacity : 0;
      let color = '#16a34a'; // green
      let statusText = 'Available';

      if (ratio < 0.3) {
        color = '#dc2626'; // red
        statusText = 'Full';
      } else if (ratio < 0.6) {
        color = '#f59e0b'; // amber
        statusText = 'Limited';
      }
      return { available, total: lot.totalCapacity, color, statusText };
    };

    // Tree elements
    const treesHtml = TREES.map(([x, y]) => `
      <g>
        <circle cx="${x}" cy="${y}" r="15" fill="#c6dcc8"/>
        <circle cx="${x}" cy="${y}" r="7" fill="#b2cfb5"/>
      </g>
    `).join('');

    // Zone renderings
    const zonesHtml = ['A', 'B', 'C'].map((code) => {
      const z = ZONE_COORDS[code];
      const m = getZoneMetrics(code);
      const isSelected = this.selectedZone === code;
      const isActiveSession = this.activeLotCode === code;
      const r = z.r;

      // Selection styling: prominent luminous teal outline and glowing indicator
      const strokeColor = isSelected ? '#0F9D9A' : (isActiveSession ? '#2563eb' : m.color);
      const strokeWidth = isSelected ? '5' : (isActiveSession ? '3.5' : '2.5');
      const labelY = code === 'C' ? r.y + r.h + 8 : r.y - 28;

      // Draw 10 small bay slots inside for visual aesthetic
      const bayCount = 10;
      const cw = (r.w - 20) / 5;
      const baysHtml = Array.from({ length: bayCount }).map((_, i) => {
        const c = i % 5;
        const row = i > 4 ? 1 : 0;
        const bx = r.x + 10 + c * cw + 2;
        const by = row ? (r.y + r.h - (code === 'C' ? 38 : 44)) : (r.y + 10);
        const bw = cw - 4;
        const bh = code === 'C' ? 28 : 34;

        // Color some bays red and some green proportional to occupancy
        const lot = this.lots.find((l) => l.lotCode === code);
        const occRatio = lot ? lot.occupiedSpaces / lot.totalCapacity : 0.5;
        const isOcc = (i / bayCount) < occRatio;
        const fill = isOcc ? '#f87171' : '#34d399';

        return `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="3" fill="${fill}" opacity="0.9" />`;
      }).join('');

      return `
        <g class="campus-zone-group" data-zone="${code}" style="cursor: pointer;">
          <!-- Selection Halo Effect when selected -->
          ${isSelected ? `
            <rect x="${r.x - 4}" y="${r.y - 4}" width="${r.w + 8}" height="${r.h + 8}" rx="12" fill="none" stroke="#0F9D9A" stroke-width="2" opacity="0.4" />
          ` : ''}

          <!-- Zone Outer Boundary Box -->
          <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="8" fill="#ffffff" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
          
          <!-- Bay layout visualization -->
          ${baysHtml}

          <!-- Entrance indicator -->
          ${code === 'C'
            ? `<rect x="${r.x - 3}" y="${r.y + r.h / 2 - 18}" width="6" height="36" fill="#0F9D9A"/>
               <text x="${r.x - 8}" y="${r.y + r.h / 2 + 3}" text-anchor="end" font-size="9" font-weight="600" fill="#0F766E">Entry/Exit</text>`
            : `<rect x="${r.x + r.w / 2 - 22}" y="${r.y + r.h - 3}" width="44" height="6" fill="#0F9D9A"/>
               <text x="${r.x + r.w / 2}" y="${r.y + r.h + 17}" text-anchor="middle" font-size="9" font-weight="600" fill="#0F766E">Entry/Exit</text>`
          }

          <!-- Zone Title Pill (Highlights in Teal when selected) -->
          <rect x="${r.x}" y="${labelY}" width="${r.w}" height="20" rx="10" fill="${isSelected ? '#0F9D9A' : '#0B2447'}" />
          <text x="${r.x + r.w / 2}" y="${labelY + 14}" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">
            ${z.name} – ${z.subtitle}${isSelected ? ' (SELECTED)' : ''}
          </text>

          <!-- Real-Time Available Count Circle Badge -->
          <circle cx="${r.x + r.w}" cy="${r.y}" r="17" fill="${isSelected ? '#0F9D9A' : strokeColor}" stroke="#ffffff" stroke-width="2.5" />
          <text x="${r.x + r.w}" y="${r.y + 5}" text-anchor="middle" font-size="12" font-weight="700" fill="#ffffff">
            ${m.available}
          </text>
        </g>
      `;
    }).join('');

    // Active walking route polyline (Marching dashed line directly to selected lot)
    let routeHtml = '';
    const activeRouteZone = this.selectedZone || this.activeLotCode;
    if (activeRouteZone && ZONE_COORDS[activeRouteZone]) {
      const z = ZONE_COORDS[activeRouteZone];
      let points = [];
      if (activeRouteZone === 'C') {
        points = [[400, 470], [400, 400], [450, 400]];
      } else if (activeRouteZone === 'A') {
        points = [[400, 470], [400, 330], [175, 330], [175, 300]];
      } else if (activeRouteZone === 'B') {
        points = [[400, 470], [400, 330], [625, 330], [625, 300]];
      }

      routeHtml = `
        <polyline class="march" points="${points.map(p => p.join(',')).join(' ')}" fill="none" stroke="#2563eb" stroke-width="4" stroke-dasharray="8 5" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="400" cy="470" r="5" fill="#2563eb" />
      `;
    }

    this.container.innerHTML = `
      <div class="campus-map-wrapper relative" style="position: relative; width: 100%;">
        <svg
          viewBox="${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.w} ${this.viewBox.h}"
          style="display: block; width: 100%; height: auto; border-radius: var(--radius-lg); border: 1px solid var(--color-border); background: #e5eee6; user-select: none;"
          role="img"
          aria-label="Interactive Campus Two-Wheeler Parking Map"
        >
          <!-- Ground Base -->
          <rect width="800" height="480" fill="#e5eee6" />
          
          <!-- Trees -->
          ${treesHtml}

          <!-- Campus Roadways -->
          <rect x="385" y="0" width="30" height="480" fill="#c9d1db" />
          <rect x="0" y="315" width="800" height="30" fill="#c9d1db" />
          <path d="M400 0V480M0 330H800" stroke="#ffffff" stroke-width="2" stroke-dasharray="10 8" fill="none" />

          <!-- Pedestrian Walkways -->
          <path d="M175 160V200M625 160V200M290 105H385M510 105H415" stroke="#f6f0dc" stroke-width="7" stroke-dasharray="2 7" stroke-linecap="round" fill="none" />

          <!-- Building: Academic Block -->
          <g>
            <rect x="60" y="50" width="230" height="110" rx="6" fill="#dbe4ee" stroke="#9fb0c4" stroke-width="2" />
            <rect x="68" y="58" width="214" height="94" rx="4" fill="#e9eff6" stroke="#b8c6d6" />
            <rect x="76" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="108" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="140" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="172" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="204" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="236" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <text x="175" y="86" text-anchor="middle" font-size="15" font-weight="700" fill="#0B2447">Academic Block</text>
            <text x="175" y="104" text-anchor="middle" font-size="10" fill="#64748b">Engineering &amp; Sciences</text>
          </g>

          <!-- Building: Library Complex -->
          <g>
            <rect x="510" y="50" width="230" height="110" rx="6" fill="#dbe4ee" stroke="#9fb0c4" stroke-width="2" />
            <rect x="518" y="58" width="214" height="94" rx="4" fill="#e9eff6" stroke="#b8c6d6" />
            <rect x="526" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="558" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="590" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="622" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="654" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <rect x="686" y="126" width="14" height="10" rx="2" fill="#8fb0d3" />
            <text x="625" y="86" text-anchor="middle" font-size="15" font-weight="700" fill="#0B2447">Central Library</text>
            <text x="625" y="104" text-anchor="middle" font-size="10" fill="#64748b">Study &amp; Research Center</text>
          </g>

          <!-- Campus Main Gate Sign -->
          <rect x="370" y="466" width="60" height="14" rx="3" fill="#0B2447" />
          <text x="400" y="477" text-anchor="middle" font-size="9" font-weight="700" fill="#ffffff">MAIN GATE</text>
          <text x="382" y="454" text-anchor="end" font-size="10" font-weight="600" fill="#0F9D9A">▲ Entry</text>
          <text x="418" y="454" font-size="10" font-weight="600" fill="#64748b">▼ Exit</text>

          <!-- Campus Parking Lots -->
          ${zonesHtml}

          <!-- Active Navigation Marching Line -->
          ${routeHtml}
        </svg>

        <!-- Floating Map Controls in Top Right -->
        <div style="position: absolute; top: 12px; right: 12px; display: flex; flex-direction: column; gap: 6px;">
          <button id="map-zoom-in-btn" class="btn btn-outline" style="width: 34px; height: 34px; padding: 0; background: #ffffff; border-color: #cbd5e1; border-radius: 8px; box-shadow: var(--shadow-sm);" title="Zoom in">
            ${icon('plus', 16)}
          </button>
          <button id="map-zoom-out-btn" class="btn btn-outline" style="width: 34px; height: 34px; padding: 0; background: #ffffff; border-color: #cbd5e1; border-radius: 8px; box-shadow: var(--shadow-sm);" title="Zoom out">
            ${icon('minus', 16)}
          </button>
          <button id="map-reset-btn" class="btn btn-outline" style="width: 34px; height: 34px; padding: 0; background: #ffffff; border-color: #cbd5e1; border-radius: 8px; box-shadow: var(--shadow-sm);" title="Reset view">
            ${icon('reset', 16)}
          </button>
        </div>

        <!-- Legend Bar -->
        <div class="flex items-center justify-between flex-wrap gap-2 text-xs text-muted" style="margin-top: var(--space-2); font-size: var(--font-size-xs);">
          <div class="flex items-center gap-4 flex-wrap">
            <span class="flex items-center gap-1.5"><i style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#16a34a;"></i> Available (&gt;60% open)</span>
            <span class="flex items-center gap-1.5"><i style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#f59e0b;"></i> Limited (30–60%)</span>
            <span class="flex items-center gap-1.5"><i style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#dc2626;"></i> Full (&lt;30%)</span>
            <span class="flex items-center gap-1.5"><i style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#0F9D9A;"></i> Selected Lot</span>
          </div>
          <div class="text-muted" style="font-size: 11px;">
            Click any zone on the map or in the table below to select and view real-time details.
          </div>
        </div>
      </div>
    `;

    // Bind Zoom & Reset Controls
    this.container.querySelector('#map-zoom-in-btn')?.addEventListener('click', () => this.zoom(0.75));
    this.container.querySelector('#map-zoom-out-btn')?.addEventListener('click', () => this.zoom(1 / 0.75));
    this.container.querySelector('#map-reset-btn')?.addEventListener('click', () => this.reset());

    // Bind Zone Clicks
    this.container.querySelectorAll('.campus-zone-group').forEach((el) => {
      el.addEventListener('click', () => {
        const zoneCode = el.dataset.zone;
        this.setSelectedZone(zoneCode, true);
        if (this.onZoneSelect) {
          this.onZoneSelect(zoneCode);
        }
      });
    });
  }
}
