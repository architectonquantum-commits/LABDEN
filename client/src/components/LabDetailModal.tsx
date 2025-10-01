import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Building, 
  Users, 
  ShoppingCart, 
  Eye, 
  Mail, 
  Calendar,
  DollarSign,
  User
} from "lucide-react";

interface Lab {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string | null;
  status: "active" | "inactive";
}

interface LabUser {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "laboratorio" | "doctor";
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface LabOrder {
  id: string;
  doctor_id: string;
  doctor_name: string | null;
  status: string;
  value: string;
  services: string[];
  created_at: string;
  updated_at: string;
  progress_percentage: string;
}

interface LabDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lab: Lab | null;
}

export function LabDetailModal({ isOpen, onClose, lab }: LabDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"users" | "orders">("users");
  
  // Fetch users for this laboratory
  const { 
    data: labUsers = [], 
    isLoading: usersLoading, 
    error: usersError 
  } = useQuery<LabUser[]>({
    queryKey: [`/api/labs/${lab?.id}/users`],
    enabled: isOpen && !!lab?.id
  });
  
  // Fetch orders for this laboratory
  const { 
    data: labOrders = [], 
    isLoading: ordersLoading, 
    error: ordersError 
  } = useQuery<LabOrder[]>({
    queryKey: [`/api/labs/${lab?.id}/orders`],
    enabled: isOpen && !!lab?.id
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "superadmin":
        return "destructive";
      case "laboratorio":
        return "default";
      case "doctor":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "superadmin":
        return "SuperAdmin";
      case "laboratorio":
        return "Laboratorio";
      case "doctor":
        return "Doctor";
      default:
        return role;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "terminada":
        return "default";
      case "en_proceso":
        return "secondary";
      case "pendiente":
        return "outline";
      case "cancelada":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "terminada":
        return "Terminada";
      case "en_proceso":
        return "En Proceso";
      case "pendiente":
        return "Pendiente";
      case "cancelada":
        return "Cancelada";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (!lab) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Detalle Completo - {lab.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Laboratory Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Laboratorio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="font-medium">{lab.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge variant={lab.status === "active" ? "default" : "secondary"}>
                    {lab.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                  <p>{lab.address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  <p>{lab.phone}</p>
                </div>
                {lab.email && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {lab.email}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === "users" ? "default" : "ghost"}
              onClick={() => setActiveTab("users")}
              className="flex-1"
              data-testid="tab-users"
            >
              <Users className="w-4 h-4 mr-2" />
              Usuarios Asignados ({labUsers.length})
            </Button>
            <Button
              variant={activeTab === "orders" ? "default" : "ghost"}
              onClick={() => setActiveTab("orders")}
              className="flex-1"
              data-testid="tab-orders"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Órdenes ({labOrders.length})
            </Button>
          </div>

          {/* Users Tab */}
          {activeTab === "users" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Usuarios Asignados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : usersError ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Error al cargar usuarios del laboratorio
                  </div>
                ) : labUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay usuarios registrados para este laboratorio
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Correo</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Fecha de Registro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(labUsers as LabUser[]).map((user) => (
                        <TableRow key={user.id} data-testid={`lab-user-${user.id}`}>
                          <TableCell>
                            <p className="font-medium">{user.name}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === "active" ? "default" : "secondary"}>
                              {user.status === "active" ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            <div className="flex items-center justify-end gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(user.created_at).toLocaleDateString('es-ES')}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Órdenes Creadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Error al cargar órdenes del laboratorio
                  </div>
                ) : labOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay órdenes registradas para este laboratorio
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número de Orden</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Doctor Asignado</TableHead>
                        <TableHead className="text-right">Progreso</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(labOrders as LabOrder[]).map((order) => (
                        <TableRow key={order.id} data-testid={`lab-order-${order.id}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium">#{order.id}</p>
                              <p className="text-xs text-muted-foreground">
                                {order.services.join(", ")}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(order.created_at).toLocaleDateString('es-ES')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 font-medium">
                              <DollarSign className="w-3 h-3" />
                              ${parseFloat(order.value || '0').toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {order.doctor_name || (
                              <span className="text-muted-foreground">Sin asignar</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-sm font-medium">
                                {order.progress_percentage || 0}%
                              </span>
                              <div className="w-16 h-2 bg-muted rounded-full">
                                <div 
                                  className="h-2 bg-primary rounded-full transition-all duration-300"
                                  style={{ width: `${order.progress_percentage || 0}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={onClose} data-testid="close-lab-detail">
            <Eye className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}