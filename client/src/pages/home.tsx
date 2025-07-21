import { ValidatorTable } from "@/components/ValidatorTable";
import { GroupChat } from "@/components/GroupChat";
import { NetworkStats } from "@/components/NetworkStats";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MessageCircle, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-dark-bg">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-surface border-r border-gray-700 hidden lg:block">
        <div className="p-6">
          <NetworkStats />

          <div className="mt-8">
            <h4 className="text-md font-semibold mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-left hover:bg-dark-card"
              >
                <AlertTriangle className="mr-2 h-4 w-4 text-validator-yellow" />
                Report Incident
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-left hover:bg-dark-card"
              >
                <MessageCircle className="mr-2 h-4 w-4 text-sei-blue" />
                Group Messages
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-left hover:bg-dark-card"
              >
                <TrendingUp className="mr-2 h-4 w-4 text-validator-green" />
                Score Analytics
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="space-y-8">
          <ValidatorTable />
          <GroupChat />
        </div>
      </main>
    </div>
  );
}
