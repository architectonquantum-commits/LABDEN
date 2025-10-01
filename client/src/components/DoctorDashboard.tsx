import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "./MetricCard";
import { DashboardChart } from "./DashboardChart";
import { OrderCard } from "./OrderCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  Plus, 
  Search,
  Stethoscope,
  X,
  Calendar,
  Building2
} from "lucide-react";

type OrderStatus = "pendiente" | "en_proceso" | "terminada" | "cancelada";

interface Order {
  id: string;
  order_number: number;
  doctor_id: string;
  doctor_name: string;
  lab_id: string;
  lab_name?: string;
  status: OrderStatus;
  value: number;
  services: string[];
  created_at: string;
  observaciones?: string;
  archivado?: boolean;
}

interface DoctorDashboardProps {
  onCreateOrder?: () => void;
  onViewOrderDetails?: (orderId: string) => void;
  onArchiveOrder?: (orderId: string) => void;
}

export function DoctorDashboard({ 
  onCreateOrder,
  onViewOrderDetails,
  onArchiveOrder
}: DoctorDashboardProps) {
  const [orderFilter, setOrderFilter] = useState<OrderStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFilter, setModalFilter] = useState<OrderStatus | "all">("all");

  // Fetch current user information
  const { data: currentUser } = useQuery<{
    id: string;
    name: string;
    email: string;
    role: string;
    lab_name?: string;
  }>({
    queryKey: ['/api/users/me']
  });

  // Fetch real orders from API (backend already filters by doctor for doctor role)
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['/api/orders'],
    select: (data: any[]) => data
      .filter((order: any) => !order.archivado) // Filter out archived orders
      .map(order => ({
        id: order.id,
        order_number: order.order_number,
        doctor_id: order.doctor_id,
        doctor_name: order.doctor_name || currentUser?.name || "Dentista",
        lab_id: order.lab_id,
        lab_name: order.lab_name || currentUser?.lab_name || "Laboratorio",
        status: order.status,
        value: parseFloat(order.value || "0"),
        services: order.services || [],
        created_at: order.created_at,
        observaciones: order.observaciones,
        archivado: order.archivado || false
      })) as Order[]
  });

  const filteredOrders = orders.filter(order => {
    const matchesFilter = orderFilter === "all" || order.status === orderFilter;
    const matchesSearch = order.id.includes(searchTerm) ||
                         order.services.some(service => 
                           service.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    return matchesFilter && matchesSearch;
  });

  const pendingOrders = orders.filter(o => o.status === "pendiente").length;
  const processingOrders = orders.filter(o => o.status === "en_proceso").length;
  const completedOrders = orders.filter(o => o.status === "terminada").length;
  const totalValue = orders.reduce((acc, order) => acc + order.value, 0);

  // Functions to handle metric card clicks
  const openModal = (filter: OrderStatus | "all") => {
    setModalFilter(filter);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const getModalTitle = () => {
    switch (modalFilter) {
      case "all":
        return "Todas las Órdenes";
      case "pendiente":
        return "Órdenes Pendientes";
      case "en_proceso":
        return "Órdenes en Proceso";
      case "terminada":
        return "Órdenes Completadas";
      default:
        return "Órdenes";
    }
  };

  const getModalOrders = () => {
    if (modalFilter === "all") return orders;
    return orders.filter(order => order.status === modalFilter);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pendiente":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "en_proceso":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "terminada":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const monthlyData = [
    { name: 'Ene', value: 8 },
    { name: 'Feb', value: 12 },
    { name: 'Mar', value: 6 },
    { name: 'Abr', value: 15 },
    { name: 'May', value: 10 },
    { name: 'Jun', value: 9 }
  ];

  const statusData = [
    { name: 'Pendientes', value: pendingOrders, color: 'hsl(210 50% 60%)' },
    { name: 'En Proceso', value: processingOrders, color: 'hsl(45 100% 60%)' },
    { name: 'Terminadas', value: completedOrders, color: 'hsl(120 60% 50%)' }
  ];

  return (
    <div className="space-y-6 p-6" data-testid="doctor-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Dentista</h1>
          <p className="text-muted-foreground">
            {currentUser ? `${currentUser.name} - ${currentUser.lab_name || 'Laboratorio'}` : 'Gestión de órdenes dentales'}
          </p>
        </div>
        <Button onClick={onCreateOrder} size="lg" data-testid="button-create-order">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Orden
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Órdenes"
          value={orders.length}
          subtitle="Todas las órdenes"
          trend={{ direction: "up", percentage: 12.5 }}
          icon={<ShoppingCart className="w-4 h-4" />}
          variant="primary"
          onClick={() => openModal("all")}
        />
        
        <MetricCard
          title="Pendientes"
          value={pendingOrders}
          subtitle="Por procesar"
          icon={<Clock className="w-4 h-4" />}
          variant="warning"
          onClick={() => openModal("pendiente")}
        />
        
        <MetricCard
          title="En Proceso"
          value={processingOrders}
          subtitle="Trabajando"
          icon={<Stethoscope className="w-4 h-4" />}
          onClick={() => openModal("en_proceso")}
        />
        
        <MetricCard
          title="Completadas"
          value={completedOrders}
          subtitle="Finalizadas"
          trend={{ direction: "up", percentage: 8.7 }}
          icon={<CheckCircle className="w-4 h-4" />}
          variant="success"
          onClick={() => openModal("terminada")}
        />
      </div>

      {/* Additional Metrics & Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Valor Total"
          value={`$${totalValue.toLocaleString()}`}
          subtitle="Inversión total"
          trend={{ direction: "up", percentage: 18.2 }}
          icon={<DollarSign className="w-4 h-4" />}
          variant="success"
        />
        
        <DashboardChart
          title="Órdenes por Mes"
          data={monthlyData}
          type="bar"
          height={200}
        />

        <DashboardChart
          title="Estado Actual"
          data={statusData}
          type="pie"
          height={200}
        />
      </div>

      {/* Orders Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Mis Órdenes</CardTitle>
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
                <option value="all">Todas</option>
                <option value="pendiente">Pendientes</option>
                <option value="en_proceso">En Proceso</option>
                <option value="terminada">Terminadas</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando órdenes...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-2">Error al cargar las órdenes</p>
              <p className="text-sm text-muted-foreground">Por favor intenta recargar la página</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-muted rounded-full">
                  <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">No hay órdenes</h3>
              <p className="text-muted-foreground mb-4">
                {orderFilter === "all" 
                  ? "Aún no has creado ninguna orden" 
                  : `No hay órdenes ${orderFilter === "pendiente" ? "pendientes" : orderFilter === "en_proceso" ? "en proceso" : orderFilter === "terminada" ? "terminadas" : "canceladas"}`
                }
              </p>
              <Button onClick={onCreateOrder} data-testid="button-create-first-order">
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Orden
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="grid" className="space-y-4">
              <TabsList>
                <TabsTrigger value="grid">Vista de Tarjetas</TabsTrigger>
                <TabsTrigger value="list">Vista de Lista</TabsTrigger>
              </TabsList>

              <TabsContent value="grid">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onViewDetails={onViewOrderDetails}
                      onArchive={onArchiveOrder}
                      showActions={true}
                      showLab={true}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="list">
                <div className="space-y-3">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 hover-elevate">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">Orden #{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('es-ES')} - ${order.value}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.status === "pendiente" && 
                            <Clock className="w-4 h-4 text-blue-500" />
                          }
                          {order.status === "en_proceso" && 
                            <Stethoscope className="w-4 h-4 text-yellow-500" />
                          }
                          {order.status === "terminada" && 
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          }
                          <span className="text-sm font-medium capitalize">
                            {order.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Orders Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalFilter === "all" && <ShoppingCart className="w-5 h-5" />}
              {modalFilter === "pendiente" && <Clock className="w-5 h-5 text-blue-500" />}
              {modalFilter === "en_proceso" && <Stethoscope className="w-5 h-5 text-yellow-500" />}
              {modalFilter === "terminada" && <CheckCircle className="w-5 h-5 text-green-500" />}
              {getModalTitle()}
              <span className="text-sm font-normal text-muted-foreground">
                ({getModalOrders().length} órdenes)
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Cargando órdenes...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-2">Error al cargar órdenes. Intenta nuevamente.</p>
                <Button onClick={closeModal} variant="outline">
                  Cerrar
                </Button>
              </div>
            ) : getModalOrders().length === 0 ? (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-muted rounded-full">
                    <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-medium mb-2">No hay órdenes en este estado</h3>
                <p className="text-muted-foreground mb-4">
                  {modalFilter === "all" 
                    ? "Aún no has creado ninguna orden" 
                    : `No tienes órdenes ${modalFilter === "pendiente" ? "pendientes" : modalFilter === "en_proceso" ? "en proceso" : "completadas"}`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {getModalOrders().map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover-elevate">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-medium">Orden #{order.order_number}</p>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.replace("_", " ")}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(order.created_at).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>{order.lab_name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span>${order.value.toLocaleString()}</span>
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <p className="text-sm">
                            <span className="font-medium">Servicios:</span>{' '}
                            {order.services.join(', ')}
                          </p>
                          {order.observaciones && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <span className="font-medium">Obs:</span> {order.observaciones}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {onViewOrderDetails && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              onViewOrderDetails(order.id);
                              closeModal();
                            }}
                            data-testid={`button-view-order-${order.id}`}
                          >
                            Ver Detalles
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={closeModal} variant="outline" data-testid="button-close-modal">
              Cerrar
            </Button>
            {onCreateOrder && getModalOrders().length > 0 && (
              <Button onClick={() => { onCreateOrder(); closeModal(); }} data-testid="button-create-order-from-modal">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Orden
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}