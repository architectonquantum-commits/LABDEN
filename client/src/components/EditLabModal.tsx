import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Building, Save, X } from "lucide-react";

const labSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  phone: z.string().regex(/^[\d\-\+\(\)\s]+$/, "Teléfono debe contener solo números y caracteres válidos").min(8, "Teléfono debe tener al menos 8 dígitos"),
  email: z.string().email("Email inválido").optional().or(z.literal(""))
});

type LabForm = z.infer<typeof labSchema>;

interface Lab {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string | null;
  status: "active" | "inactive";
}

interface EditLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  lab: Lab | null;
}

export function EditLabModal({ isOpen, onClose, lab }: EditLabModalProps) {
  const { toast } = useToast();

  const form = useForm<LabForm>({
    resolver: zodResolver(labSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: ""
    }
  });

  // Reset form when lab changes or modal opens
  useEffect(() => {
    if (lab && isOpen) {
      form.reset({
        name: lab.name,
        address: lab.address,
        phone: lab.phone,
        email: lab.email || ""
      });
    }
  }, [lab, isOpen, form]);

  const updateLab = useMutation({
    mutationFn: async (data: LabForm) => {
      if (!lab?.id) throw new Error("No laboratory selected");
      
      const payload = {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email || null
      };
      
      return apiRequest('PUT', `/api/labs/${lab.id}`, payload);
    },
    onSuccess: (updatedLab) => {
      toast({
        title: "Laboratorio actualizado",
        description: `${updatedLab.name} ha sido actualizado correctamente.`,
      });
      
      // Invalidate and refetch laboratory-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/labs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      
      form.reset();
      onClose();
    },
    onError: (error) => {
      console.error('Edit laboratory failed:', error);
      toast({
        title: "Error al actualizar",
        description: "No se pudo actualizar el laboratorio. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: LabForm) => {
    updateLab.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Editar Laboratorio
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Laboratorio</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Laboratorio Dental ABC"
                      data-testid="input-edit-lab-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Calle Principal 123, Ciudad"
                      data-testid="input-edit-lab-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="555-1234-5678"
                      data-testid="input-edit-lab-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="contacto@laboratorio.com"
                      data-testid="input-edit-lab-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={updateLab.isPending}
                className="flex-1"
                data-testid="button-save-lab-edit"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateLab.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={updateLab.isPending}
                data-testid="button-cancel-lab-edit"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}