import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DeleteLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lab: {
    id: string;
    name: string;
  } | null;
}

export function DeleteLabModal({ isOpen, onClose, onSuccess, lab }: DeleteLabModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!lab) return;
    
    setIsLoading(true);
    try {
      await apiRequest('DELETE', `/api/labs/${lab.id}`);
      
      toast({
        title: "Laboratorio eliminado",
        description: `El laboratorio "${lab.name}" se ha eliminado exitosamente`
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error deleting lab:", error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el laboratorio",
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
            ¿Estás seguro de que deseas eliminar el laboratorio{" "}
            <span className="font-semibold text-foreground">"{lab?.name}"</span>?
          </p>
          <p className="text-sm text-destructive mt-2">
            Esta acción no se puede deshacer y eliminará todos los datos asociados.
          </p>
        </div>

        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            data-testid="button-cancel-delete-lab"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            data-testid="button-confirm-delete-lab"
          >
            {isLoading ? "Eliminando..." : "Eliminar Laboratorio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}