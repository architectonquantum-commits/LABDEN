import { useState } from "react";
import { Header } from "./Header";
import { ThemeProvider } from "./ThemeProvider";

interface User {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "laboratorio" | "doctor";
  lab_id?: string;
  lab_name?: string;
}

interface Notification {
  id: string;
  type: "new_order" | "order_completed";
  message: string;
  status: "unread" | "read";
  created_at: string;
}

interface LayoutProps {
  user: User;
  children: React.ReactNode;
  onLogout: () => void;
}

export function Layout({ user, children, onLogout }: LayoutProps) {
  // Mock notifications - TODO: Replace with real notifications
  const [notifications] = useState<Notification[]>([
    {
      id: "1",
      type: "order_completed",
      message: "Tu orden #123 ha sido completada",
      status: "unread",
      created_at: "2025-01-23T10:00:00Z"
    },
    {
      id: "2",
      type: "new_order", 
      message: "Nueva orden #124 recibida de Dr. López",
      status: "read",
      created_at: "2025-01-22T15:30:00Z"
    }
  ]);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <Header
          user={user}
          notifications={notifications}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}