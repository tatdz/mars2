import { ValidatorTable } from "@/components/ValidatorTable";
import { NetworkStats } from "@/components/NetworkStats";
import { StakingRecommendations } from "@/components/StakingRecommendations";

export default function Home() {
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">Validator Dashboard</h1>
              <p className="text-gray-400">
                A unified lens on risk and collaboration for stakers and validators on Sei
              </p>
            </div>
            <div className="flex justify-center">
              <NetworkStats />
            </div>
          </div>

          {/* AI Staking Recommendations */}
          <StakingRecommendations />

          {/* Validator Table */}
          <ValidatorTable />
        </div>
      </main>
    </div>
  );
}
