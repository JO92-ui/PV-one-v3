/**
 * Script para eliminar TODOS los estilos inline del HTML
 * y restaurar una versión limpia que use solo las clases CSS del <style>
 */

const fs = require('fs');
const path = require('path');

const HTML_FILE = path.join(__dirname, 'index.html');
const BACKUP_FILE = path.join(__dirname, 'index.html.backup');

// Crear backup
console.log('📦 Creando backup en index.html.backup...');
fs.copyFileSync(HTML_FILE, BACKUP_FILE);

// Leer el HTML
let html = fs.readFileSync(HTML_FILE, 'utf8');

// Contador de cambios
let changesCount = 0;

// Función para remover estilos inline preservando otros atributos
function removeInlineStyles(htmlContent) {
  // Pattern para encontrar style="..." y style='...'
  const stylePattern = /\s+style\s*=\s*["']([^"']*)["']/gi;
  
  const cleaned = htmlContent.replace(stylePattern, (match) => {
    changesCount++;
    return ''; // Eliminar completamente el atributo style
  });
  
  return cleaned;
}

// Limpiar el HTML
console.log('🧹 Eliminando estilos inline...');
const cleanedHTML = removeInlineStyles(html);

// Guardar el resultado
fs.writeFileSync(HTML_FILE, cleanedHTML, 'utf8');

console.log(`✅ Listo! Se eliminaron ${changesCount} atributos style inline`);
console.log(`📄 Backup guardado en: ${BACKUP_FILE}`);
console.log(`✨ HTML limpio guardado en: ${HTML_FILE}`);
console.log('\n💡 Si algo sale mal, puedes restaurar desde el backup:');
console.log(`   Copy-Item "${BACKUP_FILE}" "${HTML_FILE}"`);
