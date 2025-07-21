import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface ValidatorAnalysisData {
  validator_address: string;
  validator_name: string;
  staked_amount: string;
  mars_score: number;
  uptime_percentage: number;
  missed_blocks_24h: number;
  governance_participation: number;
  commission_rate: number;
  total_delegators: number;
  is_jailed: boolean;
  last_seen: string;
  voting_power_rank: number;
}

export interface AIRecommendation {
  validator_address: string;
  validator_name: string;
  staked_amount: string;
  mars_score: number;
  recommendation: string;
  risk_level: 'green' | 'yellow' | 'red';
  confidence_score: number;
  key_concerns: string[];
  suggested_actions: string[];
  callbacks: {
    unstake: string;
    redelegate: string;
    incidents: string;
  };
}

export interface AIAnalysisResult {
  delegations: AIRecommendation[];
  summary: string;
  total_at_risk: string;
  user_address: string;
  timestamp: string;
  ai_insights: {
    portfolio_risk_level: 'low' | 'moderate' | 'high' | 'critical';
    diversification_score: number;
    recommended_actions: string[];
    market_context: string;
  };
}

export class AIValidatorAnalyzer {
  
  async analyzeValidatorPortfolio(
    userAddress: string, 
    validatorData: ValidatorAnalysisData[]
  ): Promise<AIAnalysisResult> {
    
    // Prepare comprehensive data context for AI analysis
    const analysisContext = this.prepareAnalysisContext(validatorData);
    
    // Generate AI-powered recommendations for each validator
    const aiRecommendations = await this.generateValidatorRecommendations(validatorData);
    
    // Generate portfolio-level insights
    const portfolioInsights = await this.generatePortfolioInsights(validatorData, aiRecommendations);
    
    // Calculate risk metrics
    const riskMetrics = this.calculateRiskMetrics(aiRecommendations);
    
    return {
      delegations: aiRecommendations,
      summary: portfolioInsights.summary,
      total_at_risk: riskMetrics.totalAtRisk,
      user_address: userAddress,
      timestamp: new Date().toISOString(),
      ai_insights: {
        portfolio_risk_level: portfolioInsights.portfolioRiskLevel,
        diversification_score: portfolioInsights.diversificationScore,
        recommended_actions: portfolioInsights.recommendedActions,
        market_context: portfolioInsights.marketContext
      }
    };
  }

  private prepareAnalysisContext(validators: ValidatorAnalysisData[]): string {
    return validators.map(v => 
      `Validator: ${v.validator_name} (${v.validator_address})
      - Staked: ${v.staked_amount}
      - Mars² Score: ${v.mars_score}/100
      - Uptime: ${v.uptime_percentage}%
      - Missed Blocks (24h): ${v.missed_blocks_24h}
      - Governance Participation: ${v.governance_participation}%
      - Commission: ${v.commission_rate}%
      - Delegators: ${v.total_delegators}
      - Status: ${v.is_jailed ? 'JAILED' : 'Active'}
      - Voting Power Rank: #${v.voting_power_rank}`
    ).join('\n\n');
  }

  private async generateValidatorRecommendations(validators: ValidatorAnalysisData[]): Promise<AIRecommendation[]> {
    const prompt = `You are an expert blockchain staking advisor analyzing Sei network validators. 

Analyze these validator delegations and provide specific, actionable recommendations for each:

${this.prepareAnalysisContext(validators)}

For each validator, provide:
1. Risk assessment (green/yellow/red)
2. Confidence score (0-100)
3. Key concerns (specific issues to monitor)
4. Suggested actions (concrete next steps)
5. Plain English recommendation

Consider these factors:
- Mars² scores below 50 indicate high risk
- Jailed validators require immediate action
- High commission rates (>10%) reduce rewards
- Low governance participation suggests poor validator management
- Recent missed blocks indicate technical issues
- Voting power concentration affects decentralization

Respond with a JSON array of recommendations. Each recommendation should be practical and specific to that validator's situation.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert Sei blockchain staking advisor. Provide precise, actionable validator analysis in JSON format."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3 // Lower temperature for more consistent analysis
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
      
      // Transform AI response to our format
      return validators.map((validator, index) => {
        const aiRec = aiResponse.recommendations?.[index] || {};
        
        return {
          validator_address: validator.validator_address,
          validator_name: validator.validator_name,
          staked_amount: validator.staked_amount,
          mars_score: validator.mars_score,
          recommendation: aiRec.recommendation || this.getFallbackRecommendation(validator.mars_score),
          risk_level: aiRec.risk_level || this.getRiskLevel(validator.mars_score),
          confidence_score: aiRec.confidence_score || 85,
          key_concerns: aiRec.key_concerns || this.getDefaultConcerns(validator),
          suggested_actions: aiRec.suggested_actions || this.getDefaultActions(validator),
          callbacks: {
            unstake: `unstake_${validator.validator_name.toLowerCase().replace(/\s+/g, '_')}`,
            redelegate: `redelegate_${validator.validator_name.toLowerCase().replace(/\s+/g, '_')}`,
            incidents: `incidents_${validator.validator_name.toLowerCase().replace(/\s+/g, '_')}`
          }
        };
      });

    } catch (error) {
      console.error('AI recommendation generation failed:', error);
      // Fallback to enhanced rule-based recommendations
      return this.generateFallbackRecommendations(validators);
    }
  }

  private async generatePortfolioInsights(
    validators: ValidatorAnalysisData[], 
    recommendations: AIRecommendation[]
  ) {
    const prompt = `Analyze this Sei staking portfolio and provide strategic insights:

Portfolio Summary:
- Total Validators: ${validators.length}
- High Risk Validators: ${recommendations.filter(r => r.risk_level === 'red').length}
- Moderate Risk: ${recommendations.filter(r => r.risk_level === 'yellow').length}
- Safe Validators: ${recommendations.filter(r => r.risk_level === 'green').length}

Validator Details:
${this.prepareAnalysisContext(validators)}

Provide portfolio-level analysis including:
1. Overall risk assessment (low/moderate/high/critical)
2. Diversification quality (0-100 score)
3. Top 3 recommended actions for portfolio optimization
4. Market context and strategic considerations
5. Executive summary for the user

Focus on portfolio balance, risk management, and long-term staking strategy. Respond in JSON format.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a blockchain portfolio strategist specializing in Sei network staking optimization."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4
      });

      const insights = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        portfolioRiskLevel: insights.portfolio_risk_level || 'moderate',
        diversificationScore: insights.diversification_score || 75,
        recommendedActions: insights.recommended_actions || ['Monitor validator performance weekly'],
        marketContext: insights.market_context || 'Sei network is experiencing normal validator activity.',
        summary: insights.summary || this.generateFallbackSummary(recommendations)
      };

    } catch (error) {
      console.error('Portfolio insights generation failed:', error);
      return this.generateFallbackInsights(recommendations);
    }
  }

  private calculateRiskMetrics(recommendations: AIRecommendation[]) {
    const highRiskDelegations = recommendations.filter(r => r.risk_level === 'red');
    const totalAtRisk = highRiskDelegations.reduce((sum, r) => {
      const amount = parseFloat(r.staked_amount.replace(/[^\d.]/g, ''));
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    return {
      totalAtRisk: `${totalAtRisk.toLocaleString()} SEI`,
      highRiskCount: highRiskDelegations.length,
      averageConfidence: Math.round(
        recommendations.reduce((sum, r) => sum + r.confidence_score, 0) / recommendations.length
      )
    };
  }

  // Fallback methods for when AI calls fail
  private getFallbackRecommendation(score: number): string {
    if (score >= 80) return "🟢 Excellent validator with strong performance metrics. Continue staking with confidence.";
    if (score >= 50) return "🟡 Moderate risk validator. Monitor performance and consider reducing exposure.";
    return "🔴 High risk validator showing concerning metrics. Immediate action recommended.";
  }

  private getRiskLevel(score: number): 'green' | 'yellow' | 'red' {
    if (score >= 80) return 'green';
    if (score >= 50) return 'yellow';
    return 'red';
  }

  private getDefaultConcerns(validator: ValidatorAnalysisData): string[] {
    const concerns = [];
    if (validator.is_jailed) concerns.push("Validator is currently jailed");
    if (validator.mars_score < 50) concerns.push("Low Mars² security score");
    if (validator.uptime_percentage < 95) concerns.push("Below optimal uptime");
    if (validator.commission_rate > 10) concerns.push("High commission rate");
    if (validator.missed_blocks_24h > 10) concerns.push("Recent missed blocks");
    return concerns.length > 0 ? concerns : ["Regular monitoring recommended"];
  }

  private getDefaultActions(validator: ValidatorAnalysisData): string[] {
    if (validator.is_jailed || validator.mars_score < 50) {
      return ["Consider unstaking immediately", "Research alternative validators", "Monitor for improvements"];
    }
    if (validator.mars_score < 80) {
      return ["Monitor performance weekly", "Consider reducing stake size", "Diversify to other validators"];
    }
    return ["Continue current delegation", "Monitor monthly", "Consider increasing stake if performance remains strong"];
  }

  private generateFallbackRecommendations(validators: ValidatorAnalysisData[]): AIRecommendation[] {
    return validators.map(validator => ({
      validator_address: validator.validator_address,
      validator_name: validator.validator_name,
      staked_amount: validator.staked_amount,
      mars_score: validator.mars_score,
      recommendation: this.getFallbackRecommendation(validator.mars_score),
      risk_level: this.getRiskLevel(validator.mars_score),
      confidence_score: 85,
      key_concerns: this.getDefaultConcerns(validator),
      suggested_actions: this.getDefaultActions(validator),
      callbacks: {
        unstake: `unstake_${validator.validator_name.toLowerCase().replace(/\s+/g, '_')}`,
        redelegate: `redelegate_${validator.validator_name.toLowerCase().replace(/\s+/g, '_')}`,
        incidents: `incidents_${validator.validator_name.toLowerCase().replace(/\s+/g, '_')}`
      }
    }));
  }

  private generateFallbackSummary(recommendations: AIRecommendation[]): string {
    const highRisk = recommendations.filter(r => r.risk_level === 'red').length;
    if (highRisk === 0) {
      return "Your staking portfolio shows good risk management with no critical issues requiring immediate attention.";
    }
    return `Portfolio requires attention: ${highRisk} validator${highRisk > 1 ? 's' : ''} showing high risk metrics.`;
  }

  private generateFallbackInsights(recommendations: AIRecommendation[]) {
    const riskCounts = {
      red: recommendations.filter(r => r.risk_level === 'red').length,
      yellow: recommendations.filter(r => r.risk_level === 'yellow').length,
      green: recommendations.filter(r => r.risk_level === 'green').length
    };

    let portfolioRiskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    if (riskCounts.red > 0) portfolioRiskLevel = riskCounts.red > 1 ? 'critical' : 'high';
    else if (riskCounts.yellow > riskCounts.green) portfolioRiskLevel = 'moderate';

    return {
      portfolioRiskLevel,
      diversificationScore: Math.max(20, 100 - (riskCounts.red * 30) - (riskCounts.yellow * 10)),
      recommendedActions: riskCounts.red > 0 
        ? ['Review high-risk validators immediately', 'Consider redistributing stakes', 'Monitor validator status daily']
        : ['Maintain current strategy', 'Regular monthly reviews', 'Consider expanding to additional validators'],
      marketContext: 'Analysis completed using enhanced rule-based assessment due to AI service limitations.',
      summary: this.generateFallbackSummary(recommendations)
    };
  }
}