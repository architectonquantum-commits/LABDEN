import { useState } from "react";
import { Bell, Moon, Sun, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { useTheme } from "./ThemeProvider";

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

interface HeaderProps {
  user: User;
  notifications: Notification[];
  onLogout: () => void;
  onToggleSidebar?: () => void;
}

export function Header({ user, notifications, onLogout, onToggleSidebar }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  const unreadCount = notifications.filter(n => n.status === "unread").length;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "superadmin": return "SuperAdmin";
      case "laboratorio": return "Laboratorio";
      case "doctor": return "Dentista";
      default: return role;
    }
  };

  const handleNotificationClick = (notificationId: string) => {
    console.log(`Marking notification ${notificationId} as read`);
    // TODO: Mark notification as read
  };

  return (
    <header className="border-b bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onToggleSidebar}
              data-testid="button-toggle-sidebar"
            >
              <Menu className="w-4 h-4" />
            </Button>
          )}
          
          <div>
            <h1 className="text-lg font-semibold">SaaS Dental Lab</h1>
            <p className="text-xs text-muted-foreground">
              {getRoleLabel(user.role)} - {user.lab_name || user.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                data-testid="button-notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2 font-medium border-b">
                Notificaciones {unreadCount > 0 && `(${unreadCount} nuevas)`}
              </div>
              
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No hay notificaciones
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id}
                      className="p-3 cursor-pointer"
                      onClick={() => handleNotificationClick(notification.id)}
                      data-testid={`notification-${notification.id}`}
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center justify-between">
                          <p className="text-sm">{notification.message}</p>
                          {notification.status === "unread" && (
                            <Badge variant="secondary" className="h-2 w-2 p-0 rounded-full" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="pl-2" data-testid="button-user-menu">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {(user.lab_name || user.name).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block">{user.lab_name || user.name}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}