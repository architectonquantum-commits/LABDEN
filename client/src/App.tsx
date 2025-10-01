import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, apiRequest, setAuthToken, removeAuthToken } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Components
import { LoginForm } from "./components/LoginForm";
import { Layout } from "./components/Layout";
import { SuperAdminDashboard } from "./components/SuperAdminDashboard";
import { LaboratoryDashboard } from "./components/LaboratoryDashboard";
import { DoctorDashboard } from "./components/DoctorDashboard";
import { CreateOrderForm } from "./components/CreateOrderForm";
import { CreateUserModal } from "./components/CreateUserModal";
import { CreateLabModal } from "./components/CreateLabModal";
import { CreateDoctorModal } from "./components/CreateDoctorModal";
import { EditLabModal } from "./components/EditLabModal";
import { DeleteLabModal } from "./components/DeleteLabModal";
import { OrderDetailsModal } from "./components/OrderDetailsModal";
import NotFound from "@/pages/not-found";
import { InitUsersPage } from "@/pages/init-users";

interface User {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "laboratorio" | "doctor";
  lab_id?: string;
  lab_name?: string;
}

type CurrentView = 
  | "dashboard" 
  | "create-order"
  | "manage-labs"
  | "manage-doctors"
  | "orders";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<CurrentView>("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  
  // Modal states
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreateLabModalOpen, setIsCreateLabModalOpen] = useState(false);
  const [isCreateDoctorModalOpen, setIsCreateDoctorModalOpen] = useState(false);
  const [isEditLabModalOpen, setIsEditLabModalOpen] = useState(false);
  const [isDeleteLabModalOpen, setIsDeleteLabModalOpen] = useState(false);
  
  // Data states
  const [laboratories, setLaboratories] = useState<Array<{ id: string; name: string; }>>([]);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [selectedLab, setSelectedLab] = useState<{ id: string; name: string; } | null>(null);
  const [orderDetailsModalOpen, setOrderDetailsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('dental_auth_token');
      if (token) {
        try {
          const response = await apiRequest('GET', '/api/users/me');
          const userData = await response.json();
          setUser(userData);
        } catch (error) {
          console.log('Token invalid, clearing auth');
          removeAuthToken();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Load laboratories when user is authenticated and is superadmin
  useEffect(() => {
    const loadLaboratories = async () => {
      if (user && user.role === "superadmin") {
        try {
          const response = await apiRequest('GET', '/api/labs');
          const labsData = await response.json();
          setLaboratories(labsData);
        } catch (error) {
          console.error('Error loading laboratories:', error);
        }
      }
    };

    loadLaboratories();
  }, [user]);

  const handleLogin = async (email: string, password: string, role: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      const data = await response.json();
      
      setAuthToken(data.token);
      
      // Get complete user data including lab_name
      const userResponse = await apiRequest('GET', '/api/users/me');
      const userData = await userResponse.json();
      setUser(userData);
      
      setCurrentView("dashboard");
      console.log(`User ${email} logged in as ${userData.role}`);
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Invalid credentials');
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    setCurrentView("dashboard");
    console.log("User logged out");
  };

  const handleCreateOrder = () => {
    setCurrentView("create-order");
  };

  const handleCancelOrder = () => {
    setCurrentView("dashboard");
  };

  const handleSubmitOrder = async (orderData: any) => {
    try {
      // Prepare the payload for the backend
      const orderPayload = {
        value: orderData.value ? orderData.value.toString() : undefined,
        services: orderData.services,
        nombrePaciente: orderData.nombrePaciente, // Include patient name
        observaciones: orderData.observaciones || undefined,
        instrucciones: orderData.instrucciones || undefined,
        odontograma: orderData.odontograma,
        doctorId: (orderData.doctorId && orderData.doctorId !== 'unassigned') ? orderData.doctorId : undefined
      };
      
      // Call the backend API to create the order
      await apiRequest('POST', '/api/orders', orderPayload);
      
      console.log("Order created successfully");
      
      // Refresh the order data
      await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      // Don't navigate here - let CreateOrderForm handle the success flow
    } catch (error) {
      console.error('Error creating order:', error);
      // TODO: Show error toast to user
      throw error; // Re-throw so CreateOrderForm can handle the error
    }
  };

  const handleCreateUser = () => {
    setIsCreateUserModalOpen(true);
  };

  const handleCreateLab = () => {
    setIsCreateLabModalOpen(true);
  };

  const handleCreateDoctor = () => {
    setIsCreateDoctorModalOpen(true);
  };

  const handleModalSuccess = () => {
    // Invalidate TanStack Query cache to refresh SuperAdmin data
    if (user && user.role === "superadmin") {
      // Use queryClient to invalidate caches instead of manual API calls
      queryClient.invalidateQueries({ queryKey: ['/api/labs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    }
  };

  const handleEditLab = (labId: string) => {
    setSelectedLabId(labId);
    setIsEditLabModalOpen(true);
  };

  const handleDeleteLab = (labId: string) => {
    const lab = laboratories.find(l => l.id === labId);
    if (lab) {
      setSelectedLab(lab);
      setIsDeleteLabModalOpen(true);
    }
  };

  const handleEditDoctor = (doctorId: string) => {
    console.log(`Edit doctor ${doctorId}`);
    // TODO: Implement doctor editing
  };

  const handleDeleteDoctor = (doctorId: string) => {
    console.log(`Delete doctor ${doctorId}`);
    // TODO: Implement doctor deletion with confirmation
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    console.log(`Order ${orderId} status changed to ${newStatus}`);
    // TODO: Update order status in backend
  };

  const handleViewOrderDetails = async (orderId: string) => {
    console.log(`View order ${orderId} details`);
    try {
      // Fetch the complete order details
      const response = await apiRequest('GET', `/api/orders/${orderId}`);
      const orderDetails = await response.json();
      setSelectedOrder(orderDetails);
      setOrderDetailsModalOpen(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handleArchiveOrder = async (orderId: string) => {
    try {
      // Call the backend API to archive the order
      await apiRequest('PATCH', `/api/orders/${orderId}`, { archivado: true });
      
      console.log(`Order ${orderId} archived successfully`);
      
      // Invalidate queries to immediately update UI
      await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    } catch (error) {
      console.error('Error archiving order:', error);
      // TODO: Show error toast to user
    }
  };

  const renderContent = () => {
    // Check if we're on the init-users route
    if (window.location.pathname === '/init-users') {
      return <InitUsersPage />;
    }
    
    if (!user) {
      return <LoginForm onLogin={handleLogin} />;
    }

    switch (currentView) {
      case "create-order":
        if (user.role === "doctor" || user.role === "laboratorio") {
          return (
            <CreateOrderForm
              onSubmit={handleSubmitOrder}
              onCancel={handleCancelOrder}
              userRole={user.role}
            />
          );
        }
        return <div>Access denied</div>;

      case "dashboard":
      default:
        switch (user.role) {
          case "superadmin":
            return (
              <SuperAdminDashboard
                onCreateUser={handleCreateUser}
                onCreateLab={handleCreateLab}
                onEditLab={handleEditLab}
                onDeleteLab={handleDeleteLab}
              />
            );
          
          case "laboratorio":
            return (
              <LaboratoryDashboard
                onStatusChange={handleStatusChange}
                onCreateDoctor={handleCreateDoctor}
                onEditDoctor={handleEditDoctor}
                onDeleteDoctor={handleDeleteDoctor}
                onCreateOrder={handleCreateOrder}
              />
            );
          
          case "doctor":
            return (
              <DoctorDashboard
                onCreateOrder={handleCreateOrder}
                onViewOrderDetails={handleViewOrderDetails}
                onArchiveOrder={handleArchiveOrder}
              />
            );
          
          default:
            return <div>Invalid user role</div>;
        }
    }
  };

  if (isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen" data-testid="app">
          {user ? (
            <Layout user={user} onLogout={handleLogout}>
              {renderContent()}
            </Layout>
          ) : (
            renderContent()
          )}
        </div>
        
        {/* Modals */}
        <CreateUserModal
          isOpen={isCreateUserModalOpen}
          onClose={() => setIsCreateUserModalOpen(false)}
          onSuccess={handleModalSuccess}
          laboratories={laboratories}
        />
        
        <CreateLabModal
          isOpen={isCreateLabModalOpen}
          onClose={() => setIsCreateLabModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
        
        <CreateDoctorModal
          isOpen={isCreateDoctorModalOpen}
          onClose={() => setIsCreateDoctorModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
        
        <EditLabModal
          isOpen={isEditLabModalOpen}
          onClose={() => {
            setIsEditLabModalOpen(false);
            setSelectedLabId(null);
          }}
          onSuccess={handleModalSuccess}
          labId={selectedLabId}
        />
        
        <DeleteLabModal
          isOpen={isDeleteLabModalOpen}
          onClose={() => {
            setIsDeleteLabModalOpen(false);
            setSelectedLab(null);
          }}
          onSuccess={handleModalSuccess}
          lab={selectedLab}
        />
        
        <OrderDetailsModal
          isOpen={orderDetailsModalOpen}
          onClose={() => {
            setOrderDetailsModalOpen(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
        />
        
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;