const fs = require('fs');
const path = require('path');

const directory = 'packages/ui/src';
const includeExtensions = ['.tsx', '.ts'];

const replacements = [
  { regex: /bg-white\/8/g, replacement: 'bg-[var(--border-subtle)]' },
  { regex: /bg-white\/5/g, replacement: 'bg-[var(--border-subtle)]' },
  { regex: /bg-white\/\[0\.03\]/g, replacement: 'bg-[var(--border-subtle)]' },
  { regex: /hover:bg-white\/5/g, replacement: 'hover:bg-[var(--bg-surface-elevated)]' },
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
    console.log(`Updated bgs in: ${filePath}`);
  }
}

walk(directory);
console.log(`Done!`);
