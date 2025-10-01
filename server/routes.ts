import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertLaboratorySchema, insertOrderSchema, createDoctorSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Require strong JWT secret in production  
if (!process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: SESSION_SECRET environment variable is required in production');
    process.exit(1);
  } else {
    console.warn('WARNING: SESSION_SECRET not set, using development fallback');
  }
}
const JWT_SECRET = process.env.SESSION_SECRET || "dev-secret-key-change-in-production";

// Auth middleware
async function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.log('Authenticated user:', { id: user.id, email: user.email, role: user.role, lab_id: user.lab_id });
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// Role-based access control
function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Use bcrypt to verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
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

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password before storing
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

  // User routes
  app.get("/api/users/me", authenticateToken, async (req: any, res) => {
    // Get laboratory name if user has lab_id
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
      lab_name: lab_name
    });
  });

  // Get all users (SuperAdmin only)
  app.get("/api/users", authenticateToken, requireRole(['superadmin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Fetch lab names for users who have lab_id
      const usersWithLabNames = await Promise.all(
        users.map(async (user) => {
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

  // Laboratory routes
  app.get("/api/labs", authenticateToken, requireRole(['superadmin']), async (req, res) => {
    try {
      const labs = await storage.getAllLaboratories();
      res.json(labs);
    } catch (error) {
      console.error("Get labs error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/labs/:id", authenticateToken, requireRole(['superadmin']), async (req, res) => {
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

  app.post("/api/labs", authenticateToken, requireRole(['superadmin']), async (req, res) => {
    try {
      const labData = insertLaboratorySchema.parse(req.body);
      const lab = await storage.createLaboratory(labData);
      res.status(201).json(lab);
    } catch (error) {
      console.error("Create lab error:", error);
      res.status(400).json({ error: "Invalid laboratory data" });
    }
  });

  app.put("/api/labs/:id", authenticateToken, requireRole(['superadmin']), async (req, res) => {
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

  app.delete("/api/labs/:id", authenticateToken, requireRole(['superadmin']), async (req, res) => {
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

  // Get users assigned to a specific laboratory
  app.get("/api/labs/:id/users", authenticateToken, requireRole(['superadmin']), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify laboratory exists
      const lab = await storage.getLaboratory(id);
      if (!lab) {
        return res.status(404).json({ error: "Laboratory not found" });
      }
      
      // Get all users assigned to this laboratory
      const allUsers = await storage.getAllUsers();
      const labUsers = allUsers.filter(user => user.lab_id === id);
      
      // Return user data without sensitive information
      const safeUsers = labUsers.map(user => ({
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

  // Get orders for a specific laboratory
  app.get("/api/labs/:id/orders", authenticateToken, requireRole(['superadmin']), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verify laboratory exists
      const lab = await storage.getLaboratory(id);
      if (!lab) {
        return res.status(404).json({ error: "Laboratory not found" });
      }
      
      // Get orders for this laboratory
      const labOrders = await storage.getOrdersByLabId(id);
      
      // Enrich orders with doctor information
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

  // Change laboratory status
  app.patch("/api/labs/:id/status", authenticateToken, requireRole(['superadmin']), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate request body with Zod
      const statusSchema = z.object({
        status: z.enum(["active", "inactive"])
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

  // Doctor management routes (for labs)
  app.get("/api/doctors", authenticateToken, requireRole(['laboratorio', 'superadmin']), async (req: any, res) => {
    try {
      // For lab users, only show doctors from their lab
      const labId = req.user.role === 'laboratorio' ? req.user.lab_id : req.query.lab_id;
      
      // Get all users with doctor role
      const allUsers = await storage.getAllUsers();
      const doctors = allUsers.filter(user => 
        user.role === 'doctor' && 
        (req.user.role === 'superadmin' || user.lab_id === labId)
      );
      
      // Sanitize response - exclude password and other sensitive fields
      const sanitizedDoctors = doctors.map(doctor => ({
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

  app.post("/api/doctors", authenticateToken, requireRole(['laboratorio']), async (req: any, res) => {
    try {
      const validatedData = createDoctorSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email ya está en uso. Intenta con otro email." });
      }

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      const doctorData = {
        ...validatedData,
        password: hashedPassword, // Use encrypted password
        role: 'doctor' as const,
        status: 'active' as const,
        lab_id: req.user.lab_id
      };
      
      const doctor = await storage.createUser(doctorData);
      // SECURITY: Never return password field
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos del doctor" });
      }
      res.status(500).json({ error: "No se pudo crear el doctor. Intenta nuevamente." });
    }
  });

  // Update doctor (PUT /doctors/:id)
  app.put("/api/doctors/:id", authenticateToken, requireRole(['laboratorio', 'superadmin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Get the doctor first to verify they exist and belong to the right lab
      const doctor = await storage.getUser(id);
      if (!doctor || doctor.role !== 'doctor') {
        return res.status(404).json({ error: "Doctor not found" });
      }
      
      // Check if lab user can edit this doctor
      if (req.user.role === 'laboratorio' && doctor.lab_id !== req.user.lab_id) {
        return res.status(403).json({ error: "Cannot edit doctors from other laboratories" });
      }
      
      // Validate update data
      const updateSchema = z.object({
        name: z.string().min(2, "Name must be at least 2 characters").optional(),
        email: z.string().email("Invalid email format").optional(),
        phone: z.string().min(10, "Phone must be at least 10 characters").optional(),
        status: z.enum(["active", "inactive"]).optional()
      });
      
      const validatedData = updateSchema.parse(req.body);
      
      // Update doctor
      const updatedDoctor = await storage.updateUser(id, validatedData);
      if (!updatedDoctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }
      
      // SECURITY: Never return password field
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

  // Delete doctor (DELETE /doctors/:id)
  app.delete("/api/doctors/:id", authenticateToken, requireRole(['laboratorio', 'superadmin']), async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Get the doctor first to verify they exist and belong to the right lab
      const doctor = await storage.getUser(id);
      if (!doctor || doctor.role !== 'doctor') {
        return res.status(404).json({ error: "Doctor not found" });
      }
      
      // Check if lab user can delete this doctor
      if (req.user.role === 'laboratorio' && doctor.lab_id !== req.user.lab_id) {
        return res.status(403).json({ error: "Cannot delete doctors from other laboratories" });
      }
      
      // Check if doctor has orders - for safety, don't allow deletion if they have orders
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

  // Get doctors for specific laboratory (GET /labs/:labId/doctors)
  app.get("/api/labs/:labId/doctors", authenticateToken, requireRole(['laboratorio', 'superadmin']), async (req: any, res) => {
    try {
      const { labId } = req.params;
      
      // Verify laboratory exists
      const lab = await storage.getLaboratory(labId);
      if (!lab) {
        return res.status(404).json({ error: "Laboratory not found" });
      }
      
      // Check if lab user can access this lab's doctors
      if (req.user.role === 'laboratorio' && req.user.lab_id !== labId) {
        return res.status(403).json({ error: "Cannot access doctors from other laboratories" });
      }
      
      // Get all users with doctor role for this lab
      const allUsers = await storage.getAllUsers();
      const doctors = allUsers.filter(user => 
        user.role === 'doctor' && user.lab_id === labId
      );
      
      // SECURITY: Never return password fields
      const safeDoctors = doctors.map(doctor => ({
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

  // Order routes
  app.get("/api/orders", authenticateToken, async (req: any, res) => {
    try {
      let orders: any[] = [];
      
      
      if (req.user.role === 'doctor') {
        orders = await storage.getOrdersByDoctorId(req.user.id);
      } else if (req.user.role === 'laboratorio') {
        orders = await storage.getOrdersByLabId(req.user.lab_id);
      } else if (req.user.role === 'superadmin') {
        // Get all orders for superadmin
        orders = await storage.getAllOrders();
      }

      // Enrich orders with user and lab information
      const enrichedOrders = await Promise.all(orders.map(async (order: any) => {
        const doctor = await storage.getUser(order.doctor_id);
        const lab = await storage.getLaboratory(order.lab_id);
        
        const enrichedOrder = {
          ...order,
          doctor_name: doctor?.name || 'Unknown Doctor',
          lab_name: lab?.name || 'Unknown Lab'
        };
        
        
        return enrichedOrder;
      }));
      
      res.json(enrichedOrders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/orders", authenticateToken, requireRole(['doctor', 'laboratorio']), async (req: any, res) => {
    try {
      const requestData = req.body;
      console.log('Creating order for user:', { id: req.user.id, role: req.user.role, lab_id: req.user.lab_id });
      console.log('Request data:', JSON.stringify(requestData, null, 2));
      
      let orderData: any;
      
      if (req.user.role === 'doctor') {
        // Doctor creating order for themselves - add server-controlled fields before validation
        const orderDataWithServerFields = {
          ...requestData,
          doctor_id: req.user.id,
          lab_id: req.user.lab_id
        };
        orderData = insertOrderSchema.parse(orderDataWithServerFields);
      } else if (req.user.role === 'laboratorio') {
        // Lab user creating order, optionally assigning to a doctor
        const { doctorId, lab_id: _, ...orderFields } = requestData; // Ignore any client-supplied lab_id for security
        
        // Validate doctor exists and belongs to this lab if provided
        if (doctorId) {
          const doctor = await storage.getUser(doctorId);
          if (!doctor) {
            return res.status(400).json({ error: "Doctor not found" });
          }
          if (doctor.role !== 'doctor') {
            return res.status(400).json({ error: "Invalid user role - must be doctor" });
          }
          if (doctor.lab_id !== req.user.lab_id) {
            return res.status(403).json({ error: "Cannot assign orders to doctors from other laboratories" });
          }
        }
        
        // Include required fields for schema validation (server-controlled)
        const orderFieldsWithDefaults = {
          ...orderFields,
          doctor_id: doctorId || null, // Optional doctor assignment
          lab_id: req.user.lab_id // Always set from authenticated user (security)
        };
        
        orderData = insertOrderSchema.parse(orderFieldsWithDefaults);
      }
      
      const order = await storage.createOrder(orderData);
      
      // Create appropriate notifications
      if (req.user.role === 'doctor') {
        // Doctor created order - notify lab
        await storage.createNotification({
          user_id: req.user.lab_id, // Assuming lab manager has same ID as lab
          type: 'new_order',
          message: `Nueva orden #${order.id} de ${req.user.name}`,
          status: 'unread'
        });
      } else if (req.user.role === 'laboratorio' && orderData.doctor_id) {
        // Lab assigned order to doctor - notify the doctor
        await storage.createNotification({
          user_id: orderData.doctor_id,
          type: 'order_assigned',
          message: `Se te asignó la orden #${order.id}`,
          status: 'unread'
        });
      }
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Create order error:", error);
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  app.put("/api/orders/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check permissions
      if (req.user.role === 'doctor' && order.doctor_id !== req.user.id) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      if (req.user.role === 'laboratorio' && order.lab_id !== req.user.lab_id) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const orderData = insertOrderSchema.partial().parse(req.body);
      const updatedOrder = await storage.updateOrder(id, orderData);
      
      // Create notification if status changed
      if (orderData.status && orderData.status !== order.status && order.doctor_id) {
        const doctor = await storage.getUser(order.doctor_id);
        await storage.createNotification({
          user_id: order.doctor_id,
          type: 'order_status_changed',
          message: `Tu orden #${order.id} cambió a ${orderData.status}`,
          status: 'unread'
        });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Update order error:", error);
      res.status(400).json({ error: "Invalid order data" });
    }
  });

  // Get specific order details
  app.get("/api/orders/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check permissions
      if (req.user.role === 'doctor' && order.doctor_id !== req.user.id) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      if (req.user.role === 'laboratorio' && order.lab_id !== req.user.lab_id) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      res.json(order);
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Archive/unarchive order (PATCH)
  app.patch("/api/orders/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Validate request body with Zod
      const archiveSchema = z.object({
        archivado: z.boolean()
      });
      
      const validatedData = archiveSchema.parse(req.body);
      const { archivado } = validatedData;
      
      const order = await storage.getOrder(id);
      
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check permissions - only doctor who created the order can archive it
      if (req.user.role === 'doctor' && order.doctor_id !== req.user.id) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      
      // For laboratorio role, check lab_id
      if (req.user.role === 'laboratorio' && order.lab_id !== req.user.lab_id) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const updatedOrder = await storage.updateOrder(id, { archivado: !!archivado });
      
      console.log(`Order ${id} ${archivado ? 'archived' : 'unarchived'} successfully`);
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Archive order error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", authenticateToken, async (req: any, res) => {
    try {
      const notifications = await storage.getNotificationsByUserId(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
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

  // Update order progress
  app.put("/api/orders/:id/progress", authenticateToken, requireRole(['laboratorio', 'superadmin']), async (req: any, res) => {
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

  // Web-based initialization for production
  app.post("/api/admin/init-production-data", async (req, res) => {
    try {
      // Security: Simple verification to prevent accidental usage
      const { confirmInitialization } = req.body;
      if (confirmInitialization !== "INITIALIZE_PRODUCTION_DATA_CONFIRMED") {
        return res.status(400).json({ 
          error: "Missing confirmation", 
          required: "Send POST with {\"confirmInitialization\": \"INITIALIZE_PRODUCTION_DATA_CONFIRMED\"}"
        });
      }

      console.log("Initializing production data...");
      
      // Use fixed development passwords for production consistency
      const superAdminPassword = "SuperAdmin123!";
      const labPassword = "LabManager123!";
      const doctorPassword = "Doctor123!";
      
      // Hash the passwords
      const superAdminHashed = await bcrypt.hash(superAdminPassword, 10);
      const labHashed = await bcrypt.hash(labPassword, 10);
      const doctorHashed = await bcrypt.hash(doctorPassword, 10);
      
      // Create test laboratories first (check if exists)
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
          role: "superadmin" as const,
          status: "active",
          lab_id: null
        },
        {

          name: "Lab Manager", 
          email: "lab@dental.com",
          password: labHashed,
          phone: "555-1234",
          role: "laboratorio" as const,
          status: "active",
          lab_id: lab1?.id || "lab1"
        },
        {

          name: "Manuel Conde",
          email: "manuel@efectodental.com", 
          password: labHashed,
          phone: "555-5678",
          role: "laboratorio" as const,
          status: "active",
          lab_id: lab2?.id || "lab2"
        },
        {
          id: "doc1",
          name: "Dr. María González",
          email: "doctor@dental.com",
          password: doctorHashed,
          phone: "555-9999",
          role: "doctor" as const,
          status: "active",
          lab_id: null
        },
        {
          id: "doc2",
          name: "Dr. David Vázquez",
          email: "davaz3@hotmail.com",
          password: doctorHashed,
          phone: "555-7777", 
          role: "doctor" as const,
          status: "active",
          lab_id: null
        }
      ] as const;

      // Create or update users
      const users = [];
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
            if (updatedUser) users.push(updatedUser);
          } else {
            const user = await storage.createUser(userConfig);
            console.log(`Created new user: ${userConfig.email}`);
            users.push(user);
          }
        } catch (error) {
          console.error(`Error with user ${userConfig.email}:`, error);
        }
      }

      res.json({
        message: "Production data initialized successfully",
        usersCreated: users.length,
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

  // TEMPORARY: Initialize test data - SECURED
  app.post("/api/admin/init-test-data", async (req, res) => {
    try {
      // Security: Require environment secret for access
      const initSecret = req.headers['x-init-secret'];
      const expectedSecret = process.env.INIT_SECRET || 'disabled';
      if (!expectedSecret || expectedSecret === 'disabled' || initSecret !== expectedSecret) {
        return res.status(403).json({ error: "Unauthorized access" });
      }

      // Check if already initialized - but we'll still update passwords
      const existingAdmin = await storage.getUserByEmail("admin@dental.com");
      if (existingAdmin) {
        console.log("Users already exist, but updating passwords to ensure they work...");
      }

      // Generate cryptographically secure passwords
      const generatePassword = () => {
        const crypto = require('crypto');
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        const bytes = crypto.randomBytes(12);
        for (let i = 0; i < 12; i++) {
          password += chars.charAt(bytes[i] % chars.length);
        }
        return password;
      };

      console.log("Initializing test data in database...");
      
      // Create test laboratories first (check if exists)
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

      // Create test users (check if exists)
      const users = [];
      // For development/testing only - use specific passwords for easy testing
      // In real production, these should be generated and sent securely
      const superAdminPassword = process.env.NODE_ENV === 'development' ? 'SuperAdmin123!' : generatePassword();
      const labPassword = process.env.NODE_ENV === 'development' ? 'LabManager123!' : generatePassword();
      const doctorPassword = process.env.NODE_ENV === 'development' ? 'Doctor123!' : generatePassword();
      
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
          role: "superadmin" as const,
          status: "active",
          lab_id: null
        },
        {

          name: "Lab Manager", 
          email: "lab@dental.com",
          password: labHashed,
          phone: "555-1234",
          role: "laboratorio" as const,
          status: "active",
          lab_id: "lab1"
        },
        {

          name: "Manuel Conde",
          email: "manuel@efectodental.com", 
          password: labHashed,
          phone: "555-5678",
          role: "laboratorio" as const,
          status: "active",
          lab_id: "lab2"
        },
        {
          id: "doc1",
          name: "Dr. María González",
          email: "doctor@dental.com",
          password: doctorHashed, 
          phone: "555-9999",
          role: "doctor" as const,
          status: "active",
          lab_id: "lab1"
        },
        {
          id: "efecto1",
          name: "David Vázquez",
          email: "davaz3@hotmail.com",
          password: labHashed,
          phone: "555-7777", 
          role: "laboratorio" as const,
          status: "active",
          lab_id: "lab2"
        }
      ];
      
      // Log passwords for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Development passwords:');
        console.log('SuperAdmin:', superAdminPassword);
        console.log('Laboratory:', labPassword);
        console.log('Doctor:', doctorPassword);
      }

      for (const userConfig of userConfigs) {
        try {
          const existing = await storage.getUserByEmail(userConfig.email);
          if (!existing) {
            // Create new user
            const user = await storage.createUser(userConfig);
            // SECURITY: Never return passwords
            const safeUser = { ...user, password: "[HIDDEN]" };
            users.push(safeUser);
            console.log(`Created new user: ${userConfig.email}`);
          } else {
            // Update existing user's password
            const updatedUser = await storage.updateUser(existing.id, {
              password: userConfig.password
            });
            console.log(`Updated password for existing user: ${userConfig.email}`);
            const safeUser = { ...updatedUser, password: "[HIDDEN]" };
            users.push(safeUser);
          }
        } catch (e) {
          console.error(`Error with user ${userConfig.email}:`, e.message);
        }
      }

      console.log("Test data initialized successfully");
      res.json({ 
        message: "Test data initialized successfully",
        usersCreated: users.length,
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

  const httpServer = createServer(app);
  return httpServer;
}
