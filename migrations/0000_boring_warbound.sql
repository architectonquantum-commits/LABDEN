-- Baseline migration - Creates initial schema from shared/schema.ts
-- Generated after introspecting the database and uncommented for production use

-- Enable required extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint

CREATE TYPE "public"."order_status" AS ENUM('pendiente', 'en_proceso', 'completada');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('superadmin', 'laboratorio', 'doctor');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "laboratories" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "address" text NOT NULL,
        "phone" text NOT NULL,
        "email" text,
        "status" "user_status" DEFAULT 'active' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" varchar NOT NULL,
        "type" text NOT NULL,
        "message" text NOT NULL,
        "status" text DEFAULT 'unread' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "password" text NOT NULL,
        "role" "role" NOT NULL,
        "status" "user_status" DEFAULT 'active' NOT NULL,
        "lab_id" varchar,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "phone" text,
        CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "orders" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "doctor_id" varchar,
        "lab_id" varchar NOT NULL,
        "status" text DEFAULT 'pendiente' NOT NULL,
        "value" numeric(10, 2),
        "services" json NOT NULL,
        "odontograma" json NOT NULL,
        "observaciones" text,
        "instrucciones" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "progress_percentage" varchar DEFAULT '0',
        "order_number" serial NOT NULL
);