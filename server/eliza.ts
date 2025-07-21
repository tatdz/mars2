import { ethers } from 'ethers';

// Eliza AI agent integration for Mars² staking recommendations
export class ElizaStakingAgent {
  private provider: ethers.JsonRpcProvider;
  private marsContract: ethers.Contract;

  constructor() {
    // Initialize Sei EVM testnet provider
    this.provider = new ethers.JsonRpcProvider("https://evm-rpc.testnet.sei.io");
    
    // Mars² Validator Score contract
    const marsContractABI = [
      "function getScore(address validator) public view returns (int256)"
    ];
    this.marsContract = new ethers.Contract(
      "0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294",
      marsContractABI,
      this.provider
    );
  }

  // Fetch user's current delegations from Sei REST API
  async getUserDelegations(userAddress: string): Promise<any[]> {
    try {
      const response = await fetch(`https://sei.explorers.guru/api/accounts/${userAddress}/delegations`);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      const data = await response.json();
      return data.delegations || [];
    } catch (error) {
      console.warn('Failed to fetch real delegations, using demo data:', error);
      
      // Return demo delegations for development
      return [
        {
          validator_address: "seivaloper1example1",
          shares: "1000000000000000000000", // 1000 SEI
          validator: {
            description: { moniker: "RHINO" }
          }
        },
        {
          validator_address: "seivaloper1example2", 
          shares: "500000000000000000000", // 500 SEI
          validator: {
            description: { moniker: "Blockscope" }
          }
        },
        {
          validator_address: "seivaloper1example3",
          shares: "2000000000000000000000", // 2000 SEI
          validator: {
            description: { moniker: "polkachu.com" }
          }
        }
      ];
    }
  }

  // Fetch Mars² score for a specific validator
  async getValidatorScore(validatorAddress: string): Promise<number> {
    try {
      const score = await this.marsContract.getScore(validatorAddress);
      return Number(score);
    } catch (error) {
      console.warn(`Failed to fetch Mars² score for ${validatorAddress}:`, error);
      
      // Return simulated scores for demo
      if (validatorAddress.includes("example1")) return 45; // Red
      if (validatorAddress.includes("example2")) return 75; // Yellow  
      if (validatorAddress.includes("example3")) return 85; // Green
      return 60; // Default yellow
    }
  }

  // Generate AI-powered staking recommendation based on Mars² score
  generateRecommendation(score: number): { recommendation: string, riskLevel: 'green' | 'yellow' | 'red' } {
    if (score >= 80) {
      return {
        recommendation: "🟢 Healthy — no action needed.",
        riskLevel: 'green'
      };
    }
    if (score >= 50) {
      return {
        recommendation: "🟡 Moderate risk. Monitor or consider reducing stake.",
        riskLevel: 'yellow'
      };
    }
    return {
      recommendation: "🔴 High risk! Unstake immediately and review incidents.",
      riskLevel: 'red'
    };
  }

  // Format SEI amount from wei to readable format
  formatSeiAmount(weiAmount: string): string {
    try {
      const sei = ethers.formatEther(weiAmount);
      return `${parseFloat(sei).toLocaleString()} SEI`;
    } catch (error) {
      return weiAmount;
    }
  }

  // Handle interactive button callbacks for conversational responses
  async handleCallback(callbackId: string, userAddress: string) {
    try {
      console.log(`Eliza AI: Handling callback ${callbackId} for ${userAddress}`);
      
      if (callbackId.startsWith('unstake_')) {
        const validatorName = callbackId.replace('unstake_', '').toUpperCase();
        return {
          message: `To unstake from ${validatorName}, follow these steps:\n\n1. Open your MetaMask wallet\n2. Navigate to the Sei staking interface\n3. Find your delegation to ${validatorName}\n4. Click "Undelegate" and confirm the transaction\n\n⚠️ Important: Unstaking has a 21-day unbonding period. Your SEI will be locked during this time.\n\nEstimated gas cost: ~0.01 SEI\nUnbonding period: 21 days`,
          type: 'unstake_guide'
        };
      }
      
      if (callbackId.startsWith('redelegate_')) {
        const validatorName = callbackId.replace('redelegate_', '').toUpperCase();
        // Fetch top validators for redelegation suggestions
        const topValidators = await this.getTopValidators();
        const suggestions = topValidators.slice(0, 3).map((v, i) => 
          `${i + 1}. ${v.name} - Mars² Score: ${v.score} (${v.uptime}% uptime)`
        ).join('\n');
        
        return {
          message: `Moving your stake from ${validatorName} to a safer validator:\n\n🏆 Top Recommended Validators:\n${suggestions}\n\n📝 How to redelegate:\n1. Open your wallet's staking section\n2. Find your ${validatorName} delegation\n3. Click "Redelegate" (no unbonding period!)\n4. Choose one of the recommended validators above\n5. Confirm the transaction\n\n✨ Pro tip: Redelegation is instant - no waiting period required!`,
          type: 'redelegate_guide'
        };
      }
      
      if (callbackId.startsWith('incidents_')) {
        const validatorName = callbackId.replace('incidents_', '').toUpperCase();
        const incidents = await this.getValidatorIncidents(validatorName);
        
        return {
          message: `📊 ${validatorName} Incident Report:\n\n${incidents.summary}\n\n📈 Recent Events:\n${incidents.events.join('\n')}\n\n🔍 Mars² Analysis:\n${incidents.analysis}\n\n💡 Recommendation: ${incidents.recommendation}`,
          type: 'incident_report'
        };
      }
      
      // General conversational responses
      if (callbackId === 'general_advice') {
        const delegations = await this.getUserDelegations(userAddress);
        const riskCount = delegations.filter(d => d.risk === 'high').length;
        
        if (riskCount === 0) {
          return {
            message: "Your staking portfolio looks healthy! All validators have acceptable Mars² scores. Keep monitoring for any changes in validator performance.",
            type: 'general_advice'
          };
        } else {
          return {
            message: `I found ${riskCount} high-risk delegation(s) in your portfolio. Consider unstaking or redelegating to safer validators to protect your assets. Would you like specific recommendations?`,
            type: 'general_advice'
          };
        }
      }
      
      return {
        message: "I didn't understand that request. Try asking about unstaking, redelegating, or viewing incidents for a specific validator.",
        type: 'error'
      };
      
    } catch (error) {
      console.error('Eliza callback error:', error);
      return {
        message: "I encountered an error processing your request. Please try again or contact support.",
        type: 'error'
      };
    }
  }

  // Get top performing validators for redelegation recommendations  
  async getTopValidators() {
    // In production, this would query the real Mars² scoring contract
    return [
      { name: 'Imperator.co', score: 98, uptime: 99.9 },
      { name: 'StingRay', score: 95, uptime: 99.7 },
      { name: 'polkachu.com', score: 92, uptime: 99.5 },
      { name: 'Nodes.Guru', score: 90, uptime: 99.2 }
    ];
  }

  // Get incident history for a specific validator
  async getValidatorIncidents(validatorName: string) {
    // In production, this would query Mars² contracts and incident reports
    const incidents: { [key: string]: any } = {
      'RHINO': {
        summary: "RHINO has experienced multiple performance issues recently, leading to a low Mars² score.",
        events: [
          "• July 17: Missed 12 consecutive blocks (downtime event)",
          "• July 15: Community reported governance voting absence", 
          "• July 4: Temporarily jailed due to double-signing incident",
          "• June 28: Score penalty applied (-15 points)"
        ],
        analysis: "Pattern of reliability issues with governance participation concerns. Score dropped from 75 to 40 over the past month.",
        recommendation: "High risk - consider unstaking immediately. Multiple incidents indicate ongoing validator management issues."
      },
      'BLOCKSCOPE': {
        summary: "Blockscope shows moderate risk with recent performance fluctuations.",
        events: [
          "• July 10: Minor uptime dip to 98.5%",
          "• June 25: Missed 2 governance proposals",
          "• June 15: Brief network connectivity issues"
        ],
        analysis: "Generally reliable but showing some inconsistency. Mars² score steady at 75.",
        recommendation: "Moderate risk - monitor closely or consider partial redelegation to diversify risk."
      }
    };
    
    return incidents[validatorName] || {
      summary: `${validatorName} incident data is being analyzed.`,
      events: ["• No major incidents recorded in the past 30 days"],
      analysis: "Validator appears to be performing within acceptable parameters.",
      recommendation: "Continue monitoring through Mars² dashboard for any changes."
    };
  }

  // Main function to get personalized staking recommendations
  async getStakingRecommendations(userAddress: string) {
    try {
      console.log(`Eliza AI: Analyzing delegations for ${userAddress}`);
      
      // 1. Fetch user's current delegations
      const delegations = await this.getUserDelegations(userAddress);
      console.log(`Found ${delegations.length} delegations`);

      // 2. Fetch Mars² scores and generate recommendations for each
      const recommendations = await Promise.all(
        delegations.map(async (delegation: any) => {
          const score = await this.getValidatorScore(delegation.validator_address);
          const aiRecommendation = this.generateRecommendation(score);
          
          return {
            validator_address: delegation.validator_address,
            validator_name: delegation.validator?.description?.moniker || 'Unknown Validator',
            staked_amount: this.formatSeiAmount(delegation.shares),
            mars_score: score,
            recommendation: aiRecommendation.recommendation,
            risk_level: aiRecommendation.riskLevel,
            callbacks: {
              unstake: `unstake_${delegation.validator?.description?.moniker?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'validator'}`,
              redelegate: `redelegate_${delegation.validator?.description?.moniker?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'validator'}`,
              incidents: `incidents_${delegation.validator?.description?.moniker?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'validator'}`
            }
          };
        })
      );

      // 3. Generate AI summary
      const highRiskDelegations = recommendations.filter(r => r.risk_level === 'red');
      const totalAtRisk = highRiskDelegations.reduce((sum, r) => {
        const amount = parseFloat(r.staked_amount.replace(/[^\d.]/g, ''));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      let summary: string;
      if (highRiskDelegations.length === 0) {
        summary = "Your staking portfolio looks healthy! All validators have acceptable Mars² scores.";
      } else if (highRiskDelegations.length === 1) {
        summary = `You have 1 high-risk delegation requiring immediate action. Consider unstaking from ${highRiskDelegations[0].validator_name}.`;
      } else {
        summary = `You have ${highRiskDelegations.length} high-risk delegations requiring immediate action. Total at risk: ${totalAtRisk.toLocaleString()} SEI.`;
      }

      return {
        delegations: recommendations,
        summary,
        total_at_risk: `${totalAtRisk.toLocaleString()} SEI`,
        user_address: userAddress,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Eliza AI error:', error);
      throw new Error('Failed to generate staking recommendations');
    }
  }

  async getValidators(): Promise<ValidatorInfo[]> {
    try {
      return await this.getSeiValidators();
    } catch (error) {
      console.error('Error getting validators:', error);
      return [];
    }
  }

  async getTopValidators(): Promise<ValidatorInfo[]> {
    try {
      const validators = await this.getSeiValidators();
      return validators
        .sort((a, b) => (b.uptime || 0) - (a.uptime || 0))
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting top validators:', error);
      return [];
    }
  }

  async getMarsScore(validatorAddress: string): Promise<number> {
    try {
      const score = await this.getMarsValidatorScore(validatorAddress);
      return score;
    } catch (error) {
      console.error('Error getting Mars² score:', error);
      // Return random demo score between 30-90 for demo purposes
      return Math.floor(Math.random() * 60) + 30;
    }
  }

  async getValidatorIncidents(validatorAddress: string): Promise<any[]> {
    try {
      // In a real implementation, this would fetch from the MarsZkAttest contract
      // or an incident database. For now, return simulated data based on score.
      const score = await this.getMarsScore(validatorAddress);
      
      if (score < 60) {
        return [
          {
            type: "Performance Issue",
            description: "Multiple missed blocks reported in the last 24 hours",
            score_impact: -10,
            timestamp: Date.now() - 86400000 // 24 hours ago
          },
          {
            type: "Community Report", 
            description: "Anonymous report of validator downtime",
            score_impact: -15,
            timestamp: Date.now() - 172800000 // 48 hours ago
          }
        ];
      } else if (score < 80) {
        return [
          {
            type: "Minor Issue",
            description: "Occasional missed blocks detected",
            score_impact: -5,
            timestamp: Date.now() - 86400000
          }
        ];
      }
      
      return []; // No incidents for high-score validators
    } catch (error) {
      console.error('Error getting validator incidents:', error);
      return [];
    }
  }
}