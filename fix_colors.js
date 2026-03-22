const fs = require('fs');
const path = require('path');

const directory = 'packages/ui/src';
const includeExtensions = ['.tsx', '.ts'];

const replacements = [
  { regex: /text-white/g, replacement: 'text-[var(--text-primary)]' },
  { regex: /border-white\/[0-9]+/g, replacement: 'border-[var(--border-subtle)]' },
  { regex: /bg-slate-950(\/60)?/g, replacement: 'bg-[var(--bg-surface-elevated)]' },
  { regex: /bg-slate-900(\/60)?/g, replacement: 'bg-[var(--bg-surface-elevated)]' },
  { regex: /text-slate-500/g, replacement: 'text-[var(--text-muted)]' },
  { regex: /border-slate-500/g, replacement: 'border-[var(--border-subtle)]' },
  { regex: /text-blue-300/g, replacement: 'text-[var(--accent-info)]' },
  { regex: /text-amber-300/g, replacement: 'text-[var(--accent-warning)]' },
  { regex: /text-green-300/g, replacement: 'text-[var(--accent-success)]' },
  { regex: /text-red-300/g, replacement: 'text-[var(--accent-danger)]' },
  { regex: /text-green-400/g, replacement: 'text-[var(--accent-success)]' },
  { regex: /text-red-400/g, replacement: 'text-[var(--accent-danger)]' },
  { regex: /text-amber-400/g, replacement: 'text-[var(--accent-warning)]' },
  { regex: /text-blue-400/g, replacement: 'text-[var(--accent-info)]' },
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walk(fullPath);
    } else {
      const ext = path.extname(file);
      if (includeExtensions.includes(ext)) {
        replaceInFile(fullPath);
      }
    }
  }
}

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  for (const rule of replacements) {
    newContent = newContent.replace(rule.regex, rule.replacement);
  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated colors in: ${filePath}`);
  }
}

console.log(`Starting color replacement in ${directory}...`);
walk(directory);
console.log(`Done!`);
