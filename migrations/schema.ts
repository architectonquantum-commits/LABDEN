import { pgTable, varchar, text, timestamp, unique, numeric, json, serial, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const orderStatus = pgEnum("order_status", ['pendiente', 'en_proceso', 'completada'])
export const role = pgEnum("role", ['superadmin', 'laboratorio', 'doctor'])
export const userStatus = pgEnum("user_status", ['active', 'inactive'])


export const laboratories = pgTable("laboratories", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	address: text().notNull(),
	phone: text().notNull(),
	email: text(),
	status: userStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	type: text().notNull(),
	message: text().notNull(),
	status: text().default('unread').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	role: role().notNull(),
	status: userStatus().default('active').notNull(),
	labId: varchar("lab_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	phone: text(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const orders = pgTable("orders", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	doctorId: varchar("doctor_id"),
	labId: varchar("lab_id").notNull(),
	status: text().default('pendiente').notNull(),
	value: numeric({ precision: 10, scale:  2 }),
	services: json().notNull(),
	odontograma: json().notNull(),
	observaciones: text(),
	instrucciones: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	progressPercentage: varchar("progress_percentage").default('0'),
	orderNumber: serial("order_number").notNull(),
});
