import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type OrderStatus = "pendiente" | "en_proceso" | "terminada" | "cancelada";

interface Order {
  id: string;
  doctor_id: string | null;
  doctor_name: string | null;
  lab_id: string;
  status: OrderStatus;
  value: number;
  services: string[];
  created_at: string;
  observaciones?: string;
}

interface OrderListModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  title: string;
  filterStatus?: OrderStatus | "all";
}

const getStatusLabel = (status: OrderStatus) => {
  const statusLabels = {
    pendiente: "Pendiente",
    en_proceso: "En Proceso",
    terminada: "Completada",
    cancelada: "Cancelada"
  };
  return statusLabels[status] || status;
};

const getStatusVariant = (status: OrderStatus) => {
  switch (status) {
    case "pendiente":
      return "secondary";
    case "en_proceso":
      return "default";
    case "terminada":
      return "default";
    case "cancelada":
      return "destructive";
    default:
      return "secondary";
  }
};

export function OrderListModal({ 
  isOpen, 
  onClose, 
  orders, 
  title,
  filterStatus 
}: OrderListModalProps) {
  // Filter orders based on status if specified
  const filteredOrders = filterStatus && filterStatus !== "all" 
    ? orders.filter(order => order.status === filterStatus)
    : orders;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            <Badge variant="outline">
              {filteredOrders.length} órdenes
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Lista detallada de órdenes {filterStatus !== "all" ? `con estado ${getStatusLabel(filterStatus as OrderStatus).toLowerCase()}` : "del laboratorio"}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay órdenes {filterStatus !== "all" ? `con estado ${getStatusLabel(filterStatus as OrderStatus).toLowerCase()}` : ""} para mostrar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número de Orden</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Doctor Asignado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Servicios</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} data-testid={`order-row-${order.id}`}>
                    <TableCell className="font-medium">
                      #{order.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell>
                      {order.doctor_name || (
                        <span className="text-muted-foreground italic">
                          Sin asignar
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {order.services.slice(0, 2).map((service, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                        {order.services.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{order.services.length - 2} más
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}