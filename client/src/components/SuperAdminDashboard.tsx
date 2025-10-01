import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MetricCard } from "./MetricCard";
import { DashboardChart } from "./DashboardChart";
import { OrderCard } from "./OrderCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Building, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Plus, 
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MetricDetailsModal } from "./MetricDetailsModal";

interface Lab {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface SuperAdminDashboardProps {
  onCreateLab?: () => void;
  onEditLab?: (labId: string) => void;
  onDeleteLab?: (labId: string) => void;
  onCreateUser?: () => void;
}

export function SuperAdminDashboard({ 
  onCreateLab, 
  onEditLab, 
  onDeleteLab,
  onCreateUser
}: SuperAdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [labToDelete, setLabToDelete] = useState<Lab | null>(null);
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [selectedMetricType, setSelectedMetricType] = useState<'labs' | 'doctors' | 'orders' | 'revenue' | null>(null);
  const { toast } = useToast();
  
  // Fetch laboratories
  const { data: labs = [], isLoading: labsLoading, error: labsError } = useQuery({
    queryKey: ['/api/labs'],
    enabled: true
  });
  
  // Fetch orders for stats
  const { data: orders = [] } = useQuery({
    queryKey: ['/api/orders'],
    enabled: true
  });
  
  // Fetch users for user management
  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['/api/users'],
    enabled: true
  });
  
  // Delete laboratory mutation
  const deleteLab = useMutation({
    mutationFn: async (labId: string) => {
      console.log('[DEBUG SuperAdmin] Deleting laboratory:', labId);
      return apiRequest('DELETE', `/api/labs/${labId}`);
    },
    onSuccess: () => {
      console.log('[DEBUG SuperAdmin] Laboratory deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/labs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Laboratorio eliminado",
        description: "El laboratorio se ha eliminado correctamente.",
      });
      setLabToDelete(null);
    },
    onError: (error) => {
      console.error('[ERROR SuperAdmin] Delete laboratory failed:', error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el laboratorio. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  // Calculate statistics
  const totalDoctors = 35; // TODO: Fetch from API
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.value || '0')), 0);

  // Generate chart data based on real data
  const chartData = labs.map(lab => ({
    name: lab.name.split(' ')[0], // Short name for chart
    value: orders.filter(order => order.lab_id === lab.id).length
  }));

  const statusData = [
    { name: 'Pendiente', value: orders.filter(o => o.status === 'pendiente').length, color: 'hsl(210 50% 60%)' },
    { name: 'En Proceso', value: orders.filter(o => o.status === 'en_proceso').length, color: 'hsl(45 100% 60%)' },
    { name: 'Terminadas', value: orders.filter(o => o.status === 'terminada').length, color: 'hsl(120 60% 50%)' }
  ];

  const filteredLabs = labs.filter(lab =>
    lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lab.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLabAction = (action: string, labId: string) => {
    console.log(`[DEBUG SuperAdmin] ${action} lab ${labId}`);
    if (action === "edit" && onEditLab) {
      onEditLab(labId);
    } else if (action === "delete") {
      const lab = labs.find(l => l.id === labId);
      if (lab) {
        setLabToDelete(lab);
      }
    }
  };
  
  const confirmDeleteLab = () => {
    if (labToDelete) {
      deleteLab.mutate(labToDelete.id);
    }
  };
  
  const handleMetricClick = (metricType: 'labs' | 'doctors' | 'orders' | 'revenue') => {
    setSelectedMetricType(metricType);
    setIsMetricModalOpen(true);
  };
  
  const closeMetricModal = () => {
    setIsMetricModalOpen(false);
    setSelectedMetricType(null);
  };

  return (
    <div className="space-y-6 p-6" data-testid="superadmin-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard SuperAdmin</h1>
          <p className="text-muted-foreground">Gestión global del sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCreateUser} data-testid="button-create-user">
            <Plus className="w-4 h-4 mr-2" />
            Crear Usuario
          </Button>
          <Button onClick={onCreateLab} data-testid="button-create-lab">
            <Plus className="w-4 h-4 mr-2" />
            Crear Laboratorio
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Laboratorios"
          value={labs.length}
          subtitle="Registrados"
          trend={{ direction: "up", percentage: 5.2 }}
          icon={<Building className="w-4 h-4" />}
          variant="primary"
          onClick={() => handleMetricClick('labs')}
          data-testid="card-total-labs"
        />
        
        <MetricCard
          title="Total Doctores"
          value={totalDoctors}
          subtitle="Activos"
          trend={{ direction: "up", percentage: 12.3 }}
          icon={<Users className="w-4 h-4" />}
          variant="success"
          onClick={() => handleMetricClick('doctors')}
          data-testid="card-total-doctors"
        />
        
        <MetricCard
          title="Órdenes Globales"
          value={totalOrders}
          subtitle="Este mes"
          trend={{ direction: "up", percentage: 8.7 }}
          icon={<ShoppingCart className="w-4 h-4" />}
          onClick={() => handleMetricClick('orders')}
          data-testid="card-total-orders"
        />
        
        <MetricCard
          title="Valor Total"
          value={`$${totalRevenue.toLocaleString()}`}
          subtitle="Ingresos globales"
          trend={{ direction: "up", percentage: 15.4 }}
          icon={<DollarSign className="w-4 h-4" />}
          variant="warning"
          onClick={() => handleMetricClick('revenue')}
          data-testid="card-total-revenue"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardChart
          title="Órdenes por Laboratorio"
          data={chartData}
          type="bar"
        />
        
        <DashboardChart
          title="Estado de Órdenes"
          data={statusData}
          type="pie"
        />
      </div>

      {/* Labs Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Gestión de Laboratorios</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar laboratorios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-labs"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {labsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : labsError ? (
            <div className="text-center py-4 text-muted-foreground">
              Error al cargar laboratorios
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Laboratorio</TableHead>
                  <TableHead>Doctores</TableHead>
                  <TableHead>Órdenes</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLabs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No se encontraron laboratorios
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLabs.map((lab) => {
                    const labOrders = orders.filter(order => order.lab_id === lab.id);
                    const doctorsForLab = 5; // TODO: Calculate from actual data
                    
                    return (
                      <TableRow key={lab.id} data-testid={`lab-row-${lab.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lab.name}</p>
                            <p className="text-sm text-muted-foreground">{lab.address}</p>
                            <p className="text-sm text-muted-foreground">{lab.phone}</p>
                            {lab.email && (
                              <p className="text-sm text-muted-foreground">{lab.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{doctorsForLab}</TableCell>
                        <TableCell>{labOrders.length}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={lab.status === "active" ? "default" : "secondary"}
                          >
                            {lab.status === "active" ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                data-testid={`lab-actions-${lab.id}`}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleLabAction("edit", lab.id)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleLabAction("delete", lab.id)}
                                className="text-destructive"
                                data-testid={`action-delete-${lab.id}`}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* User Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Gestión de Usuarios</CardTitle>
          <Button 
            onClick={onCreateUser} 
            variant="outline"
            data-testid="button-create-user"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Crear Usuario
          </Button>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : usersError ? (
            <div className="text-center py-4 text-muted-foreground">
              Error al cargar usuarios
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Laboratorio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Fecha de Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          user.role === 'superadmin' ? 'destructive' :
                          user.role === 'laboratorio' ? 'default' :
                          'secondary'
                        }>
                          {user.role === 'superadmin' ? 'SuperAdmin' :
                           user.role === 'laboratorio' ? 'Laboratorio' :
                           'Doctor'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lab_name || (
                          <span className="text-muted-foreground">Sin laboratorio</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === "active" ? "default" : "secondary"}>
                          {user.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('es-ES')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.slice(0, 4).map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                showActions={false}
                showLab={true}
              />
            ))}
            {orders.length === 0 && (
              <div className="col-span-2 text-center py-4 text-muted-foreground">
                No hay órdenes recientes
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!labToDelete} onOpenChange={() => setLabToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar laboratorio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el laboratorio "{labToDelete?.name}" y todos los datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLabToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteLab}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteLab.isPending}
              data-testid="confirm-delete-lab"
            >
              {deleteLab.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Metric Details Modal */}
      <MetricDetailsModal
        isOpen={isMetricModalOpen}
        onClose={closeMetricModal}
        type={selectedMetricType}
        data={{
          labs,
          orders,
          totalDoctors,
          totalRevenue
        }}
      />
    </div>
  );
}