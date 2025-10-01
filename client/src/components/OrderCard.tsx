import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Calendar, DollarSign, User, Building, Archive } from "lucide-react";

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

interface OrderCardProps {
  order: Order;
  onStatusChange?: (orderId: string, newStatus: OrderStatus) => void;
  onViewDetails?: (orderId: string) => void;
  onEdit?: (orderId: string) => void;
  onArchive?: (orderId: string) => void;
  showActions?: boolean;
  showLab?: boolean;
}

export function OrderCard({ 
  order, 
  onStatusChange, 
  onViewDetails, 
  onEdit,
  onArchive, 
  showActions = true,
  showLab = false 
}: OrderCardProps) {
  
  const getStatusBadge = (status: OrderStatus) => {
    const variants = {
      pendiente: { variant: "secondary" as const, label: "Pendiente", color: "bg-blue-100 text-blue-800" },
      en_proceso: { variant: "default" as const, label: "En Proceso", color: "bg-yellow-100 text-yellow-800" },
      terminada: { variant: "outline" as const, label: "Terminada", color: "bg-green-100 text-green-800" },
      cancelada: { variant: "destructive" as const, label: "Cancelada", color: "bg-red-100 text-red-800" }
    };
    
    const config = variants[status];
    return (
      <Badge 
        variant={config.variant}
        className={`${config.color} dark:bg-opacity-20`}
      >
        {config.label}
      </Badge>
    );
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (onStatusChange) {
      onStatusChange(order.id, newStatus);
      console.log(`Order ${order.id} status changed to ${newStatus}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="hover-elevate" data-testid={`order-card-${order.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            Orden #{order.order_number}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(order.status)}
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6"
                    data-testid={`order-actions-${order.id}`}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onViewDetails && (
                    <DropdownMenuItem 
                      onClick={() => onViewDetails(order.id)}
                      data-testid={`menu-view-details-${order.id}`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(order.id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onArchive && !order.archivado && (
                    <DropdownMenuItem 
                      onClick={() => onArchive(order.id)}
                      data-testid={`menu-archive-order-${order.id}`}
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archivar Orden
                    </DropdownMenuItem>
                  )}
                  {onStatusChange && order.status !== "terminada" && order.status !== "cancelada" && (
                    <>
                      {order.status === "pendiente" && (
                        <DropdownMenuItem onClick={() => handleStatusChange("en_proceso")}>
                          Marcar En Proceso
                        </DropdownMenuItem>
                      )}
                      {order.status === "en_proceso" && (
                        <DropdownMenuItem onClick={() => handleStatusChange("terminada")}>
                          Marcar Terminada
                        </DropdownMenuItem>
                      )}
                      {(order.status === "pendiente" || order.status === "en_proceso") && (
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange("cancelada")}
                          className="text-destructive"
                        >
                          Cancelar Orden
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Dentista:</span>
            <span className="font-medium">{order.doctor_name}</span>
          </div>
          
          {showLab && order.lab_name && (
            <div className="flex items-center gap-2">
              <Building className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">Lab:</span>
              <span className="font-medium">{order.lab_name}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <DollarSign className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Valor:</span>
            <span className="font-medium">{formatCurrency(order.value)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Fecha:</span>
            <span className="font-medium">{formatDate(order.created_at)}</span>
          </div>
        </div>

        {order.services.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Servicios:</p>
            <div className="flex flex-wrap gap-1">
              {order.services.map((service, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {order.observaciones && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Observaciones:</p>
            <p className="text-sm bg-muted p-2 rounded text-muted-foreground">
              {order.observaciones}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}