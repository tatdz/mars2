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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Network Stats</h3>
      {statItems.map((item) => (
        <Card key={item.label} className="bg-dark-card border-gray-700">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-3">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <div>
                <div className="text-sm text-gray-400">{item.label}</div>
                <div className={`text-xl font-bold ${item.color}`}>
                  {item.value}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
