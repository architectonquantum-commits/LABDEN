import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, json, pgEnum, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["superadmin", "laboratorio", "doctor"]);
export const orderStatusEnum = pgEnum("order_status", ["pendiente", "iniciada", "en_proceso", "terminada", "cancelada"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  role: roleEnum("role").notNull(),
  status: userStatusEnum("status").notNull().default("active"),
  lab_id: varchar("lab_id"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Laboratories table
export const laboratories = pgTable("laboratories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  status: userStatusEnum("status").notNull().default("active"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  order_number: serial("order_number").notNull(),
  doctor_id: varchar("doctor_id"), // Made nullable for laboratory-created orders
  lab_id: varchar("lab_id").notNull(),
  status: orderStatusEnum("status").notNull().default("pendiente"),
  value: decimal("value", { precision: 10, scale: 2 }),
  services: json("services").$type<string[]>().notNull(),
  odontograma: json("odontograma").$type<Record<number, string[]>>().notNull(),
  nombrePaciente: text("nombre_paciente"), // Patient name field
  observaciones: text("observaciones"),
  instrucciones: text("instrucciones"),
  colorSustrato: text("color_sustrato"), // Substrate color
  colorTrabajo: text("color_trabajo"), // Work color requested
  material: text("material"), // Material selection
  progress_percentage: varchar("progress_percentage").default("0"),
  archivado: boolean("archivado").notNull().default(false), // Archive status
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("unread"),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  laboratory: one(laboratories, {
    fields: [users.lab_id],
    references: [laboratories.id],
  }),
  orders: many(orders),
  notifications: many(notifications),
}));

export const laboratoriesRelations = relations(laboratories, ({ many }) => ({
  users: many(users),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  doctor: one(users, {
    fields: [orders.doctor_id],
    references: [users.id],
  }),
  laboratory: one(laboratories, {
    fields: [orders.lab_id],
    references: [laboratories.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.user_id],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Schema for creating doctors from lab interface (requires name, email, phone, password)
export const createDoctorSchema = insertUserSchema.omit({
  role: true,
  status: true,
  lab_id: true,
}).extend({
  phone: z.string().min(1, "El teléfono es requerido").regex(/^\d+$/, "El teléfono debe contener solo números"),
});

export const insertLaboratorySchema = createInsertSchema(laboratories).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  order_number: true, // Auto-generated field
  created_at: true,
  updated_at: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  created_at: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertLaboratory = z.infer<typeof insertLaboratorySchema>;
export type Laboratory = typeof laboratories.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
