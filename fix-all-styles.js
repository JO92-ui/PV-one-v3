const fs = require('fs');
const path = require('path');

// Read HTML file
const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Counter for unique class names
let classCounter = 0;
const styleMap = new Map();

// Function to generate unique class name
function generateClassName(styles) {
  // Check if we already have this exact style
  for (const [className, existingStyles] of styleMap.entries()) {
    if (existingStyles === styles) {
      return className;
    }
  }
  
  // Create new class name
  const className = `inline-style-${++classCounter}`;
  styleMap.set(className, styles);
  return className;
}

// Extract and replace inline styles
html = html.replace(/(<[^>]+)\s+style="([^"]+)"([^>]*>)/g, (match, before, styles, after) => {
  // Skip if it's just display:none (keep for JS manipulation)
  if (styles.trim() === 'display:none') {
    return match;
  }
  
  const className = generateClassName(styles);
  
  // Check if element already has a class attribute
  const classMatch = before.match(/class="([^"]*)"/);
  if (classMatch) {
    // Add to existing class
    const newBefore = before.replace(/class="([^"]*)"/, `class="$1 ${className}"`);
    return `${newBefore}${after}`;
  } else {
    // Add new class attribute
    return `${before} class="${className}"${after}`;
  }
});

// Generate CSS content
let cssContent = `/* Auto-generated CSS from inline styles */\n/* Generated on: ${new Date().toLocaleString()} */\n\n`;

for (const [className, styles] of styleMap.entries()) {
  // Parse and format styles
  const formattedStyles = styles
    .split(';')
    .filter(s => s.trim())
    .map(s => '  ' + s.trim())
    .join(';\n');
  
  cssContent += `.${className} {\n${formattedStyles};\n}\n\n`;
}

// Write CSS file
const cssPath = path.join(__dirname, 'styles', 'inline-fixes.css');
fs.writeFileSync(cssPath, cssContent, 'utf8');

// Add CSS link to HTML if not present
if (!html.includes('inline-fixes.css')) {
  html = html.replace(
    /<\/head>/,
    '  <link rel="stylesheet" href="styles/inline-fixes.css" />\n</head>'
  );
}

// Write updated HTML
fs.writeFileSync(htmlPath, html, 'utf8');

console.log(`\n✅ Procesamiento completado:`);
console.log(`   - ${styleMap.size} estilos únicos movidos a CSS`);
console.log(`   - Archivo generado: styles/inline-fixes.css`);
console.log(`   - HTML actualizado con referencia al CSS\n`);
