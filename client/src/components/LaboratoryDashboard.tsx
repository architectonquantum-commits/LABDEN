import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { MetricCard } from "./MetricCard";
import { DashboardChart } from "./DashboardChart";
import { OrderCard } from "./OrderCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  Plus, 
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Users
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditDoctorModal } from "./EditDoctorModal";
import { DeleteDoctorModal } from "./DeleteDoctorModal";
import { OrderListModal } from "./OrderListModal";

type OrderStatus = "pendiente" | "en_proceso" | "terminada" | "cancelada";

interface Order {
  id: string;
  order_number: number;
  doctor_id: string;
  doctor_name: string;
  lab_id: string;
  status: OrderStatus;
  value: number;
  services: string[];
  created_at: string;
  observaciones?: string;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalValue: number;
  status: "active" | "inactive";
}

interface LaboratoryDashboardProps {
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => void;
  onCreateDoctor?: () => void;
  onEditDoctor?: (doctorId: string) => void;
  onDeleteDoctor?: (doctorId: string) => void;
  onCreateOrder?: () => void;
}

export function LaboratoryDashboard({ 
  onStatusChange,
  onCreateDoctor,
  onEditDoctor,
  onDeleteDoctor,
  onCreateOrder
}: LaboratoryDashboardProps) {
  const [orderFilter, setOrderFilter] = useState<OrderStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [isEditDoctorOpen, setIsEditDoctorOpen] = useState(false);
  const [isDeleteDoctorOpen, setIsDeleteDoctorOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  // Order list modal states
  const [isOrderListOpen, setIsOrderListOpen] = useState(false);
  const [orderListTitle, setOrderListTitle] = useState("");
  const [orderListFilter, setOrderListFilter] = useState<OrderStatus | "all">("all");

  // Fetch orders from API
  const { data: ordersData = [], isLoading: loadingOrders, refetch: refetchOrders } = useQuery<any[]>({
    queryKey: ["/api/orders"]
  });

  // Transform API data to match expected format
  const mockOrders: Order[] = ordersData.map((order, index) => ({
    id: order.id,
    order_number: order.order_number || (index + 1), // Use API order_number or fallback to index+1
    doctor_id: order.doctor_id,
    doctor_name: order.doctor_name || "Dentista", // API might not have doctor name
    lab_id: order.lab_id,
    status: order.status,
    value: parseFloat(order.value || "0"),
    services: order.services || [],
    created_at: order.created_at,
    observaciones: order.observaciones
  }));

  // Fetch doctors from API
  const { data: doctorsData = [], isLoading: loadingDoctors } = useQuery<any[]>({
    queryKey: ["/api/doctors"]
  });

  // Transform API data to match expected format
  const mockDoctors: Doctor[] = doctorsData.map(doctor => ({
    id: doctor.id,
    name: doctor.name,
    email: doctor.email,
    phone: doctor.phone || "555-0000", // Use phone from API or default
    ordersCount: 0, // Will be calculated from orders
    totalValue: 0, // Will be calculated from orders
    status: doctor.status === "active" ? "active" : "inactive"
  }));

  const pendingOrders = mockOrders.filter(o => o.status === "pendiente").length;
  const processingOrders = mockOrders.filter(o => o.status === "en_proceso").length;
  const completedOrders = mockOrders.filter(o => o.status === "terminada").length;
  const totalValue = mockOrders.reduce((acc, order) => acc + order.value, 0);

  const statusData = [
    { name: 'Pendientes', value: pendingOrders, color: 'hsl(210 50% 60%)' },
    { name: 'En Proceso', value: processingOrders, color: 'hsl(45 100% 60%)' },
    { name: 'Completadas', value: completedOrders, color: 'hsl(120 60% 50%)' }
  ];

  const filteredOrders = mockOrders.filter(order => {
    const matchesFilter = orderFilter === "all" || order.status === orderFilter;
    const matchesSearch = order.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const filteredDoctors = mockDoctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading state
  if (loadingDoctors || loadingOrders) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">
          {loadingOrders ? "Cargando órdenes..." : "Cargando dentistas..."}
        </div>
      </div>
    );
  }

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    console.log(`Changing order ${orderId} to ${newStatus}`);
    try {
      // Update order via API
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dental_auth_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      
      console.log(`Order ${orderId} status updated to ${newStatus}`);
      
      // Invalidate and refetch orders to update UI
      await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      // Call optional callback
      if (onStatusChange) {
        onStatusChange(orderId, newStatus);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      // TODO: Show error toast to user
    }
  };

  const handleDoctorAction = (action: string, doctorId: string) => {
    console.log(`${action} doctor ${doctorId}`);
    const doctor = mockDoctors.find(d => d.id === doctorId);
    if (!doctor) return;
    
    if (action === "edit") {
      setSelectedDoctor(doctor);
      setIsEditDoctorOpen(true);
      if (onEditDoctor) onEditDoctor(doctorId);
    }
    if (action === "delete") {
      setSelectedDoctor(doctor);
      setIsDeleteDoctorOpen(true);
      if (onDeleteDoctor) onDeleteDoctor(doctorId);
    }
  };
  
  const handleEditDoctorClose = () => {
    setIsEditDoctorOpen(false);
    setSelectedDoctor(null);
  };
  
  const handleDeleteDoctorClose = () => {
    setIsDeleteDoctorOpen(false);
    setSelectedDoctor(null);
  };
  
  const handleDoctorSuccess = () => {
    // Modals will handle their own query invalidation
    // This can be used for additional actions if needed
  };

  // Order list modal handlers
  const handleOpenOrderList = (title: string, filter: OrderStatus | "all") => {
    setOrderListTitle(title);
    setOrderListFilter(filter);
    setIsOrderListOpen(true);
  };

  const handleCloseOrderList = () => {
    setIsOrderListOpen(false);
    setOrderListTitle("");
    setOrderListFilter("all");
  };

  return (
    <div className="space-y-6 p-6" data-testid="laboratory-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Laboratorio</h1>
          <p className="text-muted-foreground">Gestión de órdenes y dentistas</p>
        </div>
        <Button onClick={onCreateOrder} data-testid="button-create-order">
          <Plus className="w-4 h-4 mr-2" />
          Crear Orden
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Órdenes"
          value={mockOrders.length}
          subtitle="Este mes"
          trend={{ direction: "up", percentage: 8.2 }}
          icon={<ShoppingCart className="w-4 h-4" />}
          variant="primary"
          onClick={() => handleOpenOrderList("Todas las Órdenes", "all")}
        />
        
        <MetricCard
          title="Pendientes"
          value={pendingOrders}
          subtitle="Por procesar"
          icon={<Clock className="w-4 h-4" />}
          variant="warning"
          onClick={() => handleOpenOrderList("Órdenes Pendientes", "pendiente")}
        />
        
        <MetricCard
          title="En Proceso"
          value={processingOrders}
          subtitle="Trabajando"
          icon={<Users className="w-4 h-4" />}
          onClick={() => handleOpenOrderList("Órdenes en Proceso", "en_proceso")}
        />
        
        <MetricCard
          title="Completadas"
          value={completedOrders}
          subtitle="Finalizadas"
          trend={{ direction: "up", percentage: 12.5 }}
          icon={<CheckCircle className="w-4 h-4" />}
          variant="success"
          onClick={() => handleOpenOrderList("Órdenes Completadas", "terminada")}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Valor Total"
          value={`$${totalValue.toLocaleString()}`}
          subtitle="Ingresos del mes"
          trend={{ direction: "up", percentage: 15.3 }}
          icon={<DollarSign className="w-4 h-4" />}
          variant="success"
        />
        
        <DashboardChart
          title="Estado de Órdenes"
          data={statusData}
          type="pie"
          height={200}
        />
      </div>

      {/* Tabs for Orders and Doctors */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Gestión de Órdenes</TabsTrigger>
          <TabsTrigger value="doctors">Gestión de Dentistas</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Órdenes</CardTitle>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar órdenes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                      data-testid="input-search-orders"
                    />
                  </div>
                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value as OrderStatus | "all")}
                    className="px-3 py-1 border rounded-md text-sm"
                    data-testid="select-order-filter"
                  >
                    <option value="all">Todos</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="en_proceso">En Proceso</option>
                    <option value="terminada">Terminadas</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    showActions={true}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Doctors Tab */}
        <TabsContent value="doctors">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Dentistas</CardTitle>
                <div className="flex items-center gap-2">
                  <Button onClick={onCreateDoctor} data-testid="button-create-doctor">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Dentista
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dentista</TableHead>
                    <TableHead>Órdenes</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.map((doctor) => (
                    <TableRow key={doctor.id} data-testid={`doctor-row-${doctor.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{doctor.name}</p>
                          <p className="text-sm text-muted-foreground">{doctor.email}</p>
                          <p className="text-sm text-muted-foreground">{doctor.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{doctor.ordersCount}</TableCell>
                      <TableCell>${doctor.totalValue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={doctor.status === "active" ? "default" : "secondary"}
                        >
                          {doctor.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              data-testid={`doctor-actions-${doctor.id}`}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDoctorAction("edit", doctor.id)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDoctorAction("delete", doctor.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Doctor Modals */}
      <EditDoctorModal
        isOpen={isEditDoctorOpen}
        onClose={handleEditDoctorClose}
        doctor={selectedDoctor}
      />
      
      <DeleteDoctorModal
        isOpen={isDeleteDoctorOpen}
        onClose={handleDeleteDoctorClose}
        onSuccess={handleDoctorSuccess}
        doctor={selectedDoctor}
      />

      {/* Order List Modal */}
      <OrderListModal
        isOpen={isOrderListOpen}
        onClose={handleCloseOrderList}
        orders={mockOrders}
        title={orderListTitle}
        filterStatus={orderListFilter}
      />
    </div>
  );
}