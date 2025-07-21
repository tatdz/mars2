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
  Bot,
  Loader2,
  X,
  Zap
} from "lucide-react";

interface Delegation {
  validator_address: string;
  validator_name: string;
  staked_amount: string;
  mars_score: number;
  recommendation: string;
  risk_level: 'green' | 'yellow' | 'red';
  callbacks?: {
    unstake: string;
    redelegate: string;
    incidents: string;
  };
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
  const [aiResponse, setAiResponse] = useState<{ message: string; type: string } | null>(null);
  const [showAiChat, setShowAiChat] = useState(false);


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
            risk_level: 'red',
            callbacks: {
              unstake: 'unstake_rhino',
              redelegate: 'redelegate_rhino',
              incidents: 'incidents_rhino'
            }
          },
          {
            validator_address: "seivaloper1example2", 
            validator_name: "Blockscope",
            staked_amount: "500 SEI",
            mars_score: 75,
            recommendation: "🟡 Moderate risk. Monitor or consider reducing stake.",
            risk_level: 'yellow',
            callbacks: {
              unstake: 'unstake_blockscope',
              redelegate: 'redelegate_blockscope',
              incidents: 'incidents_blockscope'
            }
          },
          {
            validator_address: "seivaloper1example3",
            validator_name: "polkachu.com", 
            staked_amount: "2000 SEI",
            mars_score: 85,
            recommendation: "🟢 Healthy — no action needed.",
            risk_level: 'green',
            callbacks: {
              unstake: 'unstake_polkachu_com',
              redelegate: 'redelegate_polkachu_com',
              incidents: 'incidents_polkachu_com'
            }
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

  const handleCallback = async (callbackId: string, action: string, validatorName: string) => {
    if (!address) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/eliza/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callback: callbackId,
          userAddress: address
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get AI response: ${response.statusText}`);
      }

      const data = await response.json();
      setAiResponse(data);
      setShowAiChat(true);
    } catch (err) {
      console.error('Error getting AI response:', err);
      setError(`Failed to get AI advice for ${action} on ${validatorName}`);
    } finally {
      setLoading(false);
    }
  };

  const closeAiChat = () => {
    setShowAiChat(false);
    setAiResponse(null);
  };



  const handleAskAIAboutIncidents = async (validatorName: string, score: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Map known validator names to their real Sei addresses from Sei API
      const validatorAddressMap: { [key: string]: string } = {
        'Enigma': 'seivaloper1qdmt7sq86mawwq62gl3w9aheu3ak3vtqgjp8mm',
        'STAKEME': 'seivaloper1q0ejqj0mg76cq2885rf6qrwvtht3nqgd9sy5rw',
        'Forbole': 'seivaloper1q3eq77eam27armtmcr7kft3m7350a30jhgwf26',
        'Four Pillars': 'seivaloper1n8dkzn66f9ys8kfcdsmrtcz9003ummhxxe6g23',
        'ContributionDAO': 'seivaloper10hg23nf7eejwvthlad096x95pq84g4wnnwjtzq',
        'Binance Node': 'seivaloper1x0c99e8huemhcjhue4np8c805w9k8nnvsccmff'
      };
      
      const validatorAddress = validatorAddressMap[validatorName] || 
                              `seivaloper1${validatorName.toLowerCase().replace(/[^a-z0-9]/g, '')}demo`;
      
      const response = await fetch('/api/eliza/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          validatorName,
          validatorAddress,
          userAddress: address
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get AI incident analysis: ${response.statusText}`);
      }

      const data = await response.json();
      setAiResponse(data);
      setShowAiChat(true);
    } catch (err) {
      console.error('Error getting AI incident analysis:', err);
      setError(`Failed to get AI analysis for ${validatorName}. Please try again.`);
    } finally {
      setLoading(false);
    }
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
              className="bg-white text-black border-gray-300 hover:bg-gray-100"
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
                      
                      {/* Only show action buttons for non-green validators */}
                      {delegation.risk_level !== 'green' && (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <Button
                            size="sm"
                            onClick={() => delegation.callbacks && handleCallback(delegation.callbacks.unstake, 'unstake', delegation.validator_name)}
                            className="flex-1 bg-red-600 text-white hover:bg-red-700 border-0"
                            disabled={loading}
                          >
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Unstake
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => delegation.callbacks && handleCallback(delegation.callbacks.redelegate, 'redelegate', delegation.validator_name)}
                            className="flex-1 bg-yellow-500 text-black hover:bg-yellow-600 border-0"
                            disabled={loading}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Redelegate
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAskAIAboutIncidents(delegation.validator_name, delegation.mars_score)}
                            className="bg-purple-accent text-white hover:bg-purple-accent/90 border-0"
                            disabled={loading}
                          >
                            <Zap className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      )}
                      

                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Enhanced AI Incident Analysis Modal */}
      {showAiChat && aiResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-card border border-gray-700 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-purple-accent" />
                <span className="text-white font-medium">Mars² Incident AI</span>
                <Badge variant="outline" className="text-purple-accent border-purple-accent">
                  Onchain Analysis
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={closeAiChat}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="bg-dark-bg rounded-lg p-6 border border-gray-600">
                <div className="prose prose-invert max-w-none">
                  {aiResponse.message ? aiResponse.message.split('\n').map((line: string, i: number) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return (
                        <h3 key={i} className="text-white font-semibold text-lg mb-2 mt-4">
                          {line.replace(/\*\*/g, '')}
                        </h3>
                      );
                    }
                    if (line.startsWith('• ')) {
                      return (
                        <div key={i} className="ml-4 mb-1 text-gray-200">
                          <span className="text-purple-accent mr-2">•</span>
                          {line.slice(2)}
                        </div>
                      );
                    }
                    if (line.match(/^\d+\./)) {
                      return (
                        <div key={i} className="ml-4 mb-2 text-gray-200">
                          <span className="text-purple-accent font-medium">{line}</span>
                        </div>
                      );
                    }
                    if (line.includes('📊') || line.includes('⚠️') || line.includes('🚨') || line.includes('✅')) {
                      return (
                        <div key={i} className="text-white font-medium text-base mb-2 p-2 bg-dark-card rounded border-l-4 border-purple-accent">
                          {line}
                        </div>
                      );
                    }
                    return line ? (
                      <p key={i} className="text-gray-200 mb-2 leading-relaxed">
                        {line}
                      </p>
                    ) : null;
                  }) : <p className="text-gray-400">No content available</p>}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-700 flex justify-between items-center">
              <div className="text-xs text-gray-400">
                Analysis based on onchain Mars² events and performance data
              </div>
              <Button
                size="sm"
                onClick={closeAiChat}
                className="bg-purple-accent hover:bg-purple-accent/90"
              >
                Close Analysis
              </Button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}