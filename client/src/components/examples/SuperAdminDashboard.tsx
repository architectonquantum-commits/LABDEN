import { SuperAdminDashboard } from '../SuperAdminDashboard';

export default function SuperAdminDashboardExample() {
  const handleCreateLab = () => {
    console.log('Create new lab');
  };

  const handleEditLab = (labId: string) => {
    console.log(`Edit lab ${labId}`);
  };

  const handleDeleteLab = (labId: string) => {
    console.log(`Delete lab ${labId}`);
  };

  return (
    <SuperAdminDashboard
      onCreateLab={handleCreateLab}
      onEditLab={handleEditLab}
      onDeleteLab={handleDeleteLab}
    />
  );
}