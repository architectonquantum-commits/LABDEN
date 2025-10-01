import { DashboardChart } from '../DashboardChart';

export default function DashboardChartExample() {
  const barData = [
    { name: 'Ene', value: 45 },
    { name: 'Feb', value: 52 },
    { name: 'Mar', value: 38 },
    { name: 'Abr', value: 61 },
    { name: 'May', value: 55 },
    { name: 'Jun', value: 67 }
  ];

  const pieData = [
    { name: 'Pendiente', value: 30, color: 'hsl(210 50% 60%)' },
    { name: 'En Proceso', value: 45, color: 'hsl(45 100% 60%)' },
    { name: 'Completada', value: 125, color: 'hsl(120 60% 50%)' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <DashboardChart
        title="Órdenes por Mes"
        data={barData}
        type="bar"
        height={250}
      />
      
      <DashboardChart
        title="Órdenes por Estado"
        data={pieData}
        type="pie"
        height={250}
      />
    </div>
  );
}