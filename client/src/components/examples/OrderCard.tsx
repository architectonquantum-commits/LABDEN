import { OrderCard } from '../OrderCard';

export default function OrderCardExample() {
  const mockOrder = {
    id: "123",
    doctor_id: "doc1",
    doctor_name: "Dr. María González",
    lab_id: "lab1",
    lab_name: "Laboratorio Dental Sonrisa",
    status: "en_proceso" as const,
    value: 1500.00,
    services: ["cucharilla", "modelo_estudio", "prótesis"],
    created_at: "2025-01-20T10:00:00Z",
    observaciones: "Paciente con sensibilidad dental. Revisar oclusión cuidadosamente."
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    console.log(`Status changed for order ${orderId} to ${newStatus}`);
  };

  const handleViewDetails = (orderId: string) => {
    console.log(`View details for order ${orderId}`);
  };

  const handleEdit = (orderId: string) => {
    console.log(`Edit order ${orderId}`);
  };

  return (
    <div className="p-4 max-w-md">
      <OrderCard
        order={mockOrder}
        onStatusChange={handleStatusChange}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        showLab={true}
      />
    </div>
  );
}