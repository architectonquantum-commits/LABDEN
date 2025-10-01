import { Header } from '../Header';
import { ThemeProvider } from '../ThemeProvider';

export default function HeaderExample() {
  const mockUser = {
    id: "1",
    name: "Dr. Juan Pérez",
    email: "doctor@dental.com",
    role: "doctor" as const
  };

  const mockNotifications = [
    {
      id: "1",
      type: "order_completed" as const,
      message: "Tu orden #123 ha sido completada",
      status: "unread" as const,
      created_at: "2025-01-23T10:00:00Z"
    },
    {
      id: "2", 
      type: "new_order" as const,
      message: "Nueva orden #124 recibida",
      status: "read" as const,
      created_at: "2025-01-22T15:30:00Z"
    }
  ];

  const handleLogout = () => {
    console.log('Logout clicked');
  };

  const handleToggleSidebar = () => {
    console.log('Toggle sidebar');
  };

  return (
    <ThemeProvider>
      <Header 
        user={mockUser}
        notifications={mockNotifications}
        onLogout={handleLogout}
        onToggleSidebar={handleToggleSidebar}
      />
    </ThemeProvider>
  );
}