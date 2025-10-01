import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Users, ShoppingCart, DollarSign, Eye, Edit, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LabDetailModal } from "./LabDetailModal";
import { EditLabModal } from "./EditLabModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MetricType = "labs" | "doctors" | "orders" | "revenue";

interface Lab {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string | null;
  status: "active" | "inactive";
}

interface Order {
  id: string;
  doctor_id: string;
  lab_id: string;
  status: string;
  value: string;
  services: string[];
  created_at: string;
  doctor_name?: string;
  lab_name?: string;
}

interface MetricDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: MetricType | null;
  data: {
    labs: Lab[];
    orders: Order[];
    totalDoctors: number;
    totalRevenue: number;
  };
}

export function MetricDetailsModal({ 
  isOpen, 
  onClose, 
  type, 
  data 
}: MetricDetailsModalProps) {
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [isLabDetailOpen, setIsLabDetailOpen] = useState(false);
  const [isEditLabOpen, setIsEditLabOpen] = useState(false);
  const [labToEdit, setLabToEdit] = useState<Lab | null>(null);
  const { toast } = useToast();
  
  const handleLabClick = (lab: Lab) => {
    setSelectedLab(lab);
    setIsLabDetailOpen(true);
  };
  
  const closeLabDetail = () => {
    setIsLabDetailOpen(false);
    setSelectedLab(null);
  };
  
  const handleEditLab = (lab: Lab) => {
    setLabToEdit(lab);
    setIsEditLabOpen(true);
  };
  
  const closeEditLab = () => {
    setIsEditLabOpen(false);
    setLabToEdit(null);
  };
  
  const toggleLabStatus = useMutation({
    mutationFn: async ({ labId, newStatus }: { labId: string; newStatus: "active" | "inactive" }) => {
      return apiRequest('PATCH', `/api/labs/${labId}/status`, { status: newStatus });
    },
    onSuccess: (result, { newStatus }) => {
      toast({
        title: "Estado actualizado",
        description: `El laboratorio ahora está ${newStatus === 'active' ? 'activo' : 'pausado'}.`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/labs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      console.error('Status change failed:', error);
      toast({
        title: "Error al cambiar estado",
        description: "No se pudo cambiar el estado del laboratorio. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
  
  const handleStatusChange = (lab: Lab, checked: boolean) => {
    const newStatus = checked ? "active" : "inactive";
    toggleLabStatus.mutate({ labId: lab.id, newStatus });
  };
  const getTitle = () => {
    switch (type) {
      case "labs":
        return "Detalle de Laboratorios";
      case "doctors":
        return "Detalle de Doctores";
      case "orders":
        return "Detalle de Órdenes Globales";
      case "revenue":
        return "Detalle de Ingresos";
      default:
        return "Detalles";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "labs":
        return <Building className="w-5 h-5" />;
      case "doctors":
        return <Users className="w-5 h-5" />;
      case "orders":
        return <ShoppingCart className="w-5 h-5" />;
      case "revenue":
        return <DollarSign className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const renderLabsDetails = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Total de laboratorios registrados en el sistema
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Órdenes</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.labs.map((lab) => {
            const labOrders = data.orders.filter(order => order.lab_id === lab.id);
            return (
              <TableRow key={lab.id}>
                <TableCell>
                  <div>
                    <button
                      onClick={() => handleLabClick(lab)}
                      className="font-medium text-primary hover:underline cursor-pointer text-left"
                      data-testid={`lab-name-clickable-${lab.id}`}
                    >
                      {lab.name}
                    </button>
                    {lab.email && (
                      <p className="text-sm text-muted-foreground">{lab.email}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{lab.address}</p>
                </TableCell>
                <TableCell>{lab.phone}</TableCell>
                <TableCell>
                  <Badge variant={lab.status === "active" ? "default" : "secondary"}>
                    {lab.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {labOrders.length}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Status Switch */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={lab.status === "active"}
                        onCheckedChange={(checked) => handleStatusChange(lab, checked)}
                        disabled={toggleLabStatus.isPending}
                        data-testid={`switch-lab-status-${lab.id}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {lab.status === "active" ? "Activo" : "Pausado"}
                      </span>
                    </div>
                    
                    {/* Edit Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditLab(lab)}
                      data-testid={`button-edit-lab-${lab.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  const renderDoctorsDetails = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Total de doctores activos en el sistema
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Doctores Activos:</span>
                <span className="font-medium">{data.totalDoctors}</span>
              </div>
              <div className="flex justify-between">
                <span>Promedio órdenes por doctor:</span>
                <span className="font-medium">
                  {data.totalDoctors > 0 ? Math.round(data.orders.length / data.totalDoctors * 10) / 10 : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total órdenes:</span>
                <span className="font-medium">{data.orders.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución por Laboratorio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.labs.map((lab) => {
                const labOrders = data.orders.filter(order => order.lab_id === lab.id);
                const uniqueDoctors = new Set(labOrders.map(order => order.doctor_id)).size;
                return (
                  <div key={lab.id} className="flex justify-between text-sm">
                    <span className="truncate">{lab.name.substring(0, 20)}...</span>
                    <span className="font-medium">{uniqueDoctors} doctores</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderOrdersDetails = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Resumen global de todas las órdenes del sistema
      </div>
      
      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { status: 'pendiente', label: 'Pendientes', color: 'bg-yellow-100 text-yellow-800' },
          { status: 'en_proceso', label: 'En Proceso', color: 'bg-blue-100 text-blue-800' },
          { status: 'terminada', label: 'Terminadas', color: 'bg-green-100 text-green-800' },
          { status: 'cancelada', label: 'Canceladas', color: 'bg-red-100 text-red-800' }
        ].map(({ status, label, color }) => {
          const count = data.orders.filter(order => order.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className={`inline-block px-2 py-1 rounded-full text-xs ${color}`}>
                    {label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div>
        <h4 className="text-lg font-medium mb-3">Órdenes Recientes</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Laboratorio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.orders.slice(0, 10).map((order) => (
              <TableRow key={order.id}>
                <TableCell>#{order.id}</TableCell>
                <TableCell>{order.doctor_name || `Doctor ${order.doctor_id}`}</TableCell>
                <TableCell>{order.lab_name || data.labs.find(l => l.id === order.lab_id)?.name || `Lab ${order.lab_id}`}</TableCell>
                <TableCell>
                  <Badge variant={
                    order.status === 'terminada' ? 'default' : 
                    order.status === 'en_proceso' ? 'secondary' : 
                    order.status === 'cancelada' ? 'destructive' : 'outline'
                  }>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${parseFloat(order.value || '0').toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderRevenueDetails = () => {
    const ordersByLab = data.labs.map(lab => ({
      ...lab,
      orders: data.orders.filter(order => order.lab_id === lab.id),
      revenue: data.orders
        .filter(order => order.lab_id === lab.id)
        .reduce((sum, order) => sum + parseFloat(order.value || '0'), 0)
    }));

    const totalRevenue = data.orders.reduce((sum, order) => sum + parseFloat(order.value || '0'), 0);

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Desglose detallado de ingresos por laboratorio
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen Financiero</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  ${totalRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Ingresos Totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  ${data.orders.length > 0 ? Math.round(totalRevenue / data.orders.length) : 0}
                </div>
                <div className="text-sm text-muted-foreground">Valor Promedio por Orden</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {data.labs.length}
                </div>
                <div className="text-sm text-muted-foreground">Laboratorios Contribuyentes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h4 className="text-lg font-medium mb-3">Ingresos por Laboratorio</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Laboratorio</TableHead>
                <TableHead className="text-right">Órdenes</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">% del Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersByLab
                .sort((a, b) => b.revenue - a.revenue)
                .map((lab) => {
                  const percentage = totalRevenue > 0 ? (lab.revenue / totalRevenue) * 100 : 0;
                  return (
                    <TableRow key={lab.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lab.name}</p>
                          <Badge variant={lab.status === "active" ? "default" : "secondary"}>
                            {lab.status === "active" ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{lab.orders.length}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${lab.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {percentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (type) {
      case "labs":
        return renderLabsDetails();
      case "doctors":
        return renderDoctorsDetails();
      case "orders":
        return renderOrdersDetails();
      case "revenue":
        return renderRevenueDetails();
      default:
        return <div>Selecciona una métrica para ver los detalles</div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {renderContent()}
        </div>
        
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose}>
            <Eye className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
      
      {/* Lab Detail Modal */}
      <LabDetailModal
        isOpen={isLabDetailOpen}
        onClose={closeLabDetail}
        lab={selectedLab}
      />
      
      {/* Edit Lab Modal */}
      <EditLabModal
        isOpen={isEditLabOpen}
        onClose={closeEditLab}
        lab={labToEdit}
      />
    </Dialog>
  );
}