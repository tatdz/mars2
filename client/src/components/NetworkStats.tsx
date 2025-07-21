import { useValidatorStats } from "@/hooks/useValidators";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Shield, AlertTriangle } from "lucide-react";

export function NetworkStats() {
  const stats = useValidatorStats();

  const statItems = [
    {
      label: "Active Validators",
      value: stats.active,
      icon: Shield,
      color: "text-validator-green",
    },
    {
      label: "Network Uptime",
      value: `${stats.averageUptime.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-validator-green",
    },
    {
      label: "Jailed Validators",
      value: stats.jailed,
      icon: AlertTriangle,
      color: "text-validator-red",
    },
  ];

  return (
    <Card className="bg-dark-card border-gray-700">
      <CardContent className="pt-4">
        <h3 className="text-lg font-semibold mb-4 text-white text-center">Network Stats</h3>
        <div className="grid grid-cols-3 gap-4">
          {statItems.map((item) => (
            <div key={item.label} className="text-center">
              <div className="flex justify-center mb-2">
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div className="text-xs text-gray-400 mb-1">{item.label}</div>
              <div className={`text-lg font-bold ${item.color}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
