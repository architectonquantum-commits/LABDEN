#!/usr/bin/env node

/**
 * Script para restaurar backup de base de datos
 * Uso: node scripts/restore-backup.js [backup-file]
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
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

console.log(`${BLUE}🔄 Restaurador de Backup de Base de Datos${RESET}\n`);

async function restoreBackup() {
  try {
    const backupsDir = join(process.cwd(), 'backups');
    
    // Verificar si existe directorio de backups
    if (!existsSync(backupsDir)) {
      console.error(`${RED}❌ ERROR: No existe el directorio de backups${RESET}`);
      console.log(`${YELLOW}💡 Ejecuta primero: node scripts/backup-db.js${RESET}\n`);
      process.exit(1);
    }

    // Obtener archivo de backup del argumento o mostrar lista
    let backupFile = process.argv[2];
    
    if (!backupFile) {
      console.log(`${YELLOW}📋 Backups disponibles:${RESET}\n`);
      
      const backupFiles = readdirSync(backupsDir)
        .filter(file => file.endsWith('.sql'))
        .sort()
        .reverse(); // Más recientes primero
      
      if (backupFiles.length === 0) {
        console.log(`${RED}❌ No hay archivos de backup disponibles${RESET}`);
        process.exit(1);
      }
      
      backupFiles.forEach((file, index) => {
        console.log(`${BLUE}  ${index + 1}. ${file}${RESET}`);
      });
      
      console.log(`\n${YELLOW}💡 Uso: node scripts/restore-backup.js <nombre-archivo>${RESET}`);
      console.log(`${YELLOW}Ejemplo: node scripts/restore-backup.js ${backupFiles[0]}${RESET}\n`);
      process.exit(0);
    }

    // Verificar que el archivo de backup existe
    const backupPath = backupFile.startsWith('/') ? backupFile : join(backupsDir, backupFile);
    
    if (!existsSync(backupPath)) {
      console.error(`${RED}❌ ERROR: Archivo de backup no encontrado: ${backupPath}${RESET}`);
      process.exit(1);
    }

    console.log(`${BLUE}📄 Archivo de backup: ${backupPath}${RESET}`);
    
    // Verificar DATABASE_URL
    const dbUrl = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error(`${RED}❌ ERROR: DATABASE_URL_PROD o DATABASE_URL debe estar configurada${RESET}`);
      process.exit(1);
    }

    // Advertencia de seguridad
    console.log(`${YELLOW}⚠️  ADVERTENCIA DE SEGURIDAD ⚠️${RESET}`);
    console.log(`${YELLOW}Esta operación REEMPLAZARÁ completamente la base de datos actual${RESET}`);
    console.log(`${YELLOW}Base de datos objetivo: ${dbUrl.replace(/\/\/.*@/, '//***@')}${RESET}\n`);
    
    console.log(`${RED}🚨 ESTA ACCIÓN NO SE PUEDE DESHACER${RESET}`);
    console.log(`${YELLOW}Continuar solo si estás seguro de que quieres restaurar${RESET}\n`);

    // En un entorno real, aquí se pediría confirmación al usuario
    console.log(`${BLUE}📋 Para restaurar manualmente:${RESET}`);
    console.log(`${BLUE}1. psql "${dbUrl}" < "${backupPath}"${RESET}`);
    console.log(`${BLUE}2. drizzle-kit migrate --config=drizzle.prod.config.ts${RESET}`);
    console.log(`${BLUE}3. node scripts/schema-check.js${RESET}\n`);

    console.log(`${YELLOW}💡 Este script actualmente muestra las instrucciones manuales${RESET}`);
    console.log(`${YELLOW}   Para automatizar, implementar confirmación interactiva${RESET}\n`);

    // Automático (deshabilitado por seguridad)
    /*
    try {
      console.log(`${YELLOW}⏳ Restaurando backup...${RESET}`);
      const restoreCommand = `psql "${dbUrl}" < "${backupPath}"`;
      execSync(restoreCommand, { stdio: 'inherit' });
      console.log(`${GREEN}✅ Backup restaurado exitosamente${RESET}\n`);
      
      console.log(`${YELLOW}🔍 Verificando estado...${RESET}`);
      execSync('node scripts/schema-check.js', { stdio: 'inherit' });
      
    } catch (restoreError) {
      console.error(`${RED}❌ ERROR DURANTE RESTAURACIÓN: ${restoreError.message}${RESET}`);
      process.exit(1);
    }
    */

  } catch (error) {
    console.error(`${RED}❌ ERROR INESPERADO: ${error.message}${RESET}`);
    process.exit(1);
  }
}

// Función de ayuda
function showHelp() {
  console.log(`
${BLUE}🔄 Script de Restauración de Backup${RESET}

${YELLOW}Uso:${RESET}
  node scripts/restore-backup.js [archivo-backup]

${YELLOW}Ejemplos:${RESET}
  node scripts/restore-backup.js                    # Lista backups disponibles
  node scripts/restore-backup.js backup-prod.sql   # Restaura backup específico

${YELLOW}Variables de entorno:${RESET}
  DATABASE_URL_PROD   - URL de base de datos a restaurar
  DATABASE_URL        - URL alternativa si no está PROD

${YELLOW}⚠️ IMPORTANTE:${RESET}
  • Esta operación REEMPLAZA completamente la base de datos
  • NO SE PUEDE DESHACER una vez ejecutada
  • Asegúrate de tener la URL correcta configurada
  • Considera hacer un backup actual antes de restaurar
`);
}

// Verificar argumentos
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Ejecutar restauración
restoreBackup();