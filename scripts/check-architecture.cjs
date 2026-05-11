#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcRoot = path.join(root, 'src');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else if (/\.(js|jsx)$/.test(entry.name)) result.push(full);
  }
  return result;
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function extractImportSpecs(source) {
  const specs = [];
  const re = /(?:import\s+(?:[^'";]+\s+from\s+)?|export\s+[^'";]+\s+from\s+|import\s*\(\s*|import\.meta\.glob\s*\(\s*)["']([^"']+)["']/g;
  let match;
  while ((match = re.exec(source))) specs.push({ spec: match[1], raw: match[0] });
  return specs;
}

function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  return path.resolve(path.dirname(fromFile), spec).replace(/\\/g, '/');
}

function layerOfResolved(resolved) {
  const normalized = resolved.replace(/\\/g, '/');
  if (normalized.includes('/src/app/')) return 'app';
  if (normalized.includes('/src/admin/')) return 'admin';
  if (normalized.includes('/src/shared/')) return 'shared';
  return null;
}

const violations = [];

const allowedTopLevel = new Set(['app', 'admin', 'shared']);
for (const entry of fs.readdirSync(srcRoot, { withFileTypes: true })) {
  if (entry.isDirectory() && !allowedTopLevel.has(entry.name)) {
    violations.push(`src/${entry.name}: يجب أن يكون التقسيم الأعلى فقط app / admin / shared`);
  }
}

for (const file of walk(srcRoot)) {
  const source = fs.readFileSync(file, 'utf8');
  const relative = rel(file);
  const fileLayer = relative.startsWith('src/app/') ? 'app'
    : relative.startsWith('src/admin/') ? 'admin'
    : relative.startsWith('src/shared/') ? 'shared'
    : 'unknown';

  for (const { spec, raw } of extractImportSpecs(source)) {
    const targetLayer = layerOfResolved(resolveImport(file, spec) || '');
    const isAdminBoundaryGlob = relative === 'src/app/shell/adminBoundary.jsx' && raw.startsWith('import.meta.glob') && targetLayer === 'admin';

    if (fileLayer !== 'admin' && targetLayer === 'admin' && !isAdminBoundaryGlob) {
      violations.push(`${relative}: ممنوع الاستيراد الثابت من src/admin؛ استخدم adminBoundary أو shared فقط`);
    }

    if (fileLayer === 'shared' && (targetLayer === 'app' || targetLayer === 'admin')) {
      violations.push(`${relative}: shared يجب ألا يعتمد على app أو admin`);
    }

    if (fileLayer === 'admin' && targetLayer === 'app') {
      violations.push(`${relative}: admin يجب ألا يعتمد على app؛ انقل المشترك إلى shared`);
    }
  }
}

if (violations.length) {
  console.error('Architecture check failed:\n' + violations.map(v => `- ${v}`).join('\n'));
  process.exit(1);
}

console.log('Architecture check passed.');
