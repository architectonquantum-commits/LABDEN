import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const doctorSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "El teléfono es requerido").regex(/^\d+$/, "El teléfono debe contener solo números"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
});

type DoctorForm = z.infer<typeof doctorSchema>;

interface CreateDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDoctorModal({ isOpen, onClose, onSuccess }: CreateDoctorModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DoctorForm>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: ""
    }
  });

  const handleSubmit = async (data: DoctorForm) => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/doctors', data);
      
      toast({
        title: "Dentista creado",
        description: "El dentista se ha creado exitosamente"
      });
      
      // Invalidate doctors query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      
      form.reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating doctor:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el dentista. Intenta nuevamente.",
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
          <DialogTitle>Crear Nuevo Dentista</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Dra./Dr. Juan Pérez"
                      data-testid="input-doctor-name"
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
                      placeholder="dentista@clinica.com"
                      data-testid="input-doctor-email"
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
                      placeholder="555123456"
                      data-testid="input-doctor-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      data-testid="input-doctor-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                data-testid="button-cancel-doctor"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                data-testid="button-create-doctor"
              >
                {isLoading ? "Creando..." : "Crear Dentista"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}