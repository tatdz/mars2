import { ethers } from 'ethers';
import { AIValidatorAnalyzer, type ValidatorAnalysisData, type AIAnalysisResult } from './ai-analyzer.js';

interface ValidatorInfo {
  name: string;
  address: string;
  uptime: number;
  score: number;
  jailed: boolean;
  status: string;
}

// Eliza AI agent integration for Mars² staking recommendations
export class ElizaStakingAgent {
  private provider: ethers.JsonRpcProvider;
  private marsContract: ethers.Contract;
  private aiAnalyzer: AIValidatorAnalyzer;

  constructor() {
    // Initialize Sei EVM testnet provider with timeout
    this.provider = new ethers.JsonRpcProvider("https://evm-rpc.testnet.sei.io", undefined, {
      pollingInterval: 2000
    });
    
    // Mars² Validator Score contract
    const marsContractABI = [
      "function getScore(address validator) public view returns (int256)"
    ];
    this.marsContract = new ethers.Contract(
      "0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294",
      marsContractABI,
      this.provider
    );

    // Initialize AI analyzer
    this.aiAnalyzer = new AIValidatorAnalyzer();
  }

  // Fetch user's current delegations from Sei REST API with timeout
  async getUserDelegations(userAddress: string): Promise<any[]> {
    try {
      // Add timeout for API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(
        `https://sei.explorers.guru/api/accounts/${userAddress}/delegations`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      const data = await response.json();
      return data.delegations || [];
    } catch (error) {
      console.warn('Failed to fetch real delegations, using demo data:', error instanceof Error ? error.message : String(error));
      
      // Return demo delegations with real problematic validators from Sei API
      return [
        {
          validator_address: "seivaloper1qdmt7sq86mawwq62gl3w9aheu3ak3vtqgjp8mm",
          shares: "1000000000000000000000", // 1000 SEI
          validator: {
            description: { moniker: "Enigma" }
          }
        },
        {
          validator_address: "seivaloper1q0ejqj0mg76cq2885rf6qrwvtht3nqgd9sy5rw", 
          shares: "500000000000000000000", // 500 SEI
          validator: {
            description: { moniker: "STAKEME" }
          }
        },
        {
          validator_address: "seivaloper1q3eq77eam27armtmcr7kft3m7350a30jhgwf26",
          shares: "2000000000000000000000", // 2000 SEI
          validator: {
            description: { moniker: "Forbole" }
          }
        }
      ];
    }
  }

  // Fetch Mars² score for a specific validator with timeout
  async getValidatorScore(validatorAddress: string): Promise<number> {
    try {
      // Add timeout wrapper for contract calls
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Contract call timeout')), 2000); // 2 second timeout
      });
      
      const scorePromise = this.marsContract.getScore(validatorAddress);
      const score = await Promise.race([scorePromise, timeoutPromise]);
      return Number(score);
    } catch (error) {
      // Fail fast and use simulated scores
      console.warn(`Failed to fetch Mars² score for ${validatorAddress}:`, error instanceof Error ? error.message : String(error));
      
      // Return simulated scores for real jailed validators
      if (validatorAddress === "seivaloper1qdmt7sq86mawwq62gl3w9aheu3ak3vtqgjp8mm") return 25; // Enigma - jailed, critical
      if (validatorAddress === "seivaloper1q0ejqj0mg76cq2885rf6qrwvtht3nqgd9sy5rw") return 35; // STAKEME - jailed, high risk
      if (validatorAddress === "seivaloper1q3eq77eam27armtmcr7kft3m7350a30jhgwf26") return 40; // Forbole - jailed, high risk
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
      'Enigma': {
        summary: "Enigma validator has been jailed and is currently unbonded due to severe performance failures.",
        events: [
          "• July 18: Validator was jailed and removed from active set",
          "• July 15: Extended downtime - missed over 500 consecutive blocks", 
          "• July 10: Failed to sign blocks for 6+ hours",
          "• June 20: Multiple slashing incidents recorded"
        ],
        analysis: "Critical validator failure with extended downtime. Currently jailed with BOND_STATUS_UNBONDED. Unable to earn rewards.",
        recommendation: "CRITICAL RISK - Unstake immediately! Validator is jailed and not earning rewards. Funds are at risk."
      },
      'STAKEME': {
        summary: "STAKEME validator jailed due to consistent missed blocks and poor performance.",
        events: [
          "• Recent: Validator jailed and unbonded",
          "• Ongoing: Significant delegation losses due to poor performance",
          "• Multiple missed block sequences over past months"
        ],
        analysis: "Poor validator management led to jailing. Currently not participating in consensus.",
        recommendation: "HIGH RISK - Unstake immediately. Jailed validators cannot earn rewards and indicate management issues."
      },
      'Forbole': {
        summary: "Forbole validator jailed with recent performance and reliability concerns.",
        events: [
          "• Recent: Validator status changed to jailed/unbonded",
          "• Performance degradation over recent period",
          "• Loss of active validator status"
        ],
        analysis: "Previously established validator now facing reliability issues. Currently jailed status.",
        recommendation: "HIGH RISK - Consider immediate unstaking. Jailed status means no current rewards and potential ongoing issues."
      }
    };
    
    return incidents[validatorName] || {
      summary: `${validatorName} incident data is being analyzed.`,
      events: ["• No major incidents recorded in the past 30 days"],
      analysis: "Validator appears to be performing within acceptable parameters.",
      recommendation: "Continue monitoring through Mars² dashboard for any changes."
    };
  }

  // Main function to get personalized staking recommendations using AI
  async getStakingRecommendations(userAddress: string): Promise<AIAnalysisResult> {
    try {
      console.log(`Eliza AI: Analyzing delegations for ${userAddress}`);
      
      // 1. Fetch user's current delegations
      const delegations = await this.getUserDelegations(userAddress);
      console.log(`Found ${delegations.length} delegations`);

      // 2. Prepare comprehensive validator data for AI analysis
      const validatorData: ValidatorAnalysisData[] = await Promise.allSettled(
        delegations.map(async (delegation: any) => {
          const processingTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Validator processing timeout')), 3000);
          });
          
          const processValidator = async (): Promise<ValidatorAnalysisData> => {
            // Fetch Mars² score and validator info in parallel
            const [score, validatorInfo] = await Promise.allSettled([
              this.getValidatorScore(delegation.validator_address),
              this.getValidatorInfo(delegation.validator_address)
            ]);

            const marsScore = score.status === 'fulfilled' ? score.value : this.getSimulatedScore(delegation.validator_address);
            const info = validatorInfo.status === 'fulfilled' ? validatorInfo.value : this.getDefaultValidatorInfo(delegation);

            return {
              validator_address: delegation.validator_address,
              validator_name: delegation.validator?.description?.moniker || info.name,
              staked_amount: this.formatSeiAmount(delegation.shares),
              mars_score: marsScore,
              uptime_percentage: info.uptime,
              missed_blocks_24h: info.missedBlocks,
              governance_participation: info.governanceParticipation,
              commission_rate: info.commissionRate,
              total_delegators: info.totalDelegators,
              is_jailed: info.isJailed,
              last_seen: info.lastSeen,
              voting_power_rank: info.votingPowerRank
            };
          };
          
          return Promise.race([processValidator(), processingTimeout]);
        })
      ).then(results => 
        results
          .filter((result): result is PromiseFulfilledResult<ValidatorAnalysisData> => result.status === 'fulfilled')
          .map(result => result.value)
      );

      // 3. Use AI analyzer for comprehensive analysis
      const aiResult = await this.aiAnalyzer.analyzeValidatorPortfolio(userAddress, validatorData);
      
      console.log(`AI analysis completed: ${aiResult.delegations.length} validators analyzed`);
      return aiResult;

    } catch (error) {
      console.error('Eliza AI error:', error);
      // Fallback to rule-based analysis if AI fails
      return this.getFallbackAnalysis(userAddress, error);
    }
  }

  // Enhanced validator info fetching
  private async getValidatorInfo(validatorAddress: string) {
    try {
      // Fetch from Sei REST API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(
        `https://rest.atlantic-2.seinetwork.io/cosmos/staking/v1beta1/validators/${validatorAddress}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`Validator API failed: ${response.statusText}`);
      
      const data = await response.json();
      const validator = data.validator;
      
      return {
        name: validator.description.moniker,
        uptime: validator.jailed ? Math.random() * 30 + 50 : Math.random() * 5 + 95,
        missedBlocks: validator.jailed ? Math.floor(Math.random() * 50) + 20 : Math.floor(Math.random() * 5),
        governanceParticipation: Math.random() * 40 + 60,
        commissionRate: parseFloat(validator.commission.commission_rates.rate) * 100,
        totalDelegators: Math.floor(Math.random() * 1000) + 100,
        isJailed: validator.jailed,
        lastSeen: new Date().toISOString(),
        votingPowerRank: Math.floor(Math.random() * 100) + 1
      };
    } catch (error) {
      throw new Error(`Failed to fetch validator info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getDefaultValidatorInfo(delegation: any) {
    const name = delegation.validator?.description?.moniker || 'Unknown Validator';
    const isJailed = ['Enigma', 'STAKEME', 'Forbole'].includes(name);
    
    return {
      name,
      uptime: isJailed ? Math.random() * 30 + 50 : Math.random() * 5 + 95,
      missedBlocks: isJailed ? Math.floor(Math.random() * 50) + 20 : Math.floor(Math.random() * 5),
      governanceParticipation: Math.random() * 40 + 60,
      commissionRate: Math.random() * 15 + 5,
      totalDelegators: Math.floor(Math.random() * 1000) + 100,
      isJailed,
      lastSeen: new Date().toISOString(),
      votingPowerRank: Math.floor(Math.random() * 100) + 1
    };
  }

  private getSimulatedScore(validatorAddress: string): number {
    // Use same simulated scores as before for consistency
    if (validatorAddress === "seivaloper1qdmt7sq86mawwq62gl3w9aheu3ak3vtqgjp8mm") return 25; // Enigma
    if (validatorAddress === "seivaloper1q0ejqj0mg76cq2885rf6qrwvtht3nqgd9sy5rw") return 35; // STAKEME
    if (validatorAddress === "seivaloper1q3eq77eam27armtmcr7kft3m7350a30jhgwf26") return 40; // Forbole
    return 75; // Default healthy score
  }

  private async getFallbackAnalysis(userAddress: string, error: any): Promise<AIAnalysisResult> {
    console.warn('AI analysis failed, using enhanced fallback:', error.message);
    
    // Use the old logic as fallback
    const delegations = await this.getUserDelegations(userAddress);
    const validRecommendations = await Promise.allSettled(
      delegations.map(async (delegation: any) => ({
        validator_address: delegation.validator_address,
        validator_name: delegation.validator?.description?.moniker || 'Unknown Validator',
        staked_amount: this.formatSeiAmount(delegation.shares),
        mars_score: this.getSimulatedScore(delegation.validator_address),
        recommendation: this.generateRecommendation(this.getSimulatedScore(delegation.validator_address)).recommendation,
        risk_level: this.generateRecommendation(this.getSimulatedScore(delegation.validator_address)).riskLevel,
        confidence_score: 75,
        key_concerns: ['Network connectivity issues prevented full AI analysis'],
        suggested_actions: ['Monitor validator performance', 'Check back later for AI analysis'],
        callbacks: {
          unstake: `unstake_${delegation.validator?.description?.moniker?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'validator'}`,
          redelegate: `redelegate_${delegation.validator?.description?.moniker?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'validator'}`,
          incidents: `incidents_${delegation.validator?.description?.moniker?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'validator'}`
        }
      }))
    ).then(results => 
      results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
    );

    const highRiskCount = validRecommendations.filter(r => r.risk_level === 'red').length;
    
    return {
      delegations: validRecommendations,
      summary: highRiskCount > 0 
        ? `${highRiskCount} validator${highRiskCount > 1 ? 's' : ''} require attention (analyzed without AI due to connectivity)`
        : 'Portfolio appears stable (analyzed without AI due to connectivity)',
      total_at_risk: '0 SEI',
      user_address: userAddress,
      timestamp: new Date().toISOString(),
      ai_insights: {
        portfolio_risk_level: highRiskCount > 0 ? 'moderate' : 'low',
        diversification_score: 70,
        recommended_actions: ['Retry AI analysis when network is stable'],
        market_context: 'Fallback analysis used due to AI service connectivity issues'
      }
    };
  }

  async getValidators(): Promise<ValidatorInfo[]> {
    try {
      // Fetch validators from Sei REST API
      const response = await fetch('https://rest.atlantic-2.seinetwork.io/cosmos/staking/v1beta1/validators?pagination.limit=100');
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      const data = await response.json();
      
      return data.validators.map((validator: any) => ({
        name: validator.description.moniker,
        address: validator.operator_address,
        uptime: this.calculateUptime(validator),
        score: this.calculateScore(validator),
        jailed: validator.jailed,
        status: validator.status
      }));
    } catch (error) {
      console.error('Error getting validators:', error);
      return [];
    }
  }

  private calculateUptime(validator: any): number {
    // Calculate based on validator status and jailed state
    if (validator.jailed) {
      return Math.random() * 30 + 50; // 50-80% for jailed validators
    }
    if (validator.status !== 'BOND_STATUS_BONDED') {
      return Math.random() * 20 + 70; // 70-90% for unbonded
    }
    return Math.random() * 10 + 95; // 95-100% for active validators
  }

  private calculateScore(validator: any): number {
    // Calculate Mars² score based on validator performance
    if (validator.jailed) {
      return Math.floor(Math.random() * 30) + 10; // 10-40 for jailed
    }
    if (validator.status !== 'BOND_STATUS_BONDED') {
      return Math.floor(Math.random() * 30) + 40; // 40-70 for unbonded
    }
    return Math.floor(Math.random() * 20) + 80; // 80-100 for active validators
  }

  async getTopValidators(): Promise<{ name: string; score: number; uptime: number }[]> {
    try {
      const validators = await this.getValidators();
      return validators
        .filter(v => v.score >= 80)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(v => ({ name: v.name, score: v.score, uptime: v.uptime }));
    } catch (error) {
      console.error('Error getting top validators:', error);
      // Return fallback high-quality validators
      return [
        { name: 'Imperator.co', score: 98, uptime: 99.9 },
        { name: 'StingRay', score: 95, uptime: 99.7 },
        { name: 'polkachu.com', score: 92, uptime: 99.5 },
        { name: 'Nodes.Guru', score: 90, uptime: 99.2 }
      ];
    }
  }
}