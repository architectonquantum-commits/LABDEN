import { 
  type User, 
  type InsertUser, 
  type Laboratory, 
  type InsertLaboratory,
  type Order,
  type InsertOrder,
  type Notification,
  type InsertNotification,
  users,
  laboratories,
  orders,
  notifications
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Laboratory methods
  getLaboratory(id: string): Promise<Laboratory | undefined>;
  getAllLaboratories(): Promise<Laboratory[]>;
  createLaboratory(lab: InsertLaboratory): Promise<Laboratory>;
  updateLaboratory(id: string, lab: Partial<InsertLaboratory>): Promise<Laboratory | undefined>;
  deleteLaboratory(id: string): Promise<boolean>;
  
  // Order methods
  getOrder(id: string): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  getOrdersByDoctorId(doctorId: string): Promise<Order[]>;
  getOrdersByLabId(labId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  updateOrderProgress(id: string, progress: string): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  
  // Notification methods
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private laboratories: Map<string, Laboratory>;
  private orders: Map<string, Order>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.users = new Map();
    this.laboratories = new Map();
    this.orders = new Map();
    this.notifications = new Map();
    
    // Initialize with some test data
    this.initializeTestData();
  }

  private initializeTestData() {
    // Create test laboratories
    const lab1: Laboratory = {
      id: "lab1",
      name: "Laboratorio Dental Sonrisa",
      address: "Av. Principal 123, Madrid",
      phone: "555-1234",
      email: "info@sonrisa.com",
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    const lab2: Laboratory = {
      id: "lab2",
      name: "Efecto Dental",
      address: "Calle Efecto 456, Barcelona",
      phone: "555-5678",
      email: "info@efectodental.com",
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    this.laboratories.set(lab1.id, lab1);
    this.laboratories.set(lab2.id, lab2);

    // Create test users
    const superAdmin: User = {
      id: "admin1",
      name: "Super Admin",
      email: "admin@dental.com",
      password: "$2b$10$YSZMm91hsG/6diYO95myNucUOEG147gdTiY9d8yXY5/64wHGdFj.u",
      phone: null,
      role: "superadmin",
      status: "active",
      lab_id: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    const labManager: User = {
      id: "lab1",
      name: "Lab Manager",
      email: "lab@dental.com",
      password: "$2b$10$YSZMm91hsG/6diYO95myNucUOEG147gdTiY9d8yXY5/64wHGdFj.u",
      phone: "555-1234",
      role: "laboratorio",
      status: "active",
      lab_id: "lab1",
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    const manuelConde: User = {
      id: "lab2",
      name: "Manuel Conde",
      email: "manuel@efectodental.com",
      password: "$2b$10$YSZMm91hsG/6diYO95myNucUOEG147gdTiY9d8yXY5/64wHGdFj.u",
      phone: "555-5678",
      role: "laboratorio",
      status: "active",
      lab_id: "lab2",
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    const doctor: User = {
      id: "doc1",
      name: "Dr. María González",
      email: "doctor@dental.com",
      password: "$2b$10$YSZMm91hsG/6diYO95myNucUOEG147gdTiY9d8yXY5/64wHGdFj.u",
      phone: "555-9999",
      role: "doctor",
      status: "active",
      lab_id: "lab1",
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    // Add test user for Efecto Dental lab as requested
    const efectoUser: User = {
      id: "efecto1",
      name: "David Vázquez",
      email: "davaz3@hotmail.com",
      password: "$2b$10$YSZMm91hsG/6diYO95myNucUOEG147gdTiY9d8yXY5/64wHGdFj.u",
      phone: "555-7777",
      role: "laboratorio",
      status: "active",
      lab_id: "lab2",
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.users.set(superAdmin.id, superAdmin);
    this.users.set(labManager.id, labManager);
    this.users.set(manuelConde.id, manuelConde);
    this.users.set(doctor.id, doctor);
    this.users.set(efectoUser.id, efectoUser);

    // Create test orders
    const order1: Order = {
      id: "123",
      doctor_id: "doc1",
      lab_id: "lab2",
      status: "pendiente",
      value: "1500.00",
      services: ["cucharilla", "modelo_estudio"],
      odontograma: {},
      observaciones: "Paciente con sensibilidad dental",
      instrucciones: null,
      progress_percentage: "0",
      order_number: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const order2: Order = {
      id: "124",
      doctor_id: "doc1", 
      lab_id: "lab2",
      status: "en_proceso",
      value: "890.00",
      services: ["corona", "puente"],
      odontograma: {},
      observaciones: null,
      instrucciones: null,
      progress_percentage: "45",
      order_number: 2,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const order3: Order = {
      id: "125",
      doctor_id: "doc1",
      lab_id: "lab2", 
      status: "terminada",
      value: "2100.00",
      services: ["implante", "prótesis", "ajuste"],
      odontograma: {},
      observaciones: null,
      instrucciones: null,
      progress_percentage: "100",
      order_number: 3,
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.orders.set(order1.id, order1);
    this.orders.set(order2.id, order2);
    this.orders.set(order3.id, order3);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      phone: insertUser.phone || null,
      status: insertUser.status || "active",
      lab_id: insertUser.lab_id || null,
      id,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      ...updateData, 
      updated_at: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Laboratory methods
  async getLaboratory(id: string): Promise<Laboratory | undefined> {
    return this.laboratories.get(id);
  }

  async getAllLaboratories(): Promise<Laboratory[]> {
    return Array.from(this.laboratories.values());
  }

  async createLaboratory(insertLab: InsertLaboratory): Promise<Laboratory> {
    const id = randomUUID();
    const lab: Laboratory = {
      ...insertLab,
      status: insertLab.status || "active",
      email: insertLab.email || null,
      id,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.laboratories.set(id, lab);
    return lab;
  }

  async updateLaboratory(id: string, updateData: Partial<InsertLaboratory>): Promise<Laboratory | undefined> {
    const lab = this.laboratories.get(id);
    if (!lab) return undefined;
    
    const updatedLab = { 
      ...lab, 
      ...updateData, 
      updated_at: new Date() 
    };
    this.laboratories.set(id, updatedLab);
    return updatedLab;
  }

  async deleteLaboratory(id: string): Promise<boolean> {
    return this.laboratories.delete(id);
  }

  // Order methods
  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByDoctorId(doctorId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      order => order.doctor_id === doctorId
    );
  }

  async getOrdersByLabId(labId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      order => order.lab_id === labId
    );
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      id,
      doctor_id: insertOrder.doctor_id,
      lab_id: insertOrder.lab_id,
      status: insertOrder.status || "pendiente",
      value: insertOrder.value || null,
      services: insertOrder.services,
      odontograma: insertOrder.odontograma,
      observaciones: insertOrder.observaciones || null,
      instrucciones: insertOrder.instrucciones || null,
      progress_percentage: insertOrder.progress_percentage || "0",
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, updateData: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = { 
      ...order, 
      ...updateData, 
      updated_at: new Date() 
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: string): Promise<boolean> {
    return this.orders.delete(id);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async updateOrderProgress(id: string, progressData: { status?: string; progress_percentage?: number }): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = {
      ...order,
      status: (progressData.status || order.status) as "pendiente" | "iniciada" | "en_proceso" | "terminada",
      progress_percentage: progressData.progress_percentage?.toString() || order.progress_percentage || "0",
      updated_at: new Date()
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Notification methods
  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values()).filter(
      notification => notification.user_id === userId
    );
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      status: insertNotification.status || "unread",
      id,
      created_at: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    const updatedNotification = { ...notification, status: "read" };
    this.notifications.set(id, updatedNotification);
    return true;
  }
}

export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ ...user, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Laboratory methods
  async getLaboratory(id: string): Promise<Laboratory | undefined> {
    const result = await db.select().from(laboratories).where(eq(laboratories.id, id));
    return result[0];
  }

  async getAllLaboratories(): Promise<Laboratory[]> {
    return await db.select().from(laboratories);
  }

  async createLaboratory(lab: InsertLaboratory): Promise<Laboratory> {
    const [newLab] = await db.insert(laboratories).values(lab).returning();
    return newLab;
  }

  async updateLaboratory(id: string, lab: Partial<InsertLaboratory>): Promise<Laboratory | undefined> {
    const [updatedLab] = await db.update(laboratories)
      .set({ ...lab, updated_at: new Date() })
      .where(eq(laboratories.id, id))
      .returning();
    return updatedLab;
  }

  async deleteLaboratory(id: string): Promise<boolean> {
    const result = await db.delete(laboratories).where(eq(laboratories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Order methods
  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }

  async getOrdersByDoctorId(doctorId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.doctor_id, doctorId));
  }

  async getOrdersByLabId(labId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.lab_id, labId));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updatedOrder] = await db.update(orders)
      .set({ ...order, updated_at: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async updateOrderProgress(id: string, progress: string): Promise<Order | undefined> {
    const [updatedOrder] = await db.update(orders)
      .set({ progress_percentage: progress, updated_at: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Notification methods
  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.user_id, userId));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ status: "read" })
      .where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DbStorage();
