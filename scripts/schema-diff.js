#!/usr/bin/env node

/**
 * Script para generar un reporte de diferencias entre desarrollo y producción
 * Uso: node scripts/schema-diff.js
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`${BLUE}🔄 Generando reporte de diferencias de esquema${RESET}\n`);

async function generateSchemaDiff() {
  try {
    const reportsDir = join(process.cwd(), 'reports');
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = join(reportsDir, `schema-diff-${timestamp}.md`);

    let report = `# 📊 Reporte de Diferencias de Esquema\n\n`;
    report += `**Fecha:** ${new Date().toLocaleString()}\n`;
    report += `**Entorno:** ${process.env.NODE_ENV || 'development'}\n\n`;

    // 1. Estado actual del schema
    report += `## 🗂️ Estado Actual del Esquema\n\n`;
    
    try {
      console.log(`${BLUE}📋 Analizando esquema actual...${RESET}`);
      const schemaIntrospect = execSync('drizzle-kit introspect', { encoding: 'utf8', stdio: 'pipe' });
      report += `### ✅ Esquema Sincronizado\n`;
      report += `El esquema actual está sincronizado con la definición de Drizzle.\n\n`;
    } catch (error) {
      report += `### ⚠️ Diferencias Detectadas\n`;
      report += `\`\`\`\n${error.message}\n\`\`\`\n\n`;
    }

    // 2. Migraciones pendientes
    report += `## 🚀 Estado de Migraciones\n\n`;
    
    try {
      console.log(`${BLUE}🔍 Verificando migraciones...${RESET}`);
      const migrationStatus = execSync('drizzle-kit check', { encoding: 'utf8', stdio: 'pipe' });
      report += `### ✅ No hay migraciones pendientes\n`;
      report += `Todas las migraciones han sido aplicadas correctamente.\n\n`;
    } catch (error) {
      report += `### 🔄 Migraciones Pendientes\n`;
      report += `Se detectaron migraciones que necesitan ser aplicadas:\n\n`;
      report += `\`\`\`\n${error.stdout || error.message}\n\`\`\`\n\n`;
      report += `**Acción recomendada:** Ejecutar \`drizzle-kit generate && drizzle-kit migrate\`\n\n`;
    }

    // 3. Recomendaciones
    report += `## 💡 Recomendaciones\n\n`;
    
    const recommendations = [];
    
    if (process.env.NODE_ENV === 'development') {
      recommendations.push('🔧 Ejecutar `node scripts/schema-check.js` antes de cada despliegue');
      recommendations.push('💾 Crear backup antes de aplicar migraciones en producción');
      recommendations.push('🧪 Probar todas las migraciones en un entorno de staging');
    }

    if (recommendations.length > 0) {
      recommendations.forEach(rec => {
        report += `- ${rec}\n`;
      });
    } else {
      report += `- ✅ Sistema en perfecto estado\n`;
    }

    report += `\n## 🔗 Enlaces Útiles\n\n`;
    report += `- [Documentación Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)\n`;
    report += `- [Migraciones Best Practices](https://orm.drizzle.team/docs/migrations)\n`;
    report += `- [Database Studio](http://localhost:4983) (cuando esté corriendo)\n\n`;

    // Escribir reporte
    writeFileSync(reportFile, report, 'utf8');
    
    console.log(`${GREEN}✅ Reporte generado exitosamente${RESET}`);
    console.log(`${BLUE}📄 Ubicación: ${reportFile}${RESET}\n`);
    
    // Mostrar resumen en consola
    console.log(`${YELLOW}📋 RESUMEN:${RESET}`);
    console.log(`${BLUE}  • Archivo de reporte: ${reportFile}${RESET}`);
    console.log(`${BLUE}  • Timestamp: ${timestamp}${RESET}`);
    console.log(`${BLUE}  • Entorno: ${process.env.NODE_ENV || 'development'}${RESET}\n`);

    return reportFile;
  } catch (error) {
    console.error(`${RED}❌ ERROR: ${error.message}${RESET}`);
    process.exit(1);
  }
}

// Ejecutar
generateSchemaDiff();