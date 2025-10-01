import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const labSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  phone: z.string().min(8, "El teléfono debe tener al menos 8 caracteres"),
  email: z.string().email("Email inválido").optional()
});

type LabForm = z.infer<typeof labSchema>;

interface CreateLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateLabModal({ isOpen, onClose, onSuccess }: CreateLabModalProps) {
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSubmit = async (data: LabForm) => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/labs', data);
      
      toast({
        title: "Laboratorio creado",
        description: "El laboratorio se ha creado exitosamente"
      });
      
      form.reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating lab:", error);
      toast({
        title: "Error",
        description: error.message || "Error al crear el laboratorio",
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
          <DialogTitle>Crear Nuevo Laboratorio</DialogTitle>
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
                      data-testid="input-lab-name"
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
                      data-testid="input-lab-address"
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
                      data-testid="input-lab-phone"
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
                      data-testid="input-lab-email"
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
                data-testid="button-cancel-lab"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                data-testid="button-create-lab"
              >
                {isLoading ? "Creando..." : "Crear Laboratorio"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}