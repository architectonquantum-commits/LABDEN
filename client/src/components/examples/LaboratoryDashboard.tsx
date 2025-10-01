import { LaboratoryDashboard } from '../LaboratoryDashboard';

export default function LaboratoryDashboardExample() {
  const handleStatusChange = (orderId: string, newStatus: string) => {
    console.log(`Status changed for order ${orderId} to ${newStatus}`);
  };

  const handleCreateDoctor = () => {
    console.log('Create new doctor');
  };

  const handleEditDoctor = (doctorId: string) => {
    console.log(`Edit doctor ${doctorId}`);
  };

  const handleDeleteDoctor = (doctorId: string) => {
    console.log(`Delete doctor ${doctorId}`);
  };

  return (
    <LaboratoryDashboard
      onStatusChange={handleStatusChange}
      onCreateDoctor={handleCreateDoctor}
      onEditDoctor={handleEditDoctor}
      onDeleteDoctor={handleDeleteDoctor}
    />
  );
}