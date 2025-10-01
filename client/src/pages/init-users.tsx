import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Users, Loader2 } from "lucide-react";

export function InitUsersPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const { toast } = useToast();

  const handleInitUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/init-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-init-secret': 'dental-init-2024-secure'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setCredentials(result.credentials);
        setIsSuccess(true);
        toast({
          title: "¡Usuarios creados exitosamente!",
          description: "Ya puedes acceder con las credenciales mostradas.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error al crear usuarios",
          description: error.error || "Algo salió mal",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar al servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess && credentials) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold">¡Usuarios Creados!</CardTitle>
            <CardDescription>
              Los usuarios han sido creados exitosamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold">SuperAdmin:</h4>
                <p>Email: {credentials.superadmin.email}</p>
                <p>Password: {credentials.superadmin.password}</p>
              </div>
              <div>
                <h4 className="font-semibold">Laboratorio:</h4>
                <p>Email: {credentials.laboratory.email}</p>
                <p>Password: {credentials.laboratory.password}</p>
              </div>
              <div>
                <h4 className="font-semibold">Doctor:</h4>
                <p>Email: {credentials.doctor.email}</p>
                <p>Password: {credentials.doctor.password}</p>
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/'}
              data-testid="button-go-to-login"
            >
              Ir al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Inicializar Sistema</CardTitle>
          <CardDescription>
            Crear usuarios para acceder al sistema dental
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Este proceso creará los usuarios necesarios para usar el sistema:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>SuperAdmin (administrador del sistema)</li>
              <li>Laboratorio (gestión de órdenes)</li>
              <li>Doctor (creación de órdenes)</li>
            </ul>
          </div>
          <Button 
            className="w-full" 
            onClick={handleInitUsers}
            disabled={isLoading}
            data-testid="button-init-users"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando usuarios...
              </>
            ) : (
              'Crear Usuarios del Sistema'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}