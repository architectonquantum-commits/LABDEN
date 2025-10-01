import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Save, X } from "lucide-react";

const doctorSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 caracteres"),
  status: z.enum(["active", "inactive"])
});

type DoctorForm = z.infer<typeof doctorSchema>;

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "inactive";
}

interface EditDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
}

export function EditDoctorModal({ isOpen, onClose, doctor }: EditDoctorModalProps) {
  const { toast } = useToast();

  const form = useForm<DoctorForm>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      status: "active"
    }
  });

  // Reset form when doctor changes or modal opens
  useEffect(() => {
    if (doctor && isOpen) {
      form.reset({
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone || "",
        status: doctor.status
      });
    }
  }, [doctor, isOpen, form]);

  const updateDoctor = useMutation({
    mutationFn: async (data: DoctorForm) => {
      if (!doctor?.id) throw new Error("No doctor selected");
      
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: data.status
      };
      
      return apiRequest('PUT', `/api/doctors/${doctor.id}`, payload);
    },
    onSuccess: (updatedDoctor) => {
      toast({
        title: "Dentista actualizado",
        description: "La información del dentista se ha actualizado exitosamente"
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      
      handleClose();
    },
    onError: (error: any) => {
      console.error("Error updating doctor:", error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el dentista",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: DoctorForm) => {
    updateDoctor.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!doctor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Editar Dentista
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Dentista</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Dra./Dr. Juan Pérez"
                      data-testid="input-edit-doctor-name"
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="dentista@email.com"
                      data-testid="input-edit-doctor-email"
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
                      data-testid="input-edit-doctor-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    data-testid="select-edit-doctor-status"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={updateDoctor.isPending}
                className="flex-1"
                data-testid="button-save-doctor-edit"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateDoctor.isPending ? "Guardando..." : "Guardar Cambios"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={updateDoctor.isPending}
                data-testid="button-cancel-doctor-edit"
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