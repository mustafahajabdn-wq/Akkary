#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcRoot = path.join(root, 'src');
const adminDir = path.join(srcRoot, 'admin');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
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

function resolvesToAdmin(file, spec) {
  if (!spec.startsWith('.')) return spec.includes('/src/admin/') || spec.startsWith('src/admin/');
  const resolved = path.resolve(path.dirname(file), spec).replace(/\\/g, '/');
  return resolved.includes('/src/admin/');
}

const violations = [];
for (const file of walk(srcRoot)) {
  const relative = rel(file);
  if (relative.startsWith('src/admin/')) continue;
  const source = fs.readFileSync(file, 'utf8');
  for (const { spec, raw } of extractImportSpecs(source)) {
    const isAllowedBoundaryGlob = relative === 'src/app/shell/adminBoundary.jsx' && raw.startsWith('import.meta.glob') && resolvesToAdmin(file, spec);
    if (resolvesToAdmin(file, spec) && !isAllowedBoundaryGlob) {
      violations.push(`${relative}: يحتوي استيرادًا ثابتًا من src/admin`);
    }
  }
}

if (violations.length) {
  console.error('Detachable admin check failed:\n' + violations.map(v => `- ${v}`).join('\n'));
  process.exit(1);
}

const hasAdmin = fs.existsSync(adminDir);
console.log(`Detachable admin check passed.${hasAdmin ? ' src/admin موجود لكنه اختياري.' : ' src/admin غير موجود والتطبيق لا يعتمد عليه استيرادًا ثابتًا.'}`);
