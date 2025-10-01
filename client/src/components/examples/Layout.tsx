import { Layout } from '../Layout';

export default function LayoutExample() {
  const mockUser = {
    id: "1",
    name: "Dr. María González",
    email: "maria@dental.com",
    role: "doctor" as const
  };

  const handleLogout = () => {
    console.log('User logged out');
  };

  return (
    <Layout user={mockUser} onLogout={handleLogout}>
      <div className="p-6">
        <h2 className="text-2xl font-bold">Dashboard Content</h2>
        <p className="text-muted-foreground">This is where the main content would appear.</p>
      </div>
    </Layout>
  );
}