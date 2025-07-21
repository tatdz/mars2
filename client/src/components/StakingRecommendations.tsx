import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrendingDown, 
  RefreshCw, 
  AlertTriangle, 
  Shield, 
  Eye, 
  Bot,
  Loader2
} from "lucide-react";

interface Delegation {
  validator_address: string;
  validator_name: string;
  staked_amount: string;
  mars_score: number;
  recommendation: string;
  risk_level: 'green' | 'yellow' | 'red';
}

interface ElizaRecommendation {
  delegations: Delegation[];
  summary: string;
  total_at_risk: string;
}

export function StakingRecommendations() {
  const { address, isConnected } = useWallet();
  const [recommendations, setRecommendations] = useState<ElizaRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call our backend endpoint that integrates with Eliza agent
      const response = await fetch('/api/eliza/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userAddress: address 
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
      }

      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch AI recommendations');
      console.error('Error fetching AI recommendations:', err);
      
      // Fallback demo data for development
      setRecommendations({
        delegations: [
          {
            validator_address: "seivaloper1example1",
            validator_name: "RHINO",
            staked_amount: "1000 SEI",
            mars_score: 45,
            recommendation: "🔴 High risk! Unstake immediately and review incidents.",
            risk_level: 'red'
          },
          {
            validator_address: "seivaloper1example2", 
            validator_name: "Blockscope",
            staked_amount: "500 SEI",
            mars_score: 75,
            recommendation: "🟡 Moderate risk. Monitor or consider reducing stake.",
            risk_level: 'yellow'
          },
          {
            validator_address: "seivaloper1example3",
            validator_name: "polkachu.com", 
            staked_amount: "2000 SEI",
            mars_score: 85,
            recommendation: "🟢 Healthy — no action needed.",
            risk_level: 'green'
          }
        ],
        summary: "You have 1 high-risk delegation requiring immediate action. Consider unstaking 1000 SEI from RHINO validator.",
        total_at_risk: "1000 SEI"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchRecommendations();
    }
  }, [isConnected, address]);

  const handleUnstake = (validatorAddress: string, validatorName: string) => {
    alert(`Demo: Unstaking from ${validatorName} (${validatorAddress}). This would redirect to Sei staking interface.`);
  };

  const handleRedelegate = (validatorAddress: string, validatorName: string) => {
    alert(`Demo: Redelegating from ${validatorName} to a safer validator. This would open a delegation modal.`);
  };

  const handleSeeIncidents = (validatorAddress: string, validatorName: string) => {
    alert(`Demo: Viewing incident reports for ${validatorName}. This would show detailed Mars² incident history.`);
  };

  if (!isConnected) {
    return (
      <Card className="bg-dark-card border-gray-700">
        <CardContent className="pt-6 text-center">
          <div className="text-gray-400 mb-2">
            <Bot className="w-8 h-8 mx-auto mb-2" />
            Connect your wallet to get personalized staking recommendations
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'green': return 'text-validator-green';
      case 'yellow': return 'text-validator-yellow';  
      case 'red': return 'text-validator-red';
      default: return 'text-gray-400';
    }
  };

  const getRiskBadge = (riskLevel: string, score: number) => {
    const colorClass = getRiskColor(riskLevel);
    return (
      <Badge variant="outline" className={`${colorClass} border-current`}>
        Mars² Score: {score}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-dark-card border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-purple-accent" />
              <span>AI Staking Recommendations</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchRecommendations}
              disabled={loading}
              className="text-white border-gray-600"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-dark-bg border-yellow-600">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-200">
                {error} (Showing demo recommendations)
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-accent" />
              <div className="text-white">Analyzing your delegations...</div>
              <div className="text-gray-400 text-sm">AI agent is fetching Mars² scores and generating recommendations</div>
            </div>
          ) : recommendations ? (
            <div className="space-y-4">
              {/* AI Summary */}
              <Alert className="bg-dark-bg border-purple-accent">
                <Bot className="h-4 w-4 text-purple-accent" />
                <AlertDescription className="text-gray-300">
                  <div className="font-medium text-purple-accent mb-1">AI Analysis Summary</div>
                  {recommendations.summary}
                </AlertDescription>
              </Alert>

              {/* Delegations List */}
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {recommendations.delegations.map((delegation, index) => (
                    <div key={index} className="p-4 bg-dark-bg rounded-lg border border-gray-600">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-white font-medium">{delegation.validator_name}</span>
                            {getRiskBadge(delegation.risk_level, delegation.mars_score)}
                          </div>
                          <div className="text-sm text-gray-400">{delegation.validator_address}</div>
                          <div className="text-sm text-white">Staked: {delegation.staked_amount}</div>
                        </div>
                      </div>
                      
                      <div className={`text-sm mb-3 ${getRiskColor(delegation.risk_level)}`}>
                        {delegation.recommendation}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnstake(delegation.validator_address, delegation.validator_name)}
                          className="flex-1 text-validator-red border-validator-red hover:bg-validator-red hover:text-white"
                        >
                          <TrendingDown className="w-3 h-3 mr-1" />
                          Unstake
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRedelegate(delegation.validator_address, delegation.validator_name)}
                          className="flex-1 text-validator-yellow border-validator-yellow hover:bg-validator-yellow hover:text-white"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Redelegate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSeeIncidents(delegation.validator_address, delegation.validator_name)}
                          className="flex-1 text-white border-gray-600 hover:bg-gray-600"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          See Incidents
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}