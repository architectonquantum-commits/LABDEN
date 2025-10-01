import { defineConfig } from "drizzle-kit";

// Configuración para el entorno de producción
const databaseUrl = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL_PROD or DATABASE_URL must be set for production migrations");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts", 
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  // Configuraciones adicionales para producción
  verbose: true,
  strict: true,
});