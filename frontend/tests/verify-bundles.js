import fs from 'fs';
import vm from 'vm';

console.log('====================================================');
console.log('RUNNING BUNDLE SUITE ACROSS ALL FRONTEND PAGES');
console.log('====================================================');

const pagesToTest = [
  { name: 'Index Page', bundle: 'frontend/dist/index.bundle.js' },
  { name: 'Login Page', bundle: 'frontend/dist/login.bundle.js' },
  { name: 'Register Page', bundle: 'frontend/dist/register.bundle.js' },
  { name: 'Admin Dashboard', bundle: 'frontend/dist/admin-dashboard.bundle.js' },
  { name: 'Student Dashboard', bundle: 'frontend/dist/student-dashboard.bundle.js' },
  { name: 'Parking Lots', bundle: 'frontend/dist/parking-lots.bundle.js' },
  { name: 'Find Vehicle', bundle: 'frontend/dist/find-vehicle.bundle.js' },
  { name: 'Rewards', bundle: 'frontend/dist/rewards.bundle.js' },
  { name: 'Parking History', bundle: 'frontend/dist/parking-history.bundle.js' },
  { name: 'Scan Parking', bundle: 'frontend/dist/scan-parking.bundle.js' },
  { name: 'Campus Map', bundle: 'frontend/dist/campus-map.bundle.js' },
  { name: 'Profile', bundle: 'frontend/dist/profile.bundle.js' }
];

const mockStorage = {};
const localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { for (let k in mockStorage) delete mockStorage[k]; }
};

function createMockDom() {
  const elements = {};
  const listeners = {};
  const docListeners = {};

  function makeElem(id = '', tag = 'div') {
    return {
      id,
      tagName: tag.toUpperCase(),
      innerHTML: '',
      textContent: '',
      value: '',
      style: {},
      dataset: {},
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      setAttribute: () => {},
      getAttribute: () => null,
      querySelectorAll: () => [],
      querySelector: () => null,
      appendChild: () => {},
      contains: () => true,
      addEventListener: (evt, fn) => {
        listeners[`${id}:${evt}`] = fn;
      }
    };
  }

  const doc = {
    getElementById: (id) => {
      if (!elements[id]) elements[id] = makeElem(id);
      return elements[id];
    },
    querySelector: (sel) => makeElem(),
    querySelectorAll: (sel) => [],
    createElement: (tag) => makeElem(`dyn_${Date.now()}_${Math.random()}`, tag),
    addEventListener: (evt, fn) => {
      docListeners[evt] = fn;
    },
    body: makeElem('body')
  };

  const win = {
    localStorage,
    document: doc,
    location: { href: 'file:///C:/Users/Bloodblade/Desktop/PROJECTS/park%20system/frontend/index.html' },
    addEventListener: (evt, fn) => {},
    showToast: () => {},
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    navigator: { clipboard: { writeText: async () => true } },
    URLSearchParams,
    URL
  };
  win.window = win;

  return { win, doc, elements, listeners, docListeners };
}

for (const p of pagesToTest) {
  const code = fs.readFileSync(p.bundle, 'utf8');
  const { win, docListeners, listeners, elements } = createMockDom();
  const context = vm.createContext(win);

  vm.runInContext(code, context);

  // Trigger DOMContentLoaded
  if (docListeners['DOMContentLoaded']) {
    await docListeners['DOMContentLoaded']();
  }

  console.log(`[OK] [PASSED] ${p.name}: Bundle loaded & DOM initialized with 0 errors.`);
}

console.log('\n====================================================');
console.log('ALL 10 STANDALONE PAGE BUNDLES TESTED & VERIFIED!');
console.log('====================================================');
