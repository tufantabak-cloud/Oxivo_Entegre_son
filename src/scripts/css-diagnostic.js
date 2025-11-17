/**
 * CSS DIAGNOSTIC SCRIPT
 * OxivoPlatform - React + Vite
 * 
 * Run this in browser console to diagnose CSS loading and computed styles
 * Usage: Copy/paste into console or import via script tag
 */

(function() {
  console.log('🔍 CSS DIAGNOSTIC TOOL STARTED\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1. CHECK CSS FILES LOADED
  console.log('📄 CSS FILES LOADED:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const stylesheets = Array.from(document.styleSheets);
  let cssFilesLoaded = 0;
  
  stylesheets.forEach((sheet, index) => {
    try {
      const href = sheet.href || 'inline';
      const rulesCount = sheet.cssRules ? sheet.cssRules.length : 0;
      
      if (href.includes('globals.css')) {
        console.log(`✅ globals.css loaded (${rulesCount} rules)`);
        cssFilesLoaded++;
      } else if (href.includes('figma.css')) {
        console.log(`✅ figma.css loaded (${rulesCount} rules)`);
        cssFilesLoaded++;
      } else if (href.includes('utilities.css')) {
        console.log(`✅ utilities.css loaded (${rulesCount} rules)`);
        cssFilesLoaded++;
      } else if (href === 'inline') {
        console.log(`📝 Inline stylesheet #${index + 1} (${rulesCount} rules)`);
      }
    } catch (e) {
      console.log(`⚠️ Cannot access stylesheet #${index + 1} (CORS restriction)`);
    }
  });
  
  console.log(`\n📊 Total stylesheets: ${stylesheets.length}`);
  console.log(`📊 Custom CSS files loaded: ${cssFilesLoaded}/3`);
  
  if (cssFilesLoaded < 3) {
    console.warn(`\n⚠️ WARNING: Only ${cssFilesLoaded}/3 CSS files loaded!`);
    console.warn('Expected: globals.css, figma.css, utilities.css');
    console.warn('Check main.tsx imports and vite.config.ts');
  }

  // 2. CHECK COMPUTED STYLES FOR CRITICAL ELEMENTS
  console.log('\n\n🎨 COMPUTED STYLES FOR CRITICAL ELEMENTS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const criticalSelectors = [
    { name: 'Header', selector: 'header' },
    { name: 'H1 (Main Title)', selector: 'h1' },
    { name: 'Nav Button (Active)', selector: 'nav button.bg-blue-600' },
    { name: 'Nav Button (Inactive)', selector: 'nav button.text-gray-700' },
    { name: 'Stat Card', selector: '.hover\\:shadow-md' },
    { name: 'Stat Number (h3)', selector: 'h3.text-3xl' },
    { name: 'Progress Bar Container', selector: '.bg-gray-200.rounded-full' },
    { name: 'Progress Bar Fill', selector: '.bg-blue-600.rounded-full' },
    { name: 'Badge', selector: '.bg-green-100' },
    { name: 'Export Button', selector: 'button.gap-2' }
  ];

  criticalSelectors.forEach(({ name, selector }) => {
    const element = document.querySelector(selector);
    
    if (!element) {
      console.log(`❌ ${name} [${selector}]`);
      console.log('   → Element not found in DOM\n');
      return;
    }

    const computed = window.getComputedStyle(element);
    
    console.log(`✅ ${name} [${selector}]`);
    console.log('   Properties:');
    console.log(`   ├─ font-size: ${computed.fontSize}`);
    console.log(`   ├─ font-weight: ${computed.fontWeight}`);
    console.log(`   ├─ color: ${computed.color}`);
    console.log(`   ├─ background: ${computed.backgroundColor}`);
    console.log(`   ├─ padding: ${computed.padding}`);
    console.log(`   ├─ margin: ${computed.margin}`);
    console.log(`   ├─ border-radius: ${computed.borderRadius}`);
    console.log(`   ├─ box-shadow: ${computed.boxShadow}`);
    console.log(`   ├─ line-height: ${computed.lineHeight}`);
    console.log(`   └─ letter-spacing: ${computed.letterSpacing}\n`);
  });

  // 3. FIGMA DESIGN EXPECTATIONS vs ACTUAL
  console.log('\n📐 FIGMA DESIGN EXPECTATIONS vs ACTUAL:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const expectations = {
    'H1 Title': {
      selector: 'h1',
      expected: {
        fontSize: '48px',
        fontWeight: '700',
        color: 'rgb(37, 99, 235)', // blue-600
        lineHeight: '1.2'
      }
    },
    'H2 Module Title': {
      selector: 'h2.text-2xl',
      expected: {
        fontSize: '24px',
        fontWeight: '700',
        color: 'rgb(17, 24, 39)', // gray-900
        lineHeight: '1.5'
      }
    },
    'Stat Number': {
      selector: 'h3.text-3xl',
      expected: {
        fontSize: '30px',
        fontWeight: '700',
        lineHeight: '1.2'
      }
    },
    'Nav Button Active': {
      selector: 'nav button.bg-blue-600',
      expected: {
        backgroundColor: 'rgb(37, 99, 235)',
        color: 'rgb(255, 255, 255)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        padding: '10px 16px'
      }
    },
    'Icon Size (nav)': {
      selector: 'nav svg',
      expected: {
        width: '18px',
        height: '18px'
      }
    },
    'Icon Size (stat)': {
      selector: '.bg-blue-50 svg',
      expected: {
        width: '28px',
        height: '28px'
      }
    }
  };

  Object.entries(expectations).forEach(([name, { selector, expected }]) => {
    const element = document.querySelector(selector);
    
    if (!element) {
      console.log(`❌ ${name}`);
      console.log(`   Selector: ${selector}`);
      console.log('   Status: Element not found\n');
      return;
    }

    const computed = window.getComputedStyle(element);
    let mismatches = 0;

    console.log(`\n📋 ${name} [${selector}]`);
    
    Object.entries(expected).forEach(([prop, expectedValue]) => {
      const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      const actualValue = computed[camelProp];
      
      // Normalize values for comparison
      const normalizedExpected = expectedValue.toString().toLowerCase().replace(/\s+/g, '');
      const normalizedActual = actualValue.toString().toLowerCase().replace(/\s+/g, '');
      
      const match = normalizedExpected === normalizedActual || 
                    normalizedActual.includes(normalizedExpected) ||
                    normalizedExpected.includes(normalizedActual);
      
      if (match) {
        console.log(`   ✅ ${prop}: ${actualValue}`);
      } else {
        console.log(`   ❌ ${prop}:`);
        console.log(`      Expected: ${expectedValue}`);
        console.log(`      Actual: ${actualValue}`);
        mismatches++;
      }
    });

    if (mismatches > 0) {
      console.log(`   ⚠️ ${mismatches} mismatches found!`);
    }
  });

  // 4. TAILWIND UTILITIES CHECK
  console.log('\n\n🎨 TAILWIND UTILITIES CHECK:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const tailwindClasses = [
    'text-3xl',
    'text-2xl',
    'font-bold',
    'text-blue-600',
    'text-gray-900',
    'shadow-md',
    'hover:shadow-lg',
    'gap-2',
    'rounded-lg',
    'bg-blue-50',
    'transition-shadow'
  ];

  const testDiv = document.createElement('div');
  document.body.appendChild(testDiv);

  tailwindClasses.forEach(className => {
    testDiv.className = className;
    const computed = window.getComputedStyle(testDiv);
    
    console.log(`📌 .${className}`);
    
    if (className.includes('text-')) {
      console.log(`   font-size: ${computed.fontSize}`);
      console.log(`   color: ${computed.color}`);
    } else if (className.includes('font-')) {
      console.log(`   font-weight: ${computed.fontWeight}`);
    } else if (className.includes('shadow')) {
      console.log(`   box-shadow: ${computed.boxShadow}`);
    } else if (className.includes('gap')) {
      console.log(`   gap: ${computed.gap}`);
    } else if (className.includes('rounded')) {
      console.log(`   border-radius: ${computed.borderRadius}`);
    } else if (className.includes('bg-')) {
      console.log(`   background-color: ${computed.backgroundColor}`);
    } else if (className.includes('transition')) {
      console.log(`   transition: ${computed.transition}`);
    }
    console.log('');
  });

  document.body.removeChild(testDiv);

  // 5. CSS VARIABLES CHECK
  console.log('\n🎨 CSS VARIABLES (Custom Properties):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const rootStyles = window.getComputedStyle(document.documentElement);
  const cssVars = [
    '--font-size',
    '--text-2xl',
    '--text-xl',
    '--text-lg',
    '--font-weight-medium',
    '--font-weight-normal',
    '--primary',
    '--background',
    '--foreground',
    '--border',
    '--radius'
  ];

  cssVars.forEach(varName => {
    const value = rootStyles.getPropertyValue(varName).trim();
    if (value) {
      console.log(`✅ ${varName}: ${value}`);
    } else {
      console.log(`❌ ${varName}: not defined`);
    }
  });

  // 6. PERFORMANCE METRICS
  console.log('\n\n⚡ PERFORMANCE METRICS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (window.performance && window.performance.getEntriesByType) {
    const cssResources = window.performance.getEntriesByType('resource').filter(
      r => r.name.endsWith('.css')
    );
    
    if (cssResources.length > 0) {
      console.log('CSS File Load Times:');
      cssResources.forEach(resource => {
        const fileName = resource.name.split('/').pop();
        console.log(`  ${fileName}: ${resource.duration.toFixed(2)}ms`);
      });
    } else {
      console.log('⚠️ CSS files loaded via bundler (no separate resources)');
    }
    
    const totalLoadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    console.log(`\nTotal page load time: ${totalLoadTime}ms`);
  }

  // 7. RECOMMENDATIONS
  console.log('\n\n💡 RECOMMENDATIONS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const recommendations = [];

  if (cssFilesLoaded < 3) {
    recommendations.push('⚠️ Missing CSS files - check main.tsx imports');
  }

  // Check if critical elements exist
  const h1 = document.querySelector('h1');
  if (h1) {
    const h1Styles = window.getComputedStyle(h1);
    if (parseInt(h1Styles.fontSize) < 48) {
      recommendations.push('📏 H1 font-size should be 48px (3rem)');
    }
  }

  const navButtons = document.querySelectorAll('nav button');
  if (navButtons.length > 0) {
    const activeButton = Array.from(navButtons).find(btn => 
      btn.classList.contains('bg-blue-600')
    );
    if (activeButton) {
      const btnStyles = window.getComputedStyle(activeButton);
      if (!btnStyles.boxShadow || btnStyles.boxShadow === 'none') {
        recommendations.push('🎨 Nav buttons missing box-shadow');
      }
    }
  }

  if (recommendations.length === 0) {
    console.log('✅ No critical issues found!');
    console.log('All CSS files loaded and styles appear correct.');
  } else {
    recommendations.forEach(rec => console.log(rec));
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 CSS DIAGNOSTIC COMPLETE\n');
  console.log('💾 To save this report: Right-click console → Save as...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Return diagnostic data for programmatic access
  return {
    cssFilesLoaded,
    totalStylesheets: stylesheets.length,
    mismatches: criticalSelectors.filter(({ selector }) => 
      !document.querySelector(selector)
    ).length,
    recommendations: recommendations.length
  };
})();
