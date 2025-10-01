import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, DollarSign, FileText, Stethoscope, User, Building } from "lucide-react";

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
  nombrePaciente?: string;
  colorSustrato?: string;
  colorTrabajo?: string;
  material?: string;
  archivado?: boolean;
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export function OrderDetailsModal({ isOpen, onClose, order }: OrderDetailsModalProps) {
  if (!order) return null;

  const getStatusBadge = (status: OrderStatus) => {
    const variants = {
      pendiente: { variant: "secondary" as const, label: "Pendiente", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
      en_proceso: { variant: "default" as const, label: "En Proceso", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
      terminada: { variant: "outline" as const, label: "Terminada", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
      cancelada: { variant: "destructive" as const, label: "Cancelada", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" }
    };
    
    const config = variants[status];
    return (
      <Badge 
        variant={config.variant}
        className={config.color}
      >
        {config.label}
      </Badge>
    );
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getServiceDisplayName = (service: string) => {
    const serviceNames: Record<string, string> = {
      corona: "Corona",
      puente: "Puente",
      protesis_parcial: "Prótesis Parcial",
      protesis_total: "Prótesis Total",
      implante: "Implante",
      endodoncia: "Endodoncia",
      cucharilla: "Cucharilla",
      modelo_estudio: "Modelo de Estudio",
      ferula: "Férula",
      blanqueamiento: "Blanqueamiento",
      otro: "Otro"
    };
    return serviceNames[service] || service;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="order-details-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="w-5 h-5" />
            Detalles de Orden #{order.order_number}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Status and Basic Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Estado:</span>
            </div>
            {getStatusBadge(order.status)}
          </div>

          <Separator />

          {/* Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Información General</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dentista</p>
                    <p className="font-medium">{order.doctor_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Laboratorio</p>
                    <p className="font-medium">{order.lab_name || "Laboratorio"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Creación</p>
                    <p className="font-medium">{formatDate(order.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="font-medium text-lg">{formatCurrency(order.value)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Servicios Solicitados</h3>
              
              <div className="space-y-2">
                {order.services && order.services.length > 0 ? (
                  order.services.map((service, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-muted-foreground" />
                      <Badge variant="outline" className="text-sm">
                        {getServiceDisplayName(service)}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No hay servicios especificados</p>
                )}
              </div>
            </div>
          </div>

          {/* Patient Information */}
          {order.nombrePaciente && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Información del Paciente</h3>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre del Paciente</p>
                    <p className="font-medium" data-testid="text-patient-name">{order.nombrePaciente}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Special Instructions */}
          {(order.colorSustrato || order.colorTrabajo || order.material) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Instrucciones Especiales</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.colorSustrato && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Color del sustrato</p>
                        <p className="font-medium" data-testid="text-color-sustrato">{order.colorSustrato}</p>
                      </div>
                    </div>
                  )}

                  {order.colorTrabajo && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-primary/30 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Color solicitado del trabajo</p>
                        <p className="font-medium" data-testid="text-color-trabajo">{order.colorTrabajo}</p>
                      </div>
                    </div>
                  )}

                  {order.material && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-primary/10 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Material</p>
                        <p className="font-medium" data-testid="text-material">{order.material}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Observaciones */}
          {order.observaciones && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-2">Observaciones</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm leading-relaxed">{order.observaciones}</p>
                </div>
              </div>
            </>
          )}

          {/* Order ID for reference */}
          <Separator />
          <div className="text-xs text-muted-foreground">
            ID de Orden: {order.id}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}