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
            risk_level: aiRecommendation.riskLevel
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
}