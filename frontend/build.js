import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const pages = [
  { entry: path.join(__dirname, 'js/pages/index.page.js'), out: path.join(distDir, 'index.bundle.js') },
  { entry: path.join(__dirname, 'js/pages/login.page.js'), out: path.join(distDir, 'login.bundle.js') },
  { entry: path.join(__dirname, 'js/pages/register.page.js'), out: path.join(distDir, 'register.bundle.js') },
  { entry: path.join(__dirname, 'js/pages/admin-dashboard.page.js'), out: path.join(distDir, 'admin-dashboard.bundle.js') },
  { entry: path.join(__dirname, 'js/pages/student-dashboard.page.js'), out: path.join(distDir, 'student-dashboard.bundle.js') },
  { entry: path.join(__dirname, 'js/pages/parking-lots.page.js'), out: path.join(distDir, 'parking-lots.bundle.js') },
  { entry: path.join(__dirname, 'js/pages/find-vehicle.page.js'), out: path.join(distDir, 'find-vehicle.bundle.js') },
  { entry: path.join(__dirname, 'js/pages/rewards.page.js'), out: path.join(distDir, 'rewards.bundle.js') },
  { entry: path.join(__dirname, 'js/pages/parking-history.page.js'), out: path.join(distDir, 'parking-history.bundle.js') },
  { entry: path.join(__dirname, 'js/pages/scan-parking.page.js'), out: path.join(distDir, 'scan-parking.bundle.js') },
  { entry: path.join(__dirname, 'js/pages/campus-map.page.js'), out: path.join(distDir, 'campus-map.bundle.js') },
  { entry: path.join(__dirname, 'js/pages/profile.page.js'), out: path.join(distDir, 'profile.bundle.js') }
];

console.log('Building standalone browser bundles (IIFE) for CORS-free file:/// execution...');

for (const { entry, out } of pages) {
  const cmd = `npx esbuild "${entry}" --bundle --format=iife --outfile="${out}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log(`[OK] Built ${path.basename(out)}`);
}

console.log('All 12 bundles generated successfully in frontend/dist/');
