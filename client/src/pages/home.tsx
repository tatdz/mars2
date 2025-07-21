import { ValidatorTable } from "@/components/ValidatorTable";
import { NetworkStats } from "@/components/NetworkStats";

export default function Home() {
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="grid lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">Validator Dashboard</h1>
                <p className="text-gray-400">
                  Real-time monitoring of Sei testnet validators with risk scoring and security analysis
                </p>
              </div>
            </div>
            <div className="lg:col-span-1">
              <NetworkStats />
            </div>
          </div>

          {/* Validator Table */}
          <ValidatorTable />
        </div>
      </main>
    </div>
  );
}
