import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const roots = ['src/pages', 'src/components/sarraaf', 'src/lib'];
const ignored = /(?:\.test\.|\.spec\.|\.pre-|\.bak\.|\.backup\.)/i;
const wrappers = new Set([
  'Navigate', 'FeatureGate', 'ProtectedRoute', 'AdminRoute', 'Layout',
  'CustomerLayout', 'Route', 'Routes', 'DashboardRoute'
]);

async function walk(dir) {
  let entries;
  try { entries = await readdir(path.join(root, dir), { withFileTypes: true }); }
  catch { return []; }
  const files = [];
  for (const entry of entries) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(rel));
    else if (/\.(?:jsx?|tsx?|css)$/.test(entry.name) && !ignored.test(entry.name)) files.push(rel);
  }
  return files;
}

function routeGroup(route) {
  if (/^\/(?:login|register|forgot-password|reset-password|assistant|setup-database|lab\/)/.test(route)) return 'public';
  if (route.startsWith('/customer')) return 'customer';
  if (route === '/builder' || route === '/main-settings') return 'creator-admin';
  if (route.startsWith('/seller')) return 'authenticated-seller';
  if (route === '/receipt') return 'authenticated';
  if (route.startsWith('/enterprise/')) return 'creator-admin-sarraaf';
  return 'exchanger-workspace';
}

const appPath = path.join(root, 'src/App.jsx');
const appSource = await readFile(appPath, 'utf8');
const routes = [];
for (const line of appSource.split(/\r?\n/)) {
  if (!line.includes('<Route') || !line.includes('path=')) continue;
  const pathMatch = line.match(/path="([^"]+)"/);
  if (!pathMatch) continue;
  const route = pathMatch[1];
  const componentMatches = [...line.matchAll(/<([A-Z][A-Za-z0-9_]*)\b/g)].map(match => match[1]);
  const component = [...componentMatches].reverse().find(name => !wrappers.has(name)) || 'Unknown';
  const feature = line.match(/featureKey="([^"]+)"/)?.[1] || null;
  routes.push({ path: route, component, accessGroup: routeGroup(route), featureGate: feature });
}

const allFiles = (await Promise.all(roots.map(walk))).flat().sort();
const sourceFiles = allFiles.map(file => ({
  path: file,
  kind: file.startsWith('src/pages/') ? 'page'
    : file.startsWith('src/lib/') ? 'service'
    : file.endsWith('.css') ? 'style' : 'component'
}));
const areaCounts = {};
for (const file of sourceFiles) {
  const area = file.path.startsWith('src/pages/customer/') ? 'customer'
    : file.path.startsWith('src/pages/sarraaf/') ? 'exchanger'
    : file.path.startsWith('src/pages/seller/') ? 'seller'
    : file.path.startsWith('src/pages/') ? 'shared-pages'
    : file.path.startsWith('src/lib/') ? 'services-and-data-access'
    : 'shared-components';
  areaCounts[area] = (areaCounts[area] || 0) + 1;
}

const inventory = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceOfRoutes: 'src/App.jsx',
  routeCount: routes.length,
  sourceFileCount: sourceFiles.length,
  areas: Object.entries(areaCounts).map(([name, count]) => ({ name, fileCount: count })),
  routes,
  sourceFiles
};
const outputDir = path.join(root, 'src/generated');
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, 'testing-app-inventory.json'), JSON.stringify(inventory, null, 2) + '\n', 'utf8');
console.log(`Generated test inventory: ${routes.length} routes, ${sourceFiles.length} source files.`);
