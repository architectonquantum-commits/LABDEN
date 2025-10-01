import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Microscope } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Contraseña debe tener al menos 6 caracteres")
});

type LoginForm = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onLogin: (email: string, password: string, role: string) => Promise<void>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const handleSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    
    try {
      // The role is determined by the backend based on user data
      await onLogin(data.email, data.password, "");
    } catch (error: any) {
      console.error("Login error:", error);
      form.setError("root", { 
        message: error.message || "Error al iniciar sesión" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Microscope className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold">Laboratorio Dental</CardTitle>
          <CardDescription>
            Sistema de Gestión de Laboratorio Dental
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ingresa tu email"
                        data-testid="input-email"
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
                        placeholder="Ingresa tu contraseña"
                        data-testid="input-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Ingresando..." : "Ingresar"}
              </Button>

              {form.formState.errors.root && (
                <div className="text-destructive text-sm text-center mt-2">
                  {form.formState.errors.root.message}
                </div>
              )}
            </form>
          </Form>

        </CardContent>
      </Card>
    </div>
  );
}