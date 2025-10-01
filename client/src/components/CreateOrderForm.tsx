import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Odontogram } from "./Odontogram";
import { type ConditionType } from "./ToothConditionModal";
import { ArrowLeft, Save, CheckCircle, X } from "lucide-react";

const createOrderSchema = (isDoctorRole: boolean) => z.object({
  value: isDoctorRole ? z.number().optional() : z.number().min(1, "El valor debe ser mayor a 0"),
  services: z.array(z.string()).min(1, "Debe seleccionar al menos un servicio"),
  nombrePaciente: z.string().min(1, "El nombre del paciente es requerido"),
  instrucciones: z.string().optional(),
  colorSustrato: z.string().optional(),
  colorTrabajo: z.string().optional(),
  material: z.string().optional(),
  doctorId: z.string().optional()
});

type OrderForm = {
  value?: number;
  services: string[];
  nombrePaciente: string;
  instrucciones?: string;
  colorSustrato?: string;
  colorTrabajo?: string;
  material?: string;
  doctorId?: string;
};

interface CreateOrderFormProps {
  onSubmit: (orderData: OrderForm & { odontograma: Record<number, ConditionType[]> }) => void;
  onCancel: () => void;
  userRole?: "superadmin" | "laboratorio" | "doctor";
}

const availableServices = [
  "cucharilla",
  "antagonista",
  "registro_oclusal",
  "articulador",
  "fotografías",
  "corona",
  "modelo_estudio", 
  "puente",
  "implante",
  "prótesis",
  "ajuste",
  "reparación",
  "férula",
  "otro"
];

export function CreateOrderForm({ onSubmit, onCancel, userRole = "doctor" }: CreateOrderFormProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<Record<number, ConditionType[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otroTexto, setOtroTexto] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const isDoctorRole = userRole === "doctor";
  const isLaboratoryRole = userRole === "laboratorio";
  const orderSchema = createOrderSchema(isDoctorRole);
  
  // Fetch doctors for laboratory users
  const { data: doctorsData = [] } = useQuery<any[]>({
    queryKey: ["/api/doctors"],
    enabled: isLaboratoryRole // Only fetch when user is laboratory
  });

  const form = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      value: isDoctorRole ? undefined : 0,
      services: [],
      nombrePaciente: "",
      instrucciones: "",
      colorSustrato: "",
      colorTrabajo: "",
      material: "",
      doctorId: ""
    }
  });

  const handleToothSelect = (toothNumber: number, conditions: ConditionType[]) => {
    setSelectedConditions(prev => ({
      ...prev,
      [toothNumber]: conditions
    }));
  };

  const handleClearTooth = (toothNumber: number) => {
    setSelectedConditions(prev => {
      const newConditions = { ...prev };
      delete newConditions[toothNumber];
      return newConditions;
    });
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => {
      const newServices = prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service];
      
      // Si se deselecciona "otro", limpiar el texto
      if (service === "otro" && prev.includes(service)) {
        setOtroTexto("");
      }
      
      // Update form value
      form.setValue("services", newServices);
      return newServices;
    });
  };

  const handleSubmit = async (data: OrderForm) => {
    setIsSubmitting(true);

    try {
      // Validate that at least one tooth condition is selected
      if (Object.keys(selectedConditions).length === 0) {
        form.setError("root", { 
          message: "Debe seleccionar al menos una condición dental en el odontograma" 
        });
        setIsSubmitting(false);
        return;
      }

      // Prepare final order data
      const finalOrderData = {
        ...data,
        services: selectedServices,
        odontograma: selectedConditions
      };

      console.log("Creating order:", finalOrderData);
      
      // Call the onSubmit callback to persist the order
      await onSubmit(finalOrderData);
      
      // Show success screen after successful API call
      setShowSuccess(true);
    } catch (error) {
      console.error("Error creating order:", error);
      form.setError("root", { message: "Error al crear la orden" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (showSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[500px] p-4 sm:p-6" data-testid="success-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Orden creada satisfactoriamente</h2>
                <p className="text-muted-foreground">La orden ha sido creada y enviada al laboratorio.</p>
              </div>
              
              <Button 
                onClick={onCancel}
                className="w-full"
                data-testid="button-close-success"
              >
                <X className="w-4 h-4 mr-2" />
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6" data-testid="create-order-form">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onCancel}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nueva Orden</h1>
          <p className="text-muted-foreground">Crear orden de trabajo para laboratorio</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
            {/* Left Column - Order Details */}
            <div className="space-y-6 lg:order-1">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Información de la Orden</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Patient Name Field */}
                  <FormField
                    control={form.control}
                    name="nombrePaciente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del paciente</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Escriba el nombre completo del paciente"
                            data-testid="input-patient-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!isDoctorRole && (
                    <FormField
                      control={form.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Estimado ($)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              data-testid="input-order-value"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Doctor Assignment for Laboratory Users */}
                  {isLaboratoryRole && (
                    <FormField
                      control={form.control}
                      name="doctorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asignar a Dentista (Opcional)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            data-testid="select-assign-doctor"
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar dentista o dejar sin asignar" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unassigned">Sin asignar</SelectItem>
                              {doctorsData.map((dentista) => (
                                <SelectItem key={dentista.id} value={dentista.id}>
                                  {dentista.name} - {dentista.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="instrucciones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instrucciones Especiales</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Instrucciones específicas para el laboratorio..."
                            className="min-h-20"
                            data-testid="textarea-instructions"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Color del sustrato */}
                  <FormField
                    control={form.control}
                    name="colorSustrato"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color del sustrato</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Especificar color del sustrato..."
                            data-testid="input-color-sustrato"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Color solicitado del trabajo */}
                  <FormField
                    control={form.control}
                    name="colorTrabajo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color solicitado del trabajo a realizar</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Especificar color solicitado..."
                            data-testid="input-color-trabajo"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Material */}
                  <FormField
                    control={form.control}
                    name="material"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Elegir material</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-2 gap-2"
                            data-testid="radio-group-material"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="disilicato" id="disilicato" />
                              <label htmlFor="disilicato" className="text-sm font-medium cursor-pointer">
                                Disilicato
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="zirconia" id="zirconia" />
                              <label htmlFor="zirconia" className="text-sm font-medium cursor-pointer">
                                Zirconia
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="zirconia_monolitica" id="zirconia_monolitica" />
                              <label htmlFor="zirconia_monolitica" className="text-sm font-medium cursor-pointer">
                                Zirconia monolítica
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="ceromero" id="ceromero" />
                              <label htmlFor="ceromero" className="text-sm font-medium cursor-pointer">
                                Cerómero
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Lo que el Dentista envía:</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
                    {availableServices.map((service) => (
                      <div key={service} className="flex items-center space-x-3">
                        <Checkbox
                          id={service}
                          checked={selectedServices.includes(service)}
                          onCheckedChange={() => handleServiceToggle(service)}
                          data-testid={`checkbox-service-${service}`}
                        />
                        <label
                          htmlFor={service}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer flex-1"
                        >
                          {service.replace("_", " ")}
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  {/* Campo de texto para "otro" */}
                  {selectedServices.includes("otro") && (
                    <div className="mt-4">
                      <label htmlFor="otro-texto" className="text-sm font-medium mb-2 block">
                        Especificar "otro":
                      </label>
                      <Textarea
                        id="otro-texto"
                        value={otroTexto}
                        onChange={(e) => setOtroTexto(e.target.value)}
                        placeholder="Describe los elementos adicionales que el dentista envía..."
                        className="min-h-20"
                        data-testid="textarea-otro"
                      />
                    </div>
                  )}

                  {selectedServices.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Servicios seleccionados:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedServices.map((service) => (
                          <Badge key={service} variant="secondary">
                            {service === "otro" && otroTexto ? `${service}: ${otroTexto}` : service.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <FormMessage>
                    {form.formState.errors.services?.message}
                  </FormMessage>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Odontogram */}
            <div className="lg:order-2 flex-1">
              <Odontogram
                selectedConditions={selectedConditions}
                onToothSelect={handleToothSelect}
                onClearTooth={handleClearTooth}
              />
            </div>
          </div>

          {/* Form Error */}
          {form.formState.errors.root && (
            <div className="text-destructive text-sm text-center">
              {form.formState.errors.root.message}
            </div>
          )}

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-3 pt-6 border-t -mx-4 sm:mx-0 px-4 sm:px-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
              data-testid="button-cancel"
              className="w-full sm:w-auto min-h-12"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              data-testid="button-submit-order"
              className="w-full sm:w-auto min-h-12"
            >
              {isSubmitting ? (
                "Creando..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Orden
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}