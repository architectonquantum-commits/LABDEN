import { DoctorDashboard } from '../DoctorDashboard';

export default function DoctorDashboardExample() {
  const handleCreateOrder = () => {
    console.log('Create new order');
  };

  const handleViewOrderDetails = (orderId: string) => {
    console.log(`View details for order ${orderId}`);
  };

  return (
    <DoctorDashboard
      onCreateOrder={handleCreateOrder}
      onViewOrderDetails={handleViewOrderDetails}
    />
  );
}