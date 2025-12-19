#!/usr/bin/env node

/**
 * 🚀 Pre-Deployment Checklist Script
 * 
 * Bu script deployment öncesi tüm kritik kontrolleri yapar.
 * Kullanım: node scripts/pre-deploy-checklist.js
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// ANSI Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`),
};

// Checklist items
const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function checkFile(filePath, description) {
  const fullPath = resolve(rootDir, filePath);
  if (existsSync(fullPath)) {
    log.success(`${description} - ${filePath}`);
    checks.passed++;
    return true;
  } else {
    log.error(`${description} eksik - ${filePath}`);
    checks.failed++;
    return false;
  }
}

function checkPackageJson() {
  log.header('📦 Package.json Kontrolü');
  
  try {
    const packageJson = JSON.parse(
      readFileSync(resolve(rootDir, 'package.json'), 'utf-8')
    );

    // Check required scripts
    const requiredScripts = ['build', 'dev', 'preview'];
    requiredScripts.forEach(script => {
      if (packageJson.scripts[script]) {
        log.success(`Script mevcut: ${script}`);
        checks.passed++;
      } else {
        log.error(`Script eksik: ${script}`);
        checks.failed++;
      }
    });

    // Check critical dependencies
    const criticalDeps = [
      'react',
      'react-dom',
      'vite',
      '@supabase/supabase-js',
      'tailwindcss',
    ];

    criticalDeps.forEach(dep => {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        log.success(`Dependency mevcut: ${dep}`);
        checks.passed++;
      } else {
        log.error(`Dependency eksik: ${dep}`);
        checks.failed++;
      }
    });

    // Check version
    if (packageJson.version) {
      log.success(`Version: ${packageJson.version}`);
      checks.passed++;
    } else {
      log.warning('Version belirtilmemiş');
      checks.warnings++;
    }

  } catch (error) {
    log.error(`package.json okunamadı: ${error.message}`);
    checks.failed++;
  }
}

function checkConfigFiles() {
  log.header('⚙️ Konfigürasyon Dosyaları');

  const configFiles = [
    { path: 'vercel.json', desc: 'Vercel config' },
    { path: 'vite.config.ts', desc: 'Vite config' },
    { path: 'tsconfig.json', desc: 'TypeScript config' },
    { path: 'tailwind.config.js', desc: 'Tailwind config' },
    { path: 'postcss.config.js', desc: 'PostCSS config' },
  ];

  configFiles.forEach(({ path, desc }) => checkFile(path, desc));
}

function checkSourceFiles() {
  log.header('📁 Kaynak Dosyaları');

  const sourceFiles = [
    { path: 'App.tsx', desc: 'Ana uygulama' },
    { path: 'main.tsx', desc: 'Entry point' },
    { path: 'index.html', desc: 'HTML template' },
    { path: 'utils/supabaseClient.ts', desc: 'Supabase client' },
    { path: 'utils/authBypass.tsx', desc: 'Auth bypass' },
  ];

  sourceFiles.forEach(({ path, desc }) => checkFile(path, desc));
}

function checkVercelConfig() {
  log.header('🔧 Vercel Konfigürasyonu');

  try {
    const vercelConfig = JSON.parse(
      readFileSync(resolve(rootDir, 'vercel.json'), 'utf-8')
    );

    // Check build settings
    if (vercelConfig.buildCommand) {
      log.success(`Build command: ${vercelConfig.buildCommand}`);
      checks.passed++;
    } else {
      log.error('Build command tanımlı değil');
      checks.failed++;
    }

    if (vercelConfig.outputDirectory) {
      log.success(`Output directory: ${vercelConfig.outputDirectory}`);
      checks.passed++;
    } else {
      log.error('Output directory tanımlı değil');
      checks.failed++;
    }

    // Check rewrites for SPA
    if (vercelConfig.rewrites && vercelConfig.rewrites.length > 0) {
      log.success('SPA rewrites configured');
      checks.passed++;
    } else {
      log.warning('SPA rewrites eksik olabilir');
      checks.warnings++;
    }

    // Check headers
    if (vercelConfig.headers && vercelConfig.headers.length > 0) {
      log.success('Cache headers configured');
      checks.passed++;
    } else {
      log.warning('Cache headers tanımlı değil');
      checks.warnings++;
    }

  } catch (error) {
    log.error(`vercel.json okunamadı: ${error.message}`);
    checks.failed++;
  }
}

function checkEnvironmentVariables() {
  log.header('🔐 Environment Variables Kontrolü');

  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  log.info('Aşağıdaki environment variable\'lar Vercel dashboard\'da ayarlanmalı:');
  requiredEnvVars.forEach(envVar => {
    log.info(`  - ${envVar}`);
  });

  log.warning('Environment variable\'ları manuel olarak kontrol edin!');
  checks.warnings++;
}

function checkGitignore() {
  log.header('📝 .gitignore Kontrolü');

  try {
    const gitignore = readFileSync(resolve(rootDir, '.gitignore'), 'utf-8');
    
    const criticalPatterns = [
      'node_modules',
      'dist',
      '.env',
      '.env.local',
    ];

    criticalPatterns.forEach(pattern => {
      if (gitignore.includes(pattern)) {
        log.success(`Pattern mevcut: ${pattern}`);
        checks.passed++;
      } else {
        log.warning(`Pattern eksik: ${pattern}`);
        checks.warnings++;
      }
    });

  } catch (error) {
    log.error(`.gitignore okunamadı: ${error.message}`);
    checks.failed++;
  }
}

function checkBuildOutput() {
  log.header('🏗️ Build Output Kontrolü');

  if (existsSync(resolve(rootDir, 'dist'))) {
    log.success('dist/ klasörü mevcut');
    checks.passed++;
    
    // Check index.html in dist
    if (existsSync(resolve(rootDir, 'dist', 'index.html'))) {
      log.success('dist/index.html mevcut');
      checks.passed++;
    } else {
      log.warning('dist/index.html bulunamadı - Build yapın: npm run build');
      checks.warnings++;
    }
  } else {
    log.warning('dist/ klasörü yok - Build yapın: npm run build');
    checks.warnings++;
  }
}

function checkTypeScript() {
  log.header('🔷 TypeScript Kontrolü');

  try {
    const tsconfig = JSON.parse(
      readFileSync(resolve(rootDir, 'tsconfig.json'), 'utf-8')
    );

    if (tsconfig.compilerOptions) {
      log.success('TypeScript config mevcut');
      checks.passed++;

      // Check strict mode
      if (tsconfig.compilerOptions.strict) {
        log.success('Strict mode enabled');
        checks.passed++;
      } else {
        log.warning('Strict mode disabled - Önerilir');
        checks.warnings++;
      }

      // Check module resolution
      if (tsconfig.compilerOptions.moduleResolution) {
        log.success(`Module resolution: ${tsconfig.compilerOptions.moduleResolution}`);
        checks.passed++;
      }
    }

  } catch (error) {
    log.error(`tsconfig.json okunamadı: ${error.message}`);
    checks.failed++;
  }
}

function printSummary() {
  log.header('📊 Özet Rapor');

  const total = checks.passed + checks.failed + checks.warnings;
  
  console.log(`${colors.green}✅ Başarılı:${colors.reset} ${checks.passed}`);
  console.log(`${colors.red}❌ Başarısız:${colors.reset} ${checks.failed}`);
  console.log(`${colors.yellow}⚠️  Uyarı:${colors.reset} ${checks.warnings}`);
  console.log(`${colors.blue}📊 Toplam:${colors.reset} ${total}\n`);

  // Success rate
  const successRate = ((checks.passed / total) * 100).toFixed(1);
  
  if (checks.failed === 0 && successRate >= 80) {
    console.log(`${colors.green}${colors.bold}🎉 DEPLOYMENT READY! (${successRate}% başarı)${colors.reset}\n`);
    console.log(`${colors.cyan}Sonraki adım: git push origin main${colors.reset}\n`);
    process.exit(0);
  } else if (checks.failed === 0) {
    console.log(`${colors.yellow}${colors.bold}⚠️  DEPLOYMENT POSSIBLE (${successRate}% başarı)${colors.reset}\n`);
    console.log(`${colors.yellow}Bazı uyarılar var, ancak deploy edilebilir.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bold}❌ DEPLOYMENT BLOCKED (${successRate}% başarı)${colors.reset}\n`);
    console.log(`${colors.red}Önce başarısız kontrolleri düzeltin!${colors.reset}\n`);
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log(`\n${colors.bold}${colors.cyan}🚀 Pre-Deployment Checklist${colors.reset}\n`);
  console.log(`${colors.blue}Proje: Oxivo Management System${colors.reset}`);
  console.log(`${colors.blue}Tarih: ${new Date().toLocaleDateString('tr-TR')}${colors.reset}\n`);

  checkPackageJson();
  checkConfigFiles();
  checkSourceFiles();
  checkVercelConfig();
  checkEnvironmentVariables();
  checkGitignore();
  checkBuildOutput();
  checkTypeScript();
  printSummary();
}

main().catch(error => {
  log.error(`Script hatası: ${error.message}`);
  process.exit(1);
});
