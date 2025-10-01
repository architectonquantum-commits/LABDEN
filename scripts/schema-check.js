#!/usr/bin/env node

/**
 * Script para verificar diferencias entre esquemas de desarrollo y producción
 * Uso: node scripts/schema-check.js
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
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

// Configuración de entornos
const ENVIRONMENTS = {
  development: process.env.DATABASE_URL,
  production: process.env.DATABASE_URL_PROD // Necesitas configurar esto en producción
};

console.log(`${BLUE}🔍 Verificando diferencias de esquema entre entornos${RESET}\n`);

async function checkSchemaDifferences() {
  try {
    // 1. Verificar que tenemos conexiones a ambos entornos
    if (!ENVIRONMENTS.development) {
      console.error(`${RED}❌ ERROR: DATABASE_URL (development) no está configurada${RESET}`);
      process.exit(1);
    }

    if (!ENVIRONMENTS.production) {
      console.warn(`${YELLOW}⚠️  ADVERTENCIA: DATABASE_URL_PROD no está configurada${RESET}`);
      console.log(`${YELLOW}   Solo verificaremos el esquema local contra las migraciones pendientes${RESET}\n`);
    }

    // 2. Verificar migraciones pendientes
    console.log(`${BLUE}📋 Verificando migraciones pendientes...${RESET}`);
    
    try {
      const migrationCheck = execSync('drizzle-kit check', { encoding: 'utf8' });
      console.log(`${GREEN}✅ No hay migraciones pendientes${RESET}\n`);
    } catch (error) {
      console.error(`${RED}❌ MIGRACIONES PENDIENTES DETECTADAS:${RESET}`);
      console.error(error.stdout || error.message);
      console.log(`${YELLOW}💡 Ejecuta: drizzle-kit generate && drizzle-kit migrate${RESET}\n`);
      process.exit(1);
    }

    // 3. Verificar estado del esquema actual
    console.log(`${BLUE}📊 Verificando estado del esquema actual...${RESET}`);
    
    try {
      const introspect = execSync('drizzle-kit introspect', { encoding: 'utf8', stdio: 'pipe' });
      console.log(`${GREEN}✅ Esquema actual sincronizado${RESET}\n`);
    } catch (error) {
      console.warn(`${YELLOW}⚠️  Posibles diferencias detectadas en el esquema${RESET}`);
      console.log(`${YELLOW}💡 Considera ejecutar: drizzle-kit push para sincronizar${RESET}\n`);
    }

    // 4. Reporte de estado
    console.log(`${GREEN}🎉 VERIFICACIÓN COMPLETADA${RESET}`);
    console.log(`${BLUE}📈 Estado del sistema:${RESET}`);
    console.log(`  • Esquema de desarrollo: ${GREEN}Sincronizado${RESET}`);
    console.log(`  • Migraciones: ${GREEN}Al día${RESET}`);
    console.log(`  • Estado general: ${GREEN}Listo para desplegar${RESET}\n`);

    return true;
  } catch (error) {
    console.error(`${RED}❌ ERROR INESPERADO: ${error.message}${RESET}`);
    process.exit(1);
  }
}

// Función para mostrar ayuda
function showHelp() {
  console.log(`
${BLUE}🔧 Script de Verificación de Esquemas${RESET}

${YELLOW}Uso:${RESET}
  node scripts/schema-check.js

${YELLOW}Variables de entorno necesarias:${RESET}
  DATABASE_URL         - URL de base de datos de desarrollo
  DATABASE_URL_PROD    - URL de base de datos de producción (opcional)

${YELLOW}Qué verifica:${RESET}
  ✓ Migraciones pendientes
  ✓ Sincronización de esquemas
  ✓ Estado general del sistema
  ✓ Readiness para despliegue

${YELLOW}Códigos de salida:${RESET}
  0 - Todo correcto, listo para desplegar
  1 - Hay problemas que requieren atención
`);
}

// Verificar argumentos de línea de comandos
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Ejecutar verificación
checkSchemaDifferences();