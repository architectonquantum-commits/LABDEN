var __defProp = Object.defineProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  createDoctorSchema: () => createDoctorSchema,
  insertLaboratorySchema: () => insertLaboratorySchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertUserSchema: () => insertUserSchema,
  laboratories: () => laboratories,
  laboratoriesRelations: () => laboratoriesRelations,
  notifications: () => notifications,
  notificationsRelations: () => notificationsRelations,
  orderStatusEnum: () => orderStatusEnum,
  orders: () => orders,
  ordersRelations: () => ordersRelations,
  roleEnum: () => roleEnum,
  userStatusEnum: () => userStatusEnum,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, json, pgEnum, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var roleEnum = pgEnum("role", ["superadmin", "laboratorio", "doctor"]);
var orderStatusEnum = pgEnum("order_status", ["pendiente", "iniciada", "en_proceso", "terminada", "cancelada"]);
var userStatusEnum = pgEnum("user_status", ["active", "inactive"]);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  role: roleEnum("role").notNull(),
  status: userStatusEnum("status").notNull().default("active"),
  lab_id: varchar("lab_id"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});
var laboratories = pgTable("laboratories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  status: userStatusEnum("status").notNull().default("active"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});
var orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  order_number: serial("order_number").notNull(),
  doctor_id: varchar("doctor_id"),
  // Made nullable for laboratory-created orders
  lab_id: varchar("lab_id").notNull(),
  status: orderStatusEnum("status").notNull().default("pendiente"),
  value: decimal("value", { precision: 10, scale: 2 }),
  services: json("services").$type().notNull(),
  odontograma: json("odontograma").$type().notNull(),
  observaciones: text("observaciones"),
  instrucciones: text("instrucciones"),
  progress_percentage: varchar("progress_percentage").default("0"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow()
});
var notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("unread"),
  created_at: timestamp("created_at").notNull().defaultNow()
});
var usersRelations = relations(users, ({ one, many }) => ({
  laboratory: one(laboratories, {
    fields: [users.lab_id],
    references: [laboratories.id]
  }),
  orders: many(orders),
  notifications: many(notifications)
}));
var laboratoriesRelations = relations(laboratories, ({ many }) => ({
  users: many(users),
  orders: many(orders)
}));
var ordersRelations = relations(orders, ({ one }) => ({
  doctor: one(users, {
    fields: [orders.doctor_id],
    references: [users.id]
  }),
  laboratory: one(laboratories, {
    fields: [orders.lab_id],
    references: [laboratories.id]
  })
}));
var notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.user_id],
    references: [users.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true
});
var createDoctorSchema = insertUserSchema.omit({
  role: true,
  status: true,
  lab_id: true
}).extend({
  phone: z.string().min(1, "El tel\xE9fono es requerido").regex(/^\d+$/, "El tel\xE9fono debe contener solo n\xFAmeros")
});
var insertLaboratorySchema = createInsertSchema(laboratories).omit({
  id: true,
  created_at: true,
  updated_at: true
});
var insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  order_number: true,
  // Auto-generated field
  created_at: true,
  updated_at: true
});
var insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  created_at: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq } from "drizzle-orm";
var DbStorage = class {
  // User methods
  async getUser(id) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async getUserByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  async getAllUsers() {
    return await db.select().from(users);
  }
  async createUser(user) {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  async updateUser(id, user) {
    const [updatedUser] = await db.update(users).set({ ...user, updated_at: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return updatedUser;
  }
  async deleteUser(id) {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Laboratory methods
  async getLaboratory(id) {
    const result = await db.select().from(laboratories).where(eq(laboratories.id, id));
    return result[0];
  }
  async getAllLaboratories() {
    return await db.select().from(laboratories);
  }
  async createLaboratory(lab) {
    const [newLab] = await db.insert(laboratories).values(lab).returning();
    return newLab;
  }
  async updateLaboratory(id, lab) {
    const [updatedLab] = await db.update(laboratories).set({ ...lab, updated_at: /* @__PURE__ */ new Date() }).where(eq(laboratories.id, id)).returning();
    return updatedLab;
  }
  async deleteLaboratory(id) {
    const result = await db.delete(laboratories).where(eq(laboratories.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Order methods
  async getOrder(id) {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }
  async getOrdersByDoctorId(doctorId) {
    return await db.select().from(orders).where(eq(orders.doctor_id, doctorId));
  }
  async getOrdersByLabId(labId) {
    return await db.select().from(orders).where(eq(orders.lab_id, labId));
  }
  async createOrder(order) {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }
  async updateOrder(id, order) {
    const [updatedOrder] = await db.update(orders).set({ ...order, updated_at: /* @__PURE__ */ new Date() }).where(eq(orders.id, id)).returning();
    return updatedOrder;
  }
  async deleteOrder(id) {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  async getAllOrders() {
    return await db.select().from(orders);
  }
  async updateOrderProgress(id, progress) {
    const [updatedOrder] = await db.update(orders).set({ progress_percentage: progress, updated_at: /* @__PURE__ */ new Date() }).where(eq(orders.id, id)).returning();
    return updatedOrder;
  }
  // Notification methods
  async getNotificationsByUserId(userId) {
    return await db.select().from(notifications).where(eq(notifications.user_id, userId));
  }
  async createNotification(notification) {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }
  async markNotificationAsRead(id) {
    const result = await db.update(notifications).set({ status: "read" }).where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }
};
var storage = new DbStorage();

// server/routes.ts
import { z as z2 } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
if (!process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: SESSION_SECRET environment variable is required in production");
    process.exit(1);
  } else {
    console.warn("WARNING: SESSION_SECRET not set, using development fallback");
  }
}
var JWT_SECRET = process.env.SESSION_SECRET || "dev-secret-key-change-in-production";
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    console.log("Authenticated user:", { id: user.id, email: user.email, role: user.role, lab_id: user.lab_id });
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
}
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
async function registerRoutes(app2) {
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          lab_id: user.lab_id
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userWithHashedPassword = { ...userData, password: hashedPassword };
      const user = await storage.createUser(userWithHashedPassword);
      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        lab_id: user.lab_id
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });
  app2.get("/api/users/me", authenticateToken, async (req, res) => {
    let lab_name = null;
    if (req.user.lab_id) {
      try {
        const lab = await storage.getLaboratory(req.user.lab_id);
        lab_name = lab?.name || null;
      } catch (error) {
        console.error("Error fetching laboratory:", error);
      }
    }
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      lab_id: req.user.lab_id,
      lab_name
    });
  });
  app2.get("/api/users", authenticateToken, requireRole(["superadmin"]), async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const usersWithLabNames = await Promise.all(
        users2.map(async (user) => {
          let lab_name = null;
          if (user.lab_id) {
            try {
              const lab = await storage.getLaboratory(user.lab_id);
              lab_name = lab?.name || null;
            } catch (error) {
              console.error("Error fetching laboratory for user:", user.id, error);
            }
          }
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            lab_id: user.lab_id,
            lab_name,
            created_at: user.created_at,
            updated_at: user.updated_at
          };
        })
      );
      res.json(usersWithLabNames);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/labs", authenticateToken, requireRole(["superadmin"]), async (req, res) => {
    try {
      const labs = await storage.getAllLaboratories();
      res.json(labs);
    } catch (error) {
      console.error("Get labs error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/labs/:id", authenticateToken, requireRole(["superadmin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const lab = await storage.getLaboratory(id);
      if (!lab) {
        return res.status(404).json({ error: "Laboratory not found" });
      }
      res.json(lab);
    } catch (error) {
      console.error("Get lab error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/labs", authenticateToken, requireRole(["superadmin"]), async (req, res) => {
    try {
      const labData = insertLaboratorySchema.parse(req.body);
      const lab = await storage.createLaboratory(labData);
      res.status(201).json(lab);
    } catch (error) {
      console.error("Create lab error:", error);
      res.status(400).json({ error: "Invalid laboratory data" });
    }
  });
  app2.put("/api/labs/:id", authenticateToken, requireRole(["superadmin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const labData = insertLaboratorySchema.partial().parse(req.body);
      const lab = await storage.updateLaboratory(id, labData);
      if (!lab) {
        return res.status(404).json({ error: "Laboratory not found" });
      }
      res.json(lab);
    } catch (error) {
      console.error("Update lab error:", error);
      res.status(400).json({ error: "Invalid laboratory data" });
    }
  });
  app2.delete("/api/labs/:id", authenticateToken, requireRole(["superadmin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteLaboratory(id);
      if (!deleted) {
        return res.status(404).json({ error: "Laboratory not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete lab error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/labs/:id/users", authenticateToken, requireRole(["superadmin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const lab = await storage.getLaboratory(id);
      if (!lab) {
        return res.status(404).json({ error: "Laboratory not found" });
      }
      const allUsers = await storage.getAllUsers();
      const labUsers = allUsers.filter((user) => user.lab_id === id);
      const safeUsers = labUsers.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        updated_at: user.updated_at
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Get lab users error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/labs/:id/orders", authenticateToken, requireRole(["superadmin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const lab = await storage.getLaboratory(id);
      if (!lab) {
        return res.status(404).json({ error: "Laboratory not found" });
      }
      const labOrders = await storage.getOrdersByLabId(id);
      const enrichedOrders = await Promise.all(
        labOrders.map(async (order) => {
          let doctorName = null;
          if (order.doctor_id) {
            try {
              const doctor = await storage.getUser(order.doctor_id);
              doctorName = doctor?.name || null;
            } catch (error) {
              console.error("Error fetching doctor for order:", order.id, error);
            }
          }
          return {
            id: order.id,
            doctor_id: order.doctor_id,
            doctor_name: doctorName,
            status: order.status,
            value: order.value,
            services: order.services,
            created_at: order.created_at,
            updated_at: order.updated_at,
            progress_percentage: order.progress_percentage
          };
        })
      );
      res.json(enrichedOrders);
    } catch (error) {
      console.error("Get lab orders error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.patch("/api/labs/:id/status", authenticateToken, requireRole(["superadmin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const statusSchema = z2.object({
        status: z2.enum(["active", "inactive"])
      });
      const validatedData = statusSchema.parse(req.body);
      const { status } = validatedData;
      const lab = await storage.updateLaboratory(id, { status });
      if (!lab) {
        return res.status(404).json({ error: "Laboratory not found" });
      }
      res.json({
        id: lab.id,
        name: lab.name,
        status: lab.status,
        message: `Laboratory status changed to ${status}`
      });
    } catch (error) {
      console.error("Update lab status error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/doctors", authenticateToken, requireRole(["laboratorio", "superadmin"]), async (req, res) => {
    try {
      const labId = req.user.role === "laboratorio" ? req.user.lab_id : req.query.lab_id;
      const allUsers = await storage.getAllUsers();
      const doctors = allUsers.filter(
        (user) => user.role === "doctor" && (req.user.role === "superadmin" || user.lab_id === labId)
      );
      const sanitizedDoctors = doctors.map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        role: doctor.role,
        status: doctor.status,
        lab_id: doctor.lab_id,
        created_at: doctor.created_at,
        updated_at: doctor.updated_at
      }));
      res.json(sanitizedDoctors);
    } catch (error) {
      console.error("Get doctors error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/doctors", authenticateToken, requireRole(["laboratorio"]), async (req, res) => {
    try {
      const validatedData = createDoctorSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email ya est\xE1 en uso. Intenta con otro email." });
      }
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const doctorData = {
        ...validatedData,
        password: hashedPassword,
        // Use encrypted password
        role: "doctor",
        status: "active",
        lab_id: req.user.lab_id
      };
      const doctor = await storage.createUser(doctorData);
      const safeDoctor = {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        role: doctor.role,
        status: doctor.status,
        lab_id: doctor.lab_id,
        created_at: doctor.created_at,
        updated_at: doctor.updated_at
      };
      res.status(201).json(safeDoctor);
    } catch (error) {
      console.error("Create doctor error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Datos inv\xE1lidos del doctor" });
      }
      res.status(500).json({ error: "No se pudo crear el doctor. Intenta nuevamente." });
    }
  });
  app2.put("/api/doctors/:id", authenticateToken, requireRole(["laboratorio", "superadmin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const doctor = await storage.getUser(id);
      if (!doctor || doctor.role !== "doctor") {
        return res.status(404).json({ error: "Doctor not found" });
      }
      if (req.user.role === "laboratorio" && doctor.lab_id !== req.user.lab_id) {
        return res.status(403).json({ error: "Cannot edit doctors from other laboratories" });
      }
      const updateSchema = z2.object({
        name: z2.string().min(2, "Name must be at least 2 characters").optional(),
        email: z2.string().email("Invalid email format").optional(),
        phone: z2.string().min(10, "Phone must be at least 10 characters").optional(),
        status: z2.enum(["active", "inactive"]).optional()
      });
      const validatedData = updateSchema.parse(req.body);
      const updatedDoctor = await storage.updateUser(id, validatedData);
      if (!updatedDoctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }
      const safeUpdatedDoctor = {
        id: updatedDoctor.id,
        name: updatedDoctor.name,
        email: updatedDoctor.email,
        phone: updatedDoctor.phone,
        role: updatedDoctor.role,
        status: updatedDoctor.status,
        lab_id: updatedDoctor.lab_id,
        created_at: updatedDoctor.created_at,
        updated_at: updatedDoctor.updated_at
      };
      res.json(safeUpdatedDoctor);
    } catch (error) {
      console.error("Update doctor error:", error);
      res.status(400).json({ error: "Invalid doctor data" });
    }
  });
  app2.delete("/api/doctors/:id", authenticateToken, requireRole(["laboratorio", "superadmin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const doctor = await storage.getUser(id);
      if (!doctor || doctor.role !== "doctor") {
        return res.status(404).json({ error: "Doctor not found" });
      }
      if (req.user.role === "laboratorio" && doctor.lab_id !== req.user.lab_id) {
        return res.status(403).json({ error: "Cannot delete doctors from other laboratories" });
      }
      const doctorOrders = await storage.getOrdersByDoctorId(id);
      if (doctorOrders.length > 0) {
        return res.status(400).json({
          error: "Cannot delete doctor with existing orders. Please reassign or cancel orders first."
        });
      }
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "Doctor not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete doctor error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/labs/:labId/doctors", authenticateToken, requireRole(["laboratorio", "superadmin"]), async (req, res) => {
    try {
      const { labId } = req.params;
      const lab = await storage.getLaboratory(labId);
      if (!lab) {
        return res.status(404).json({ error: "Laboratory not found" });
      }
      if (req.user.role === "laboratorio" && req.user.lab_id !== labId) {
        return res.status(403).json({ error: "Cannot access doctors from other laboratories" });
      }
      const allUsers = await storage.getAllUsers();
      const doctors = allUsers.filter(
        (user) => user.role === "doctor" && user.lab_id === labId
      );
      const safeDoctors = doctors.map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        role: doctor.role,
        status: doctor.status,
        lab_id: doctor.lab_id,
        created_at: doctor.created_at,
        updated_at: doctor.updated_at
      }));
      res.json(safeDoctors);
    } catch (error) {
      console.error("Get lab doctors error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      let orders2 = [];
      if (req.user.role === "doctor") {
        orders2 = await storage.getOrdersByDoctorId(req.user.id);
      } else if (req.user.role === "laboratorio") {
        orders2 = await storage.getOrdersByLabId(req.user.lab_id);
      } else if (req.user.role === "superadmin") {
        orders2 = await storage.getAllOrders();
      }
      const enrichedOrders = await Promise.all(orders2.map(async (order) => {
        const doctor = await storage.getUser(order.doctor_id);
        const lab = await storage.getLaboratory(order.lab_id);
        const enrichedOrder = {
          ...order,
          doctor_name: doctor?.name || "Unknown Doctor",
          lab_name: lab?.name || "Unknown Lab"
        };
        return enrichedOrder;
      }));
      res.json(enrichedOrders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/orders", authenticateToken, requireRole(["doctor", "laboratorio"]), async (req, res) => {
    try {
      const requestData = req.body;
      console.log("Creating order for user:", { id: req.user.id, role: req.user.role, lab_id: req.user.lab_id });
      console.log("Request data:", JSON.stringify(requestData, null, 2));
      let orderData;
      if (req.user.role === "doctor") {
        const orderDataWithServerFields = {
          ...requestData,
          doctor_id: req.user.id,
          lab_id: req.user.lab_id
        };
        orderData = insertOrderSchema.parse(orderDataWithServerFields);
      } else if (req.user.role === "laboratorio") {
        const { doctorId, lab_id: _, ...orderFields } = requestData;
        if (doctorId) {
          const doctor = await storage.getUser(doctorId);
          if (!doctor) {
            return res.status(400).json({ error: "Doctor not found" });
          }
          if (doctor.role !== "doctor") {
            return res.status(400).json({ error: "Invalid user role - must be doctor" });
          }
          if (doctor.lab_id !== req.user.lab_id) {
            return res.status(403).json({ error: "Cannot assign orders to doctors from other laboratories" });
          }
        }
        const orderFieldsWithDefaults = {
          ...orderFields,
          doctor_id: doctorId || null,
          // Optional doctor assignment
          lab_id: req.user.lab_id
          // Always set from authenticated user (security)
        };
        orderData = insertOrderSchema.parse(orderFieldsWithDefaults);
      }
      const order = await storage.createOrder(orderData);
      if (req.user.role === "doctor") {
        await storage.createNotification({
          user_id: req.user.lab_id,
          // Assuming lab manager has same ID as lab
          type: "new_order",
          message: `Nueva orden #${order.id} de ${req.user.name}`,
          status: "unread"
        });
      } else if (req.user.role === "laboratorio" && orderData.doctor_id) {
        await storage.createNotification({
          user_id: orderData.doctor_id,
          type: "order_assigned",
          message: `Se te asign\xF3 la orden #${order.id}`,
          status: "unread"
        });
      }
      res.status(201).json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(400).json({ error: "Invalid order data" });
    }
  });
  app2.put("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (req.user.role === "doctor" && order.doctor_id !== req.user.id) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      if (req.user.role === "laboratorio" && order.lab_id !== req.user.lab_id) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      const orderData = insertOrderSchema.partial().parse(req.body);
      const updatedOrder = await storage.updateOrder(id, orderData);
      if (orderData.status && orderData.status !== order.status && order.doctor_id) {
        const doctor = await storage.getUser(order.doctor_id);
        await storage.createNotification({
          user_id: order.doctor_id,
          type: "order_status_changed",
          message: `Tu orden #${order.id} cambi\xF3 a ${orderData.status}`,
          status: "unread"
        });
      }
      res.json(updatedOrder);
    } catch (error) {
      console.error("Update order error:", error);
      res.status(400).json({ error: "Invalid order data" });
    }
  });
  app2.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
      const notifications2 = await storage.getNotificationsByUserId(req.user.id);
      res.json(notifications2);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const marked = await storage.markNotificationAsRead(id);
      if (!marked) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/orders/:id/progress", authenticateToken, requireRole(["laboratorio", "superadmin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, progress_percentage } = req.body;
      const updatedOrder = await storage.updateOrderProgress(id, status || "en_proceso");
      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order progress:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/admin/init-production-data", async (req, res) => {
    try {
      const { confirmInitialization } = req.body;
      if (confirmInitialization !== "INITIALIZE_PRODUCTION_DATA_CONFIRMED") {
        return res.status(400).json({
          error: "Missing confirmation",
          required: 'Send POST with {"confirmInitialization": "INITIALIZE_PRODUCTION_DATA_CONFIRMED"}'
        });
      }
      console.log("Initializing production data...");
      const superAdminPassword = "SuperAdmin123!";
      const labPassword = "LabManager123!";
      const doctorPassword = "Doctor123!";
      const superAdminHashed = await bcrypt.hash(superAdminPassword, 10);
      const labHashed = await bcrypt.hash(labPassword, 10);
      const doctorHashed = await bcrypt.hash(doctorPassword, 10);
      let lab1, lab2;
      try {
        lab1 = await storage.createLaboratory({
          name: "Laboratorio Dental Sonrisa",
          address: "Av. Principal 123, Madrid",
          phone: "555-1234",
          email: "info@sonrisa.com",
          status: "active"
        });
      } catch (error) {
        lab1 = await storage.getLaboratory("lab1");
      }
      try {
        lab2 = await storage.createLaboratory({
          name: "Efecto Dental",
          address: "Calle Efecto 456, Barcelona",
          phone: "555-5678",
          email: "info@efectodental.com",
          status: "active"
        });
      } catch (error) {
        lab2 = await storage.getLaboratory("lab2");
      }
      const userConfigs = [
        {
          id: "admin1",
          name: "Super Admin",
          email: "admin@dental.com",
          password: superAdminHashed,
          phone: null,
          role: "superadmin",
          status: "active",
          lab_id: null
        },
        {
          name: "Lab Manager",
          email: "lab@dental.com",
          password: labHashed,
          phone: "555-1234",
          role: "laboratorio",
          status: "active",
          lab_id: lab1?.id || "lab1"
        },
        {
          name: "Manuel Conde",
          email: "manuel@efectodental.com",
          password: labHashed,
          phone: "555-5678",
          role: "laboratorio",
          status: "active",
          lab_id: lab2?.id || "lab2"
        },
        {
          id: "doc1",
          name: "Dr. Mar\xEDa Gonz\xE1lez",
          email: "doctor@dental.com",
          password: doctorHashed,
          phone: "555-9999",
          role: "doctor",
          status: "active",
          lab_id: null
        },
        {
          id: "doc2",
          name: "Dr. David V\xE1zquez",
          email: "davaz3@hotmail.com",
          password: doctorHashed,
          phone: "555-7777",
          role: "doctor",
          status: "active",
          lab_id: null
        }
      ];
      const users2 = [];
      for (const userConfig of userConfigs) {
        try {
          const existing = await storage.getUserByEmail(userConfig.email);
          if (existing) {
            console.log(`Updated password for existing user: ${userConfig.email}`);
            const updatedUser = await storage.updateUser(existing.id, {
              password: userConfig.password,
              name: userConfig.name,
              status: userConfig.status
            });
            if (updatedUser) users2.push(updatedUser);
          } else {
            const user = await storage.createUser(userConfig);
            console.log(`Created new user: ${userConfig.email}`);
            users2.push(user);
          }
        } catch (error) {
          console.error(`Error with user ${userConfig.email}:`, error);
        }
      }
      res.json({
        message: "Production data initialized successfully",
        usersCreated: users2.length,
        laboratoriesCreated: 2,
        initialized: true,
        credentials: {
          superadmin: { email: "admin@dental.com", password: "SuperAdmin123!" },
          laboratory: { email: "lab@dental.com", password: "LabManager123!" },
          doctor: { email: "doctor@dental.com", password: "Doctor123!" }
        }
      });
    } catch (error) {
      console.error("Error initializing production data:", error);
      res.status(500).json({ error: "Failed to initialize production data" });
    }
  });
  app2.post("/api/admin/init-test-data", async (req, res) => {
    try {
      const initSecret = req.headers["x-init-secret"];
      const expectedSecret = process.env.INIT_SECRET || "disabled";
      if (!expectedSecret || expectedSecret === "disabled" || initSecret !== expectedSecret) {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      const existingAdmin = await storage.getUserByEmail("admin@dental.com");
      if (existingAdmin) {
        console.log("Users already exist, but updating passwords to ensure they work...");
      }
      const generatePassword = () => {
        const crypto = __require("crypto");
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let password = "";
        const bytes = crypto.randomBytes(12);
        for (let i = 0; i < 12; i++) {
          password += chars.charAt(bytes[i] % chars.length);
        }
        return password;
      };
      console.log("Initializing test data in database...");
      let lab1, lab2;
      try {
        lab1 = await storage.createLaboratory({
          name: "Laboratorio Dental Sonrisa",
          address: "Av. Principal 123, Madrid",
          phone: "555-1234",
          email: "info@sonrisa.com",
          status: "active"
        });
      } catch (e) {
        lab1 = await storage.getLaboratory("lab1");
      }
      try {
        lab2 = await storage.createLaboratory({
          name: "Efecto Dental",
          address: "Calle Efecto 456, Barcelona",
          phone: "555-5678",
          email: "info@efectodental.com",
          status: "active"
        });
      } catch (e) {
        lab2 = await storage.getLaboratory("lab2");
      }
      const users2 = [];
      const superAdminPassword = process.env.NODE_ENV === "development" ? "SuperAdmin123!" : generatePassword();
      const labPassword = process.env.NODE_ENV === "development" ? "LabManager123!" : generatePassword();
      const doctorPassword = process.env.NODE_ENV === "development" ? "Doctor123!" : generatePassword();
      const superAdminHashed = await bcrypt.hash(superAdminPassword, 10);
      const labHashed = await bcrypt.hash(labPassword, 10);
      const doctorHashed = await bcrypt.hash(doctorPassword, 10);
      const userConfigs = [
        {
          id: "admin1",
          name: "Super Admin",
          email: "admin@dental.com",
          password: superAdminHashed,
          phone: null,
          role: "superadmin",
          status: "active",
          lab_id: null
        },
        {
          name: "Lab Manager",
          email: "lab@dental.com",
          password: labHashed,
          phone: "555-1234",
          role: "laboratorio",
          status: "active",
          lab_id: "lab1"
        },
        {
          name: "Manuel Conde",
          email: "manuel@efectodental.com",
          password: labHashed,
          phone: "555-5678",
          role: "laboratorio",
          status: "active",
          lab_id: "lab2"
        },
        {
          id: "doc1",
          name: "Dr. Mar\xEDa Gonz\xE1lez",
          email: "doctor@dental.com",
          password: doctorHashed,
          phone: "555-9999",
          role: "doctor",
          status: "active",
          lab_id: "lab1"
        },
        {
          id: "efecto1",
          name: "David V\xE1zquez",
          email: "davaz3@hotmail.com",
          password: labHashed,
          phone: "555-7777",
          role: "laboratorio",
          status: "active",
          lab_id: "lab2"
        }
      ];
      if (process.env.NODE_ENV === "development") {
        console.log("Development passwords:");
        console.log("SuperAdmin:", superAdminPassword);
        console.log("Laboratory:", labPassword);
        console.log("Doctor:", doctorPassword);
      }
      for (const userConfig of userConfigs) {
        try {
          const existing = await storage.getUserByEmail(userConfig.email);
          if (!existing) {
            const user = await storage.createUser(userConfig);
            const safeUser = { ...user, password: "[HIDDEN]" };
            users2.push(safeUser);
            console.log(`Created new user: ${userConfig.email}`);
          } else {
            const updatedUser = await storage.updateUser(existing.id, {
              password: userConfig.password
            });
            console.log(`Updated password for existing user: ${userConfig.email}`);
            const safeUser = { ...updatedUser, password: "[HIDDEN]" };
            users2.push(safeUser);
          }
        } catch (e) {
          console.error(`Error with user ${userConfig.email}:`, e.message);
        }
      }
      console.log("Test data initialized successfully");
      res.json({
        message: "Test data initialized successfully",
        usersCreated: users2.length,
        laboratoriesCreated: 2,
        initialized: true,
        credentials: {
          superadmin: { email: "admin@dental.com", password: superAdminPassword },
          laboratory: { email: "lab@dental.com", password: labPassword },
          doctor: { email: "doctor@dental.com", password: doctorPassword }
        }
      });
    } catch (error) {
      console.error("Error initializing test data:", error);
      res.status(500).json({ error: "Failed to initialize test data", details: error.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
