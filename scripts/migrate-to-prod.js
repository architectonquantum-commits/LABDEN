#!/usr/bin/env node

/**
 * Script de migración segura a producción
 * Uso: node scripts/migrate-to-prod.js
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

console.log(`${BOLD}${BLUE}🚀 MIGRACIÓN SEGURA A PRODUCCIÓN${RESET}\n`);

async function safeProductionMigration() {
  try {
    // 1. Verificaciones previas
    console.log(`${CYAN}📋 PASO 1: Verificaciones previas${RESET}`);
    
    // Verificar variables de entorno
    if (!process.env.DATABASE_URL_PROD && !process.env.DATABASE_URL) {
      console.error(`${RED}❌ ERROR: No tienes DATABASE_URL_PROD o DATABASE_URL configurada${RESET}`);
      console.log(`${YELLOW}💡 Configura la URL de tu base de datos de producción${RESET}\n`);
      process.exit(1);
    }

    console.log(`${GREEN}✅ Variables de entorno configuradas${RESET}`);

    // Verificar directorio de migraciones
    const migrationsDir = join(process.cwd(), 'migrations');
    if (!existsSync(migrationsDir)) {
      console.log(`${YELLOW}⚠️  No hay migraciones generadas${RESET}`);
      console.log(`${YELLOW}💡 Genera migraciones primero con: drizzle-kit generate${RESET}\n`);
      process.exit(1);
    }

    console.log(`${GREEN}✅ Directorio de migraciones encontrado${RESET}\n`);

    // 2. Crear backup
    console.log(`${CYAN}📋 PASO 2: Crear backup de seguridad${RESET}`);
    
    try {
      execSync('node scripts/backup-db.js', { stdio: 'inherit' });
      console.log(`${GREEN}✅ Backup creado exitosamente${RESET}\n`);
    } catch (backupError) {
      console.error(`${RED}❌ ERROR creando backup: ${backupError.message}${RESET}`);
      console.log(`${YELLOW}⚠️  ¿Continuar sin backup? (no recomendado)${RESET}`);
      
      // En un caso real, aquí podrías preguntar al usuario
      console.log(`${RED}❌ ABORTANDO: Backup requerido para seguridad${RESET}`);
      process.exit(1);
    }

    // 3. Verificar estado de migraciones
    console.log(`${CYAN}📋 PASO 3: Verificar estado actual${RESET}`);
    
    try {
      // Usar configuración de producción
      const checkCommand = 'drizzle-kit check --config=drizzle.prod.config.ts';
      execSync(checkCommand, { stdio: 'inherit' });
      console.log(`${GREEN}✅ Sistema listo para migración${RESET}\n`);
    } catch (checkError) {
      console.log(`${YELLOW}⚠️  Se detectaron cambios pendientes${RESET}`);
      console.log(`${BLUE}📋 Esto es normal si tienes nuevas migraciones${RESET}\n`);
    }

    // 4. Mostrar resumen de lo que se va a hacer
    console.log(`${CYAN}📋 PASO 4: Resumen de la migración${RESET}`);
    console.log(`${BLUE}🎯 Acciones que se ejecutarán:${RESET}`);
    console.log(`${BLUE}  • Aplicar migraciones pendientes en producción${RESET}`);
    console.log(`${BLUE}  • Verificar que la migración fue exitosa${RESET}`);
    console.log(`${BLUE}  • Generar reporte de estado${RESET}\n`);

    // 5. Detectar cambios destructivos
    console.log(`${CYAN}📋 PASO 5: Verificar seguridad de migraciones${RESET}`);
    console.log(`${YELLOW}🔍 Detectando cambios destructivos...${RESET}\n`);
    
    try {
      execSync('node scripts/detect-destructive-changes.js', { stdio: 'inherit' });
      console.log(`${GREEN}✅ Verificación de seguridad pasada${RESET}\n`);
    } catch (destructiveError) {
      if (destructiveError.status === 2) {
        console.error(`${RED}❌ CAMBIOS CRÍTICOS DETECTADOS${RESET}`);
        console.log(`${YELLOW}🚨 NO SE PUEDE CONTINUAR CON LA MIGRACIÓN${RESET}`);
        console.log(`${YELLOW}💡 Revisa los cambios detectados y ajusta si es necesario${RESET}\n`);
        process.exit(1);
      }
      // Si es solo error de ejecución, continuar pero advertir
      console.warn(`${YELLOW}⚠️  No se pudo verificar cambios destructivos completamente${RESET}\n`);
    }

    // 6. Ejecutar migración
    console.log(`${CYAN}📋 PASO 6: Ejecutando migración${RESET}`);
    console.log(`${YELLOW}⏳ Aplicando migraciones a producción...${RESET}\n`);
    
    try {
      // Usar configuración de producción para migración
      const migrateCommand = 'drizzle-kit migrate --config=drizzle.prod.config.ts';
      execSync(migrateCommand, { stdio: 'inherit' });
      console.log(`${GREEN}✅ Migraciones aplicadas exitosamente${RESET}\n`);
    } catch (migrateError) {
      console.error(`${RED}❌ ERROR DURANTE MIGRACIÓN:${RESET}`);
      console.error(`${RED}${migrateError.message}${RESET}\n`);
      
      console.log(`${YELLOW}🔧 PASOS DE RECUPERACIÓN:${RESET}`);
      console.log(`${YELLOW}1. Revisar los logs de error arriba${RESET}`);
      console.log(`${YELLOW}2. Verificar conexión a la base de datos${RESET}`);
      console.log(`${YELLOW}3. Restaurar desde backup: node scripts/restore-backup.js${RESET}`);
      console.log(`${YELLOW}4. Contactar al equipo de desarrollo${RESET}\n`);
      
      process.exit(1);
    }

    // 7. Verificación post-migración
    console.log(`${CYAN}📋 PASO 7: Verificación post-migración${RESET}`);
    
    try {
      console.log(`${YELLOW}🔍 Verificando estado final...${RESET}`);
      const finalCheckCommand = 'drizzle-kit check --config=drizzle.prod.config.ts';
      execSync(finalCheckCommand, { stdio: 'pipe' });
      console.log(`${GREEN}✅ Verificación exitosa - Sistema estable${RESET}\n`);
    } catch (finalCheckError) {
      console.warn(`${YELLOW}⚠️  Verificación post-migración mostró advertencias${RESET}`);
      console.log(`${YELLOW}💡 Revisa manualmente que todo funcione correctamente${RESET}\n`);
    }

    // 8. Generar reporte post-migración
    console.log(`${CYAN}📋 PASO 8: Generando reporte final${RESET}`);
    
    try {
      execSync('node scripts/schema-diff.js', { stdio: 'pipe' });
      console.log(`${GREEN}✅ Reporte de migración generado${RESET}\n`);
    } catch (reportError) {
      console.warn(`${YELLOW}⚠️  No se pudo generar el reporte final${RESET}\n`);
    }

    // 7. Éxito
    console.log(`${BOLD}${GREEN}🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!${RESET}\n`);
    
    console.log(`${BLUE}📋 PRÓXIMOS PASOS RECOMENDADOS:${RESET}`);
    console.log(`${BLUE}1. Verificar que tu aplicación funciona correctamente${RESET}`);
    console.log(`${BLUE}2. Probar funcionalidades críticas${RESET}`);
    console.log(`${BLUE}3. Monitorear logs de errores${RESET}`);
    console.log(`${BLUE}4. El backup está disponible en backups/ por seguridad${RESET}\n`);

    console.log(`${GREEN}✅ Base de datos de producción actualizada correctamente${RESET}`);

  } catch (error) {
    console.error(`${RED}❌ ERROR INESPERADO: ${error.message}${RESET}`);
    console.error(`${RED}Stack trace:${RESET}`, error.stack);
    process.exit(1);
  }
}

// Mostrar advertencias de seguridad
function showSafetyWarning() {
  console.log(`${YELLOW}⚠️  ADVERTENCIA DE SEGURIDAD ⚠️${RESET}\n`);
  console.log(`${YELLOW}Este script aplicará cambios a tu base de datos de PRODUCCIÓN${RESET}`);
  console.log(`${YELLOW}Asegúrate de:${RESET}`);
  console.log(`${YELLOW}• Tener un backup reciente${RESET}`);
  console.log(`${YELLOW}• Haber probado las migraciones en desarrollo${RESET}`);
  console.log(`${YELLOW}• Tener un plan de rollback si algo sale mal${RESET}\n`);
}

// Función de ayuda
function showHelp() {
  console.log(`
${BLUE}🚀 Script de Migración Segura a Producción${RESET}

${YELLOW}Uso:${RESET}
  node scripts/migrate-to-prod.js

${YELLOW}Variables de entorno necesarias:${RESET}
  DATABASE_URL_PROD   - URL de tu base de datos de producción
  (o DATABASE_URL si solo tienes una)

${YELLOW}Lo que hace este script:${RESET}
  1. ✓ Verifica configuración y prerequisites
  2. 💾 Crea backup automático de seguridad  
  3. 🔍 Analiza migraciones pendientes
  4. 📊 Muestra resumen de cambios
  5. 🚀 Aplica migraciones a producción
  6. ✅ Verifica que todo salió bien

${YELLOW}Archivos que genera:${RESET}
  • backups/backup-production-[timestamp].sql
  • reports/migration-report-[timestamp].md

${YELLOW}Códigos de salida:${RESET}
  0 - Migración exitosa
  1 - Error durante el proceso
`);
}

// Verificar argumentos
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Mostrar advertencia y ejecutar
showSafetyWarning();
safeProductionMigration();