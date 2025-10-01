import { MetricCard } from '../MetricCard';
import { Users, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';

export default function MetricCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <MetricCard
        title="Total Órdenes"
        value={156}
        subtitle="Este mes"
        trend={{ direction: "up", percentage: 12.5, label: "vs mes anterior" }}
        icon={<ShoppingCart className="w-4 h-4" />}
        variant="primary"
      />
      
      <MetricCard
        title="Doctores Activos"
        value={24}
        subtitle="Registrados"
        trend={{ direction: "up", percentage: 8.2 }}
        icon={<Users className="w-4 h-4" />}
        variant="success"
      />
      
      <MetricCard
        title="Valor Total"
        value="$45,320"
        subtitle="Ingresos del mes"
        trend={{ direction: "down", percentage: -2.1 }}
        icon={<DollarSign className="w-4 h-4" />}
        variant="warning"
      />
      
      <MetricCard
        title="Tasa de Completado"
        value="94.2%"
        subtitle="Órdenes completadas"
        trend={{ direction: "neutral", percentage: 0 }}
        icon={<TrendingUp className="w-4 h-4" />}
      />
    </div>
  );
}