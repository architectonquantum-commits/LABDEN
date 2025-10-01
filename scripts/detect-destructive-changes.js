#!/usr/bin/env node

/**
 * Script para detectar cambios destructivos en migraciones pendientes
 * Uso: node scripts/detect-destructive-changes.js
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
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

console.log(`${BLUE}🔍 Detectando cambios destructivos en migraciones${RESET}\n`);

// Patrones de SQL destructivo
const DESTRUCTIVE_PATTERNS = [
  {
    pattern: /DROP\s+TABLE/i,
    severity: 'CRÍTICO',
    description: 'Eliminar tabla - pérdida total de datos'
  },
  {
    pattern: /DROP\s+COLUMN/i,
    severity: 'CRÍTICO', 
    description: 'Eliminar columna - pérdida de datos'
  },
  {
    pattern: /ALTER\s+COLUMN.*DROP\s+NOT\s+NULL/i,
    severity: 'BAJO',
    description: 'Quitar restricción NOT NULL - generalmente seguro'
  },
  {
    pattern: /ALTER\s+COLUMN.*SET\s+NOT\s+NULL/i,
    severity: 'ALTO',
    description: 'Agregar NOT NULL - puede fallar si hay valores nulos'
  },
  {
    pattern: /ALTER\s+COLUMN.*TYPE/i,
    severity: 'ALTO',
    description: 'Cambio de tipo de dato - puede causar pérdida de datos'
  },
  {
    pattern: /DROP\s+INDEX/i,
    severity: 'MEDIO',
    description: 'Eliminar índice - impacto en rendimiento'
  },
  {
    pattern: /TRUNCATE/i,
    severity: 'CRÍTICO',
    description: 'Vaciar tabla - pérdida total de datos'
  },
  {
    pattern: /DELETE\s+FROM/i,
    severity: 'ALTO',
    description: 'Eliminar datos - pérdida de información'
  },
  {
    pattern: /RENAME\s+COLUMN/i,
    severity: 'MEDIO',
    description: 'Renombrar columna - puede romper aplicación'
  },
  {
    pattern: /RENAME\s+TO/i,
    severity: 'MEDIO',
    description: 'Renombrar tabla - puede romper aplicación'
  }
];

async function detectDestructiveChanges() {
  try {
    const migrationsDir = join(process.cwd(), 'migrations');
    
    // Verificar que existe el directorio de migraciones
    if (!existsSync(migrationsDir)) {
      console.log(`${GREEN}✅ No hay directorio de migraciones - No hay cambios destructivos${RESET}`);
      return { hasDestructive: false, changes: [] };
    }

    // Leer todos los archivos de migración SQL
    const files = readdirSync(migrationsDir).filter(file => file.endsWith('.sql'));
    
    if (files.length === 0) {
      console.log(`${GREEN}✅ No hay archivos de migración SQL - No hay cambios destructivos${RESET}`);
      return { hasDestructive: false, changes: [] };
    }

    console.log(`${BLUE}📋 Analizando ${files.length} archivos de migración...${RESET}\n`);

    const destructiveChanges = [];
    
    for (const file of files) {
      const filePath = join(migrationsDir, file);
      const content = readFileSync(filePath, 'utf8');
      
      console.log(`${BLUE}🔍 Analizando: ${file}${RESET}`);
      
      // Buscar patrones destructivos
      for (const { pattern, severity, description } of DESTRUCTIVE_PATTERNS) {
        const matches = content.match(pattern);
        if (matches) {
          destructiveChanges.push({
            file,
            severity,
            description,
            sqlMatch: matches[0],
            line: findLineNumber(content, matches[0])
          });
          
          const color = severity === 'CRÍTICO' ? RED : severity === 'ALTO' ? YELLOW : BLUE;
          console.log(`  ${color}⚠️  ${severity}: ${description}${RESET}`);
          console.log(`      SQL: ${matches[0]}`);
          console.log(`      Línea: ~${findLineNumber(content, matches[0])}`);
        }
      }
      
      if (destructiveChanges.filter(c => c.file === file).length === 0) {
        console.log(`  ${GREEN}✅ Sin cambios destructivos${RESET}`);
      }
      
      console.log('');
    }

    // Resumen final
    console.log(`${BLUE}📊 RESUMEN DE ANÁLISIS${RESET}\n`);
    
    if (destructiveChanges.length === 0) {
      console.log(`${GREEN}🎉 ¡EXCELENTE! No se detectaron cambios destructivos${RESET}`);
      console.log(`${GREEN}✅ Las migraciones parecen ser seguras para aplicar${RESET}\n`);
      return { hasDestructive: false, changes: [] };
    }

    // Agrupar por severidad
    const bySeverity = destructiveChanges.reduce((acc, change) => {
      acc[change.severity] = acc[change.severity] || [];
      acc[change.severity].push(change);
      return acc;
    }, {});

    const criticalCount = bySeverity['CRÍTICO']?.length || 0;
    const highCount = bySeverity['ALTO']?.length || 0;
    const mediumCount = bySeverity['MEDIO']?.length || 0;
    const lowCount = bySeverity['BAJO']?.length || 0;

    console.log(`${RED}⚠️  SE DETECTARON ${destructiveChanges.length} CAMBIOS POTENCIALMENTE DESTRUCTIVOS${RESET}\n`);
    
    if (criticalCount > 0) {
      console.log(`${RED}🚨 CRÍTICOS: ${criticalCount} - REQUIEREN ATENCIÓN INMEDIATA${RESET}`);
    }
    if (highCount > 0) {
      console.log(`${YELLOW}⚠️  ALTOS: ${highCount} - Revisar cuidadosamente${RESET}`);
    }
    if (mediumCount > 0) {
      console.log(`${BLUE}ℹ️  MEDIOS: ${mediumCount} - Considerar impacto${RESET}`);
    }
    if (lowCount > 0) {
      console.log(`${GREEN}✓ BAJOS: ${lowCount} - Generalmente seguros${RESET}`);
    }

    console.log(`\n${YELLOW}💡 RECOMENDACIONES:${RESET}`);
    
    if (criticalCount > 0) {
      console.log(`${RED}• NO aplicar estas migraciones sin un plan de backup y recuperación${RESET}`);
      console.log(`${RED}• Crear backup completo antes de proceder${RESET}`);
      console.log(`${RED}• Considerar ejecutar en horario de bajo tráfico${RESET}`);
      console.log(`${RED}• Tener un plan de rollback documentado${RESET}`);
    }
    
    if (highCount > 0 || mediumCount > 0) {
      console.log(`${YELLOW}• Probar exhaustivamente en un entorno de staging${RESET}`);
      console.log(`${YELLOW}• Verificar que no hay datos conflictivos${RESET}`);
      console.log(`${YELLOW}• Notificar a los usuarios sobre posible downtime${RESET}`);
    }

    console.log(`${BLUE}• Monitorear la aplicación después de aplicar las migraciones${RESET}`);
    console.log(`${BLUE}• Verificar que todas las funcionalidades siguen operando${RESET}\n`);

    return { 
      hasDestructive: true, 
      changes: destructiveChanges,
      summary: { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount }
    };

  } catch (error) {
    console.error(`${RED}❌ ERROR: ${error.message}${RESET}`);
    process.exit(1);
  }
}

// Función auxiliar para encontrar número de línea
function findLineNumber(content, searchText) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchText)) {
      return i + 1;
    }
  }
  return 'No encontrada';
}

// Función de ayuda
function showHelp() {
  console.log(`
${BLUE}🔍 Detector de Cambios Destructivos${RESET}

${YELLOW}Uso:${RESET}
  node scripts/detect-destructive-changes.js

${YELLOW}Qué detecta:${RESET}
  🚨 CRÍTICO: DROP TABLE, DROP COLUMN, TRUNCATE, DELETE FROM
  ⚠️  ALTO: SET NOT NULL, ALTER COLUMN TYPE
  ℹ️  MEDIO: DROP INDEX, RENAME COLUMN/TABLE
  ✓ BAJO: DROP NOT NULL

${YELLOW}Códigos de salida:${RESET}
  0 - No hay cambios destructivos
  1 - Error durante análisis
  2 - Hay cambios destructivos críticos

${YELLOW}Archivos analizados:${RESET}
  • migrations/*.sql
`);
}

// Verificar argumentos
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Ejecutar análisis
detectDestructiveChanges()
  .then(result => {
    if (result.hasDestructive && result.summary?.critical > 0) {
      process.exit(2); // Cambios críticos detectados
    }
    process.exit(0); // Todo bien
  });