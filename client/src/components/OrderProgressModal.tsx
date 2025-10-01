import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const progressSchema = z.object({
  status: z.enum(["pendiente", "iniciada", "en_proceso", "terminada"]),
  progress_percentage: z.number().min(0).max(100)
});

type ProgressForm = z.infer<typeof progressSchema>;

interface OrderProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  order: {
    id: string;
    status: string;
    progress_percentage?: number;
    services: string[];
    observaciones?: string;
  };
}

const statusConfig = {
  pendiente: { label: "Pendiente", color: "bg-gray-500", percentage: 0 },
  iniciada: { label: "Iniciada", color: "bg-blue-500", percentage: 25 },
  en_proceso: { label: "En Proceso", color: "bg-yellow-500", percentage: 50 },
  terminada: { label: "Terminada", color: "bg-green-500", percentage: 100 }
};

export function OrderProgressModal({ isOpen, onClose, onSuccess, order }: OrderProgressModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProgressForm>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      status: order.status as "pendiente" | "iniciada" | "en_proceso" | "terminada",
      progress_percentage: order.progress_percentage || 0
    }
  });

  const selectedStatus = form.watch("status");
  const currentProgress = form.watch("progress_percentage");

  const handleSubmit = async (data: ProgressForm) => {
    setIsLoading(true);
    try {
      await apiRequest('PUT', `/api/orders/${order.id}/progress`, data);
      
      toast({
        title: "Progreso actualizado",
        description: "El progreso de la orden se ha actualizado exitosamente"
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating progress:", error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el progreso",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (newStatus: "pendiente" | "iniciada" | "en_proceso" | "terminada") => {
    form.setValue("status", newStatus);
    form.setValue("progress_percentage", statusConfig[newStatus].percentage);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Actualizar Progreso de Orden</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Order Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-sm">Orden #{order.id.slice(-8)}</h4>
            <div className="flex flex-wrap gap-1 mt-2">
              {order.services.map((service) => (
                <Badge key={service} variant="outline" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
            {order.observaciones && (
              <p className="text-sm text-muted-foreground mt-2">{order.observaciones}</p>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={handleStatusChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-order-status">
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="iniciada">Iniciada</SelectItem>
                        <SelectItem value="en_proceso">En Proceso</SelectItem>
                        <SelectItem value="terminada">Terminada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="progress_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progreso ({currentProgress}%)</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <Slider
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          max={100}
                          step={5}
                          className="w-full"
                          data-testid="slider-progress"
                        />
                        <Progress value={currentProgress} className="w-full" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status Visual */}
              <div className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full ${statusConfig[selectedStatus]?.color || "bg-gray-500"}`}
                />
                <span className="text-sm font-medium">
                  {statusConfig[selectedStatus]?.label || selectedStatus}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  data-testid="button-cancel-progress"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  data-testid="button-update-progress"
                >
                  {isLoading ? "Actualizando..." : "Actualizar Progreso"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}