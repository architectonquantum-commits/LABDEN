import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Doctor {
  id: string;
  name: string;
  email: string;
}

interface DeleteDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  doctor: Doctor | null;
}

export function DeleteDoctorModal({ isOpen, onClose, onSuccess, doctor }: DeleteDoctorModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!doctor) return;
    
    setIsLoading(true);
    try {
      await apiRequest('DELETE', `/api/doctors/${doctor.id}`);
      
      toast({
        title: "Dentista eliminado",
        description: `El dentista "${doctor.name}" se ha eliminado exitosamente`
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error deleting doctor:", error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el dentista",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Confirmar Eliminación
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar al dentista{" "}
            <span className="font-semibold text-foreground">"{doctor?.name}"</span>?
          </p>
          <p className="text-sm text-destructive mt-2">
            Esta acción no se puede deshacer. El dentista será eliminado del sistema.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Nota: Si el dentista tiene órdenes asociadas, no podrá ser eliminado hasta que las órdenes sean reasignadas o canceladas.
          </p>
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            data-testid="button-cancel-delete-doctor"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            data-testid="button-confirm-delete-doctor"
          >
            {isLoading ? "Eliminando..." : "Eliminar Dentista"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}