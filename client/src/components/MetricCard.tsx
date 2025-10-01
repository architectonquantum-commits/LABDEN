import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: "up" | "down" | "neutral";
    percentage: number;
    label?: string;
  };
  icon?: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  onClick?: () => void;
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon, 
  variant = "default",
  onClick
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend?.direction) {
      case "up":
        return <TrendingUp className="w-3 h-3" />;
      case "down":
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <Minus className="w-3 h-3" />;
    }
  };

  const getTrendColor = () => {
    switch (trend?.direction) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getCardVariant = () => {
    switch (variant) {
      case "primary":
        return "border-primary/20 bg-primary/5";
      case "success":
        return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950";
      case "warning":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950";
      case "destructive":
        return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950";
      default:
        return "";
    }
  };

  return (
    <Card 
      className={`hover-elevate active-elevate-2 ${getCardVariant()} ${onClick ? 'cursor-pointer' : ''}`} 
      data-testid={`metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-bold">{value}</div>
          
          <div className="flex items-center gap-2">
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            
            {trend && (
              <Badge variant="outline" className={`flex items-center gap-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-xs">
                  {trend.percentage > 0 ? "+" : ""}{trend.percentage}%
                </span>
                {trend.label && <span className="ml-1">{trend.label}</span>}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}