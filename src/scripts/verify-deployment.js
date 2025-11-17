#!/usr/bin/env node

/**
 * Deployment Verification Script
 * 
 * This script performs automated checks before deployment.
 * Run with: node scripts/verify-deployment.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let passCount = 0;
let failCount = 0;
let warnCount = 0;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function pass(message) {
  passCount++;
  log(`✅ PASS: ${message}`, colors.green);
}

function fail(message) {
  failCount++;
  log(`❌ FAIL: ${message}`, colors.red);
}

function warn(message) {
  warnCount++;
  log(`⚠️  WARN: ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function header(message) {
  log(`\n${colors.bright}━━━ ${message} ━━━${colors.reset}`, colors.blue);
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(rootDir, filePath);
  if (fs.existsSync(fullPath)) {
    pass(`${description} exists`);
    return true;
  } else {
    fail(`${description} missing: ${filePath}`);
    return false;
  }
}

function checkFileSize(filePath, maxSizeMB, description) {
  const fullPath = path.join(rootDir, filePath);
  if (!fs.existsSync(fullPath)) {
    fail(`${description} not found for size check`);
    return false;
  }
  
  const stats = fs.statSync(fullPath);
  const sizeMB = stats.size / (1024 * 1024);
  
  if (sizeMB <= maxSizeMB) {
    pass(`${description} size OK (${sizeMB.toFixed(2)}MB <= ${maxSizeMB}MB)`);
    return true;
  } else {
    fail(`${description} too large (${sizeMB.toFixed(2)}MB > ${maxSizeMB}MB)`);
    return false;
  }
}

function checkJsonFile(filePath, description) {
  const fullPath = path.join(rootDir, filePath);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    JSON.parse(content);
    pass(`${description} is valid JSON`);
    return true;
  } catch (error) {
    fail(`${description} is invalid JSON: ${error.message}`);
    return false;
  }
}

function checkPackageJson() {
  const pkgPath = path.join(rootDir, 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    if (pkg.name === 'oxivo-management-system') {
      pass('package.json name is correct');
    } else {
      warn(`package.json name is "${pkg.name}", expected "oxivo-management-system"`);
    }
    
    if (pkg.version === '3.0.0') {
      pass('package.json version is 3.0.0');
    } else {
      warn(`package.json version is "${pkg.version}", expected "3.0.0"`);
    }
    
    const requiredScripts = ['dev', 'build', 'preview', 'typecheck', 'lint'];
    requiredScripts.forEach(script => {
      if (pkg.scripts && pkg.scripts[script]) {
        pass(`Script "${script}" exists`);
      } else {
        fail(`Script "${script}" missing`);
      }
    });
    
    return true;
  } catch (error) {
    fail(`Failed to check package.json: ${error.message}`);
    return false;
  }
}

function checkDistFolder() {
  const distPath = path.join(rootDir, 'dist');
  
  if (!fs.existsSync(distPath)) {
    warn('dist/ folder not found - run "npm run build" first');
    return false;
  }
  
  pass('dist/ folder exists');
  
  // Check for index.html
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    pass('dist/index.html exists');
  } else {
    fail('dist/index.html missing');
    return false;
  }
  
  // Check dist size
  const distSize = getDirectorySize(distPath);
  const distSizeMB = distSize / (1024 * 1024);
  
  info(`dist/ folder size: ${distSizeMB.toFixed(2)}MB`);
  
  if (distSizeMB < 1) {
    pass('dist/ folder size is optimal (< 1MB)');
  } else if (distSizeMB < 2) {
    warn('dist/ folder size is acceptable but could be optimized');
  } else {
    fail('dist/ folder is too large (> 2MB)');
  }
  
  return true;
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function traverse(currentPath) {
    const files = fs.readdirSync(currentPath);
    files.forEach(file => {
      const filePath = path.join(currentPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        traverse(filePath);
      } else {
        totalSize += stats.size;
      }
    });
  }
  
  traverse(dirPath);
  return totalSize;
}

function checkGitignore() {
  const gitignorePath = path.join(rootDir, '.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    fail('.gitignore file missing');
    return false;
  }
  
  pass('.gitignore exists');
  
  const content = fs.readFileSync(gitignorePath, 'utf8');
  const requiredEntries = ['node_modules', 'dist', '.env', '.DS_Store'];
  
  requiredEntries.forEach(entry => {
    if (content.includes(entry)) {
      pass(`.gitignore includes "${entry}"`);
    } else {
      warn(`.gitignore missing "${entry}"`);
    }
  });
  
  return true;
}

function checkEnvExample() {
  const envExamplePath = path.join(rootDir, '.env.example');
  
  if (fs.existsSync(envExamplePath)) {
    pass('.env.example exists');
    return true;
  } else {
    warn('.env.example not found - consider creating one for documentation');
    return false;
  }
}

function checkDocumentation() {
  const docs = [
    ['README.md', 'README'],
    ['PROJECT_STATUS.md', 'Project Status'],
    ['QUICK_START.md', 'Quick Start Guide'],
    ['DEPLOYMENT.md', 'Deployment Guide'],
    ['TROUBLESHOOTING.md', 'Troubleshooting Guide'],
    ['CHANGELOG.md', 'Changelog'],
    ['PRE_DEPLOY_CHECKLIST.md', 'Pre-Deploy Checklist'],
  ];
  
  docs.forEach(([file, description]) => {
    checkFileExists(file, description);
  });
}

function checkWorkflows() {
  const workflowsPath = path.join(rootDir, 'workflows');
  const githubWorkflowsPath = path.join(rootDir, '.github', 'workflows');
  
  if (fs.existsSync(githubWorkflowsPath)) {
    pass('GitHub workflows in correct location (.github/workflows/)');
    return true;
  } else if (fs.existsSync(workflowsPath)) {
    warn('Workflows found in /workflows/ - should be in .github/workflows/');
    info('See WORKFLOW_SETUP.md for migration instructions');
    return false;
  } else {
    warn('No GitHub Actions workflows found');
    return false;
  }
}

function checkTypeScriptConfig() {
  const tsconfigPath = path.join(rootDir, 'tsconfig.json');
  
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    if (tsconfig.compilerOptions) {
      pass('tsconfig.json has compilerOptions');
      
      if (tsconfig.compilerOptions.strict) {
        pass('TypeScript strict mode enabled');
      } else {
        warn('TypeScript strict mode not enabled');
      }
    } else {
      fail('tsconfig.json missing compilerOptions');
    }
    
    return true;
  } catch (error) {
    fail(`Failed to check tsconfig.json: ${error.message}`);
    return false;
  }
}

function checkViteConfig() {
  const viteConfigPath = path.join(rootDir, 'vite.config.ts');
  
  if (fs.existsSync(viteConfigPath)) {
    pass('vite.config.ts exists');
    return true;
  } else {
    fail('vite.config.ts missing');
    return false;
  }
}

function checkTailwindConfig() {
  const tailwindConfigPath = path.join(rootDir, 'tailwind.config.js');
  
  if (fs.existsSync(tailwindConfigPath)) {
    pass('tailwind.config.js exists');
    return true;
  } else {
    fail('tailwind.config.js missing');
    return false;
  }
}

function printSummary() {
  header('SUMMARY');
  
  const total = passCount + failCount + warnCount;
  
  log(`\n📊 Results:`);
  log(`   ✅ Passed:   ${passCount}`, colors.green);
  log(`   ❌ Failed:   ${failCount}`, colors.red);
  log(`   ⚠️  Warnings: ${warnCount}`, colors.yellow);
  log(`   ━━━━━━━━━━━━━━━━━━`);
  log(`   📝 Total:    ${total}\n`);
  
  if (failCount === 0 && warnCount === 0) {
    log('🎉 ALL CHECKS PASSED! Ready for deployment! 🚀', colors.green);
    return true;
  } else if (failCount === 0) {
    log('✅ All critical checks passed!', colors.green);
    log(`⚠️  ${warnCount} warnings - review before deployment`, colors.yellow);
    return true;
  } else {
    log(`❌ ${failCount} checks failed - fix before deployment!`, colors.red);
    return false;
  }
}

// Main execution
async function main() {
  log('\n' + '═'.repeat(60));
  log(`${colors.bright}   🔍 Oxivo Management System - Deployment Verification${colors.reset}`);
  log('═'.repeat(60) + '\n');
  
  info('Starting verification checks...\n');
  
  header('ESSENTIAL FILES');
  checkFileExists('package.json', 'package.json');
  checkFileExists('tsconfig.json', 'tsconfig.json');
  checkFileExists('vite.config.ts', 'vite.config.ts');
  checkFileExists('tailwind.config.js', 'tailwind.config.js');
  checkFileExists('index.html', 'index.html');
  checkFileExists('.gitignore', '.gitignore');
  
  header('PACKAGE.JSON');
  checkPackageJson();
  
  header('DOCUMENTATION');
  checkDocumentation();
  
  header('CONFIGURATION FILES');
  checkTypeScriptConfig();
  checkViteConfig();
  checkTailwindConfig();
  checkGitignore();
  checkEnvExample();
  
  header('GITHUB WORKFLOWS');
  checkWorkflows();
  
  header('BUILD OUTPUT');
  checkDistFolder();
  
  header('SOURCE FILES');
  checkFileExists('App.tsx', 'App.tsx (main component)');
  checkFileExists('main.tsx', 'main.tsx (entry point)');
  checkFileExists('components', 'components/ directory');
  checkFileExists('utils', 'utils/ directory');
  checkFileExists('hooks', 'hooks/ directory');
  
  const success = printSummary();
  
  if (success) {
    log('\n✅ Next steps:');
    log('   1. Review PRE_DEPLOY_CHECKLIST.md');
    log('   2. Run: npm run build');
    log('   3. Run: npm run preview');
    log('   4. Follow DEPLOYMENT.md\n');
    process.exit(0);
  } else {
    log('\n❌ Action required:');
    log('   1. Fix failed checks above');
    log('   2. Run this script again');
    log('   3. Do not deploy until all checks pass\n');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log(`\n❌ Script error: ${error.message}`, colors.red);
  process.exit(1);
});
