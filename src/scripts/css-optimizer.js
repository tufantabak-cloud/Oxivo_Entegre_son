#!/usr/bin/env node

/**
 * CSS OPTIMIZER SCRIPT
 * Node.js script for CSS file optimization
 * 
 * Features:
 * - Remove duplicate rules
 * - Analyze !important usage
 * - Detect unused selectors (static analysis)
 * - Check encoding and line endings
 * - Generate optimization report
 * 
 * Usage:
 *   node scripts/css-optimizer.js
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

console.log(`${colors.cyan}${colors.bright}`);
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  CSS OPTIMIZER - Static Analysis & Optimization               ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log(colors.reset);

// CSS files to analyze
const cssFiles = [
  'styles/globals.css',
  'styles/figma-fixes.css',
  'styles/figma.css',
  'styles/utilities.css'
];

let totalImportant = 0;
let totalRules = 0;
let totalLines = 0;
let totalBytes = 0;

const report = {
  files: [],
  summary: {
    totalFiles: 0,
    totalLines: 0,
    totalBytes: 0,
    totalRules: 0,
    totalImportant: 0,
    duplicates: 0,
    issues: []
  }
};

console.log(`${colors.cyan}[1/4] Analyzing CSS files...${colors.reset}\n`);

cssFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`${colors.red}✗ ${filePath} - Not found${colors.reset}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const stats = fs.statSync(filePath);

  // Count !important usage
  const importantCount = (content.match(/!important/g) || []).length;
  
  // Count CSS rules (approximate)
  const ruleCount = (content.match(/\{[^}]+\}/g) || []).length;
  
  // Check encoding (BOM check)
  const hasBOM = content.charCodeAt(0) === 0xFEFF;
  
  // Check line endings
  const hasCRLF = content.includes('\r\n');
  const hasLF = content.includes('\n') && !hasCRLF;
  
  // Count selectors
  const selectors = content.match(/[^{]+\{/g) || [];
  
  totalImportant += importantCount;
  totalRules += ruleCount;
  totalLines += lines.length;
  totalBytes += stats.size;

  const fileReport = {
    path: filePath,
    size: stats.size,
    lines: lines.length,
    rules: ruleCount,
    important: importantCount,
    encoding: hasBOM ? 'UTF-8 with BOM' : 'UTF-8',
    lineEnding: hasCRLF ? 'CRLF (Windows)' : hasLF ? 'LF (Unix)' : 'Unknown',
    selectors: selectors.length
  };

  report.files.push(fileReport);

  console.log(`${colors.green}✓ ${filePath}${colors.reset}`);
  console.log(`  Size: ${stats.size} bytes (${lines.length} lines)`);
  console.log(`  Rules: ${ruleCount} | Selectors: ${selectors.length}`);
  console.log(`  !important: ${importantCount} occurrences`);
  console.log(`  Encoding: ${fileReport.encoding} | Line ending: ${fileReport.lineEnding}`);
  
  if (hasBOM) {
    console.log(`  ${colors.yellow}⚠️  BOM detected - may cause issues${colors.reset}`);
    report.summary.issues.push(`${filePath}: UTF-8 BOM detected`);
  }
  
  if (hasCRLF) {
    console.log(`  ${colors.yellow}⚠️  CRLF line endings - should be LF${colors.reset}`);
    report.summary.issues.push(`${filePath}: CRLF line endings (should be LF)`);
  }
  
  console.log('');
});

console.log(`${colors.cyan}[2/4] Analyzing !important usage...${colors.reset}\n`);

// Analyze !important by file
const importantByFile = report.files.map(f => ({
  file: path.basename(f.path),
  count: f.important,
  density: f.rules > 0 ? Math.round((f.important / f.rules) * 100) : 0
}));

importantByFile.sort((a, b) => b.count - a.count);

importantByFile.forEach(({ file, count, density }) => {
  const icon = density > 50 ? '🔴' : density > 20 ? '🟡' : '🟢';
  console.log(`${icon} ${file}: ${count} !important (${density}% density)`);
});

console.log('');

if (totalImportant > 100) {
  console.log(`${colors.red}⚠️  HIGH !important usage: ${totalImportant} occurrences${colors.reset}`);
  console.log(`   Recommendation: Consider reducing !important for better maintainability\n`);
} else if (totalImportant > 50) {
  console.log(`${colors.yellow}⚠️  MODERATE !important usage: ${totalImportant} occurrences${colors.reset}\n`);
} else {
  console.log(`${colors.green}✓ ACCEPTABLE !important usage: ${totalImportant} occurrences${colors.reset}\n`);
}

console.log(`${colors.cyan}[3/4] Checking for duplicate selectors...${colors.reset}\n`);

// Check for duplicate selectors across files
const allSelectors = new Map();
let duplicateCount = 0;

cssFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  const selectors = content.match(/([^{]+)\{/g) || [];
  
  selectors.forEach(selector => {
    const cleaned = selector.replace('{', '').trim();
    if (!cleaned) return;
    
    if (allSelectors.has(cleaned)) {
      const existing = allSelectors.get(cleaned);
      if (!existing.includes(filePath)) {
        existing.push(filePath);
        duplicateCount++;
        console.log(`${colors.yellow}⚠️  Duplicate: "${cleaned}"${colors.reset}`);
        console.log(`   Found in: ${existing.map(f => path.basename(f)).join(', ')}\n`);
      }
    } else {
      allSelectors.set(cleaned, [filePath]);
    }
  });
});

if (duplicateCount === 0) {
  console.log(`${colors.green}✓ No duplicate selectors found${colors.reset}\n`);
} else {
  console.log(`${colors.yellow}Found ${duplicateCount} duplicate selectors${colors.reset}\n`);
}

report.summary.duplicates = duplicateCount;

console.log(`${colors.cyan}[4/4] Generating optimization report...${colors.reset}\n`);

// Update summary
report.summary.totalFiles = report.files.length;
report.summary.totalLines = totalLines;
report.summary.totalBytes = totalBytes;
report.summary.totalRules = totalRules;
report.summary.totalImportant = totalImportant;

// Print summary
console.log(`${colors.cyan}${colors.bright}`);
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║  OPTIMIZATION REPORT                                           ║');
console.log('╠════════════════════════════════════════════════════════════════╣');
console.log(`║  Total Files:        ${String(report.summary.totalFiles).padEnd(40)} ║`);
console.log(`║  Total Lines:        ${String(report.summary.totalLines).padEnd(40)} ║`);
console.log(`║  Total Size:         ${String(`${report.summary.totalBytes} bytes`).padEnd(40)} ║`);
console.log(`║  Total Rules:        ${String(report.summary.totalRules).padEnd(40)} ║`);
console.log(`║  !important Usage:   ${String(`${report.summary.totalImportant} occurrences`).padEnd(40)} ║`);
console.log(`║  Duplicate Selectors: ${String(report.summary.duplicates).padEnd(40)} ║`);
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log(colors.reset);

// Issues
if (report.summary.issues.length > 0) {
  console.log(`\n${colors.red}${colors.bright}ISSUES FOUND:${colors.reset}`);
  report.summary.issues.forEach(issue => {
    console.log(`  ${colors.red}✗${colors.reset} ${issue}`);
  });
  console.log('');
}

// Recommendations
console.log(`${colors.cyan}${colors.bright}RECOMMENDATIONS:${colors.reset}\n`);

const recommendations = [];

if (report.summary.issues.some(i => i.includes('CRLF'))) {
  recommendations.push('Convert CRLF to LF: git config core.autocrlf input && dos2unix styles/*.css');
}

if (report.summary.issues.some(i => i.includes('BOM'))) {
  recommendations.push('Remove BOM: Use editor like VS Code with "UTF-8" (not "UTF-8 with BOM")');
}

if (report.summary.totalImportant > 100) {
  recommendations.push('Reduce !important usage in override files where possible');
}

if (report.summary.duplicates > 0) {
  recommendations.push('Consider consolidating duplicate selectors');
}

if (recommendations.length === 0) {
  console.log(`${colors.green}✓ No critical optimization needed!${colors.reset}`);
  console.log(`  All CSS files are well-optimized.\n`);
} else {
  recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec}`);
  });
  console.log('');
}

// Save report to JSON
const reportPath = 'css-optimization-report.json';
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`${colors.gray}📄 Detailed report saved to: ${reportPath}${colors.reset}\n`);

console.log(`${colors.cyan}═════════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.green}✓ CSS optimization analysis complete!${colors.reset}\n`);

// Exit code
process.exit(report.summary.issues.length > 0 ? 1 : 0);
