import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ConversationSession {
  sessionId: string;
  validatorAddress: string;
  validatorName: string;
  messages: ConversationMessage[];
  lastActivity: number;
  validatorContext?: any;
}

export class OllamaConversationAI {
  private sessions: Map<string, ConversationSession> = new Map();
  private ollamaAvailable = false;
  
  constructor() {
    this.initializeOllama();
  }

  private async initializeOllama(): Promise<void> {
    try {
      // Check if Ollama is available
      await execAsync('ollama --version');
      
      // Start Ollama service in background
      console.log('Starting Ollama service...');
      exec('OLLAMA_HOST=0.0.0.0:11434 ollama serve > /dev/null 2>&1', (error) => {
        if (error) {
          console.warn('Ollama service start failed:', error.message);
        }
      });
      
      // Set optimistic availability - we'll check on each request
      this.ollamaAvailable = true;
      console.log('Ollama initialization completed, using dynamic availability checking');
      
      // Try to pull llama3 model in background
      setTimeout(async () => {
        try {
          const { stdout } = await execAsync('ollama list');
          if (!stdout.includes('llama3')) {
            console.log('Pulling Llama3 model in background...');
            exec('ollama pull llama3:8b > /dev/null 2>&1');
          }
        } catch (error) {
          console.warn('Could not check Llama3 model:', error);
        }
      }, 5000);
      
    } catch (error) {
      console.warn('Ollama not available, using fallback AI responses');
      this.ollamaAvailable = false;
    }
  }

  async createConversation(validatorAddress: string, validatorName: string, validatorContext?: any): Promise<string> {
    const sessionId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: ConversationSession = {
      sessionId,
      validatorAddress,
      validatorName,
      messages: [],
      lastActivity: Date.now(),
      validatorContext
    };

    // Add system context message
    const systemMessage: ConversationMessage = {
      role: 'system',
      content: this.buildSystemPrompt(validatorName, validatorAddress, validatorContext),
      timestamp: Date.now()
    };
    
    session.messages.push(systemMessage);
    this.sessions.set(sessionId, session);
    
    return sessionId;
  }

  async sendMessage(sessionId: string, userMessage: string): Promise<ConversationMessage> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Conversation session not found');
    }

    // Add user message
    const userMsg: ConversationMessage = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    session.messages.push(userMsg);
    session.lastActivity = Date.now();

    // Generate AI response
    let aiResponse: string;
    
    // Always try Ollama first if theoretically available, fallback on any error
    try {
      if (this.ollamaAvailable) {
        aiResponse = await this.generateOllamaResponse(session.messages);
      } else {
        throw new Error('Ollama not initialized');
      }
    } catch (error) {
      console.log('Using enhanced fallback AI response for:', userMessage);
      aiResponse = await this.generateFallbackResponse(userMessage, session);
    }

    const assistantMsg: ConversationMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: Date.now()
    };
    
    session.messages.push(assistantMsg);
    return assistantMsg;
  }

  private async generateOllamaResponse(messages: ConversationMessage[]): Promise<string> {
    // Format messages for Ollama API
    const conversationText = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const systemContext = messages.find(msg => msg.role === 'system')?.content || '';
    
    const prompt = `${systemContext}\n\nConversation:\n${conversationText}\nassistant:`;
    
    try {
      // Use Ollama HTTP API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3:8b',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            num_predict: 500
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API responded with status: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.response?.trim();
      
      if (!aiResponse) {
        throw new Error('Empty response from Ollama');
      }
      
      console.log('Ollama generated response successfully');
      return aiResponse;
    } catch (error) {
      console.warn('Ollama API call failed, using fallback:', error instanceof Error ? error.message : String(error));
      throw new Error(`Ollama generation failed: ${error}`);
    }
  }

  private async generateFallbackResponse(userMessage: string, session: ConversationSession): Promise<string> {
    const lowerMessage = userMessage.toLowerCase();
    const validatorName = session.validatorName;
    const validatorContext = session.validatorContext;

    // Educational responses about staking terms
    if (lowerMessage.includes('jailed') || lowerMessage.includes('jail')) {
      return `**Validator Jailing on Sei Network**

When a validator is "jailed," it means they've been temporarily removed from the active validator set due to poor performance or misbehavior.

**What causes jailing:**
• Missing too many blocks (downtime)
• Double-signing (security violation)
• Network protocol violations

**Impact on ${validatorName}:**
${validatorContext?.jailed ? 
  `• This validator is currently JAILED\n• Your staked tokens are NOT earning rewards\n• The validator cannot participate in consensus` :
  `• This validator is currently active\n• Your tokens are earning rewards normally`}

**What you should do:**
${validatorContext?.jailed ? 
  `• UNSTAKE immediately - jailed validators don't earn rewards\n• Redelegate to an active, healthy validator\n• Monitor for unjailing announcements` :
  `• Continue monitoring validator performance\n• Watch for any jailing events in the future`}

**Unjailing process:**
• Validator must fix the underlying issue
• Wait for the minimum jail time (varies by offense)
• Submit an unjail transaction
• Resume normal operations if successful

Would you like to know more about any specific aspect of validator jailing?`;
    }

    if (lowerMessage.includes('inactive') || lowerMessage.includes('unbonded')) {
      return `**Validator Status: Inactive/Unbonded**

An "inactive" or "unbonded" validator is not participating in consensus and block production.

**Validator Statuses on Sei:**
• **BONDED**: Active, earning rewards, participating in consensus
• **UNBONDING**: Leaving active set, 14-day unbonding period
• **UNBONDED**: Inactive, not earning rewards

**For ${validatorName}:**
${validatorContext?.status === 'BOND_STATUS_BONDED' ? 
  `• Status: ACTIVE (Bonded)\n• Currently earning rewards\n• Participating in network consensus` :
  `• Status: INACTIVE (${validatorContext?.status || 'Unknown'})\n• NOT earning rewards\n• Not participating in consensus`}

**Common reasons for inactive status:**
• Insufficient delegation (below minimum threshold)
• Voluntary exit from active set
• Technical issues or maintenance
• Slashing penalties

**What this means for your stake:**
${validatorContext?.status === 'BOND_STATUS_BONDED' ? 
  `• Your tokens are earning staking rewards\n• Validator is performing network duties` :
  `• Your tokens are NOT earning rewards\n• Consider redelegating to an active validator`}

Would you like to learn about redelegation or other validator topics?`;
    }

    if (lowerMessage.includes('commission') || lowerMessage.includes('fee')) {
      const commissionRate = validatorContext?.performanceMetrics?.commissionRate || 'unknown';
      return `**Validator Commission Rates**

Commission is the percentage of rewards that validators keep for operating their infrastructure.

**${validatorName} Commission Details:**
• Current Rate: ${commissionRate}%
• Max Rate: ${validatorContext?.commission?.commission_rates?.max_rate ? (parseFloat(validatorContext.commission.commission_rates.max_rate) * 100).toFixed(1) + '%' : 'Unknown'}
• Daily Change Limit: ${validatorContext?.commission?.commission_rates?.max_change_rate ? (parseFloat(validatorContext.commission.commission_rates.max_change_rate) * 100).toFixed(1) + '%' : 'Unknown'}

**How Commission Works:**
• You earn: (Total Rewards) × (100% - Commission Rate)
• Validator keeps: (Total Rewards) × Commission Rate
• Example: 10% commission = you get 90% of rewards

**Typical Commission Ranges:**
• Low: 0-5% (competitive, delegator-friendly)
• Medium: 5-10% (balanced)
• High: 10-20% (less competitive)
• Very High: 20%+ (avoid unless exceptional service)

**Commission Rate Analysis:**
${parseFloat(commissionRate) <= 5 ? 
  '✅ This is a competitive, delegator-friendly rate' :
  parseFloat(commissionRate) <= 10 ?
  '⚠️ Moderate rate, acceptable for quality service' :
  '🚨 High commission rate - compare with alternatives'}

Remember: Lower commission = more rewards for you, but consider validator reliability too!

Any other questions about commissions or validator economics?`;
    }

    if (lowerMessage.includes('slashing') || lowerMessage.includes('slash')) {
      return `**Slashing on Sei Network**

Slashing is a penalty mechanism that reduces staked tokens for validator misbehavior.

**Types of Slashing:**
1. **Downtime Slashing** (0.01%)
   • Missing blocks for extended periods
   • Relatively minor penalty
   
2. **Double-Sign Slashing** (5%)
   • Signing conflicting blocks (major violation)
   • Severe penalty + permanent jailing

**For ${validatorName}:**
${validatorContext?.jailed ? 
  `• This validator was recently jailed\n• Check if slashing occurred\n• Your stake may have been reduced` :
  `• No recent slashing events detected\n• Validator appears to be operating safely`}

**How Slashing Affects You:**
• Your delegated tokens can be reduced
• Slashing applies to ALL delegators
• No way to recover slashed tokens
• Jailing prevents further rewards

**Protection Strategies:**
• Diversify across multiple validators
• Monitor validator performance regularly
• Use Mars² scoring system for risk assessment
• Avoid validators with poor track records

**Slashing vs Jailing:**
• Slashing = actual token reduction
• Jailing = temporary removal from active set
• Both can happen simultaneously

Would you like to know more about protecting your stake or validator selection strategies?`;
    }

    if (lowerMessage.includes('unstake') || lowerMessage.includes('undelegate')) {
      return `**Unstaking (Undelegating) on Sei**

Unstaking removes your tokens from a validator and returns them to your wallet.

**Unstaking Process:**
1. **Submit Undelegate Transaction**
   • Choose amount to unstake
   • Pay transaction fee (~0.1 SEI)
   
2. **Unbonding Period: 21 Days**
   • Tokens are locked and cannot be moved
   • No rewards earned during this period
   • Cannot cancel once started

3. **Tokens Returned**
   • Available in wallet after 21 days
   • Can be freely transferred or restaked

**For ${validatorName}:**
${validatorContext?.jailed ? 
  `🚨 **RECOMMENDED ACTION: UNSTAKE IMMEDIATELY**\n• Validator is jailed - not earning rewards\n• Your tokens are at risk\n• 21-day unbonding period starts now` :
  validatorContext?.riskLevel === 'red' ?
  `⚠️ **CONSIDER UNSTAKING**\n• High risk validator\n• Consider partial unstaking\n• Monitor closely if keeping stake` :
  `• Validator appears healthy\n• Unstaking not urgently needed\n• Your choice based on strategy`}

**Unstaking vs Redelegating:**
• **Unstaking**: 21-day wait, tokens return to wallet
• **Redelegating**: Instant move to another validator

**When to Unstake:**
• Validator is jailed or unreliable
• You want to exit staking entirely
• Planning to use tokens elsewhere

Would you like specific guidance on the unstaking process or help choosing alternative validators?`;
    }

    if (lowerMessage.includes('redelegate') || lowerMessage.includes('move')) {
      return `**Redelegation on Sei Network**

Redelegation moves your stake from one validator to another without waiting.

**Redelegation Benefits:**
• **Instant**: No 14-day unbonding period
• **No Downtime**: Continue earning rewards
• **Risk Mitigation**: Move away from problematic validators

**Redelegation Process:**
1. Choose destination validator
2. Submit redelegation transaction
3. Stake moves immediately
4. Start earning from new validator instantly

**For ${validatorName}:**
${validatorContext?.jailed ? 
  `🚨 **URGENT: REDELEGATE IMMEDIATELY**\n• This validator is jailed\n• Move to active validator now\n• Recommended alternatives: Imperator.co, StingRay, polkachu.com` :
  validatorContext?.riskLevel === 'red' ?
  `⚠️ **CONSIDER REDELEGATING**\n• High risk validator\n• Move to safer alternative\n• Mars² score suggests caution` :
  `• Current validator appears stable\n• Redelegation not urgently needed\n• Could diversify for better risk management`}

**Redelegation Limits:**
• Can only redelegate from same validator once per 21 days
• No limit on total redelegations
• Choose destination carefully

**Best Practices:**
• Research destination validator thoroughly
• Check commission rates and performance
• Consider diversifying across multiple validators
• Use Mars² scores for guidance

**Recommended Target Validators:**
• Green score (80+): Imperator.co, StingRay, polkachu.com
• Low commission (0-5%)
• Consistent uptime (99%+)

Would you like help selecting a specific validator to redelegate to?`;
    }

    if (lowerMessage.includes('score') || lowerMessage.includes('mars')) {
      return `**Mars² Scoring System**

Mars² provides a 0-100 risk assessment score for each validator based on multiple factors.

**Scoring Methodology:**
• **Performance Metrics** (40%): Uptime, missed blocks, response time
• **Economic Factors** (30%): Commission rates, self-delegation
• **Governance** (20%): Voting participation, proposal quality
• **Security Events** (10%): Slashing history, jailing incidents

**For ${validatorName}:**
• **Current Score**: ${validatorContext?.currentScore || 'Unknown'}
• **Risk Level**: ${validatorContext?.riskLevel?.toUpperCase() || 'Unknown'}
• **Performance**: ${validatorContext?.performanceMetrics?.uptime || 'Unknown'}% uptime

**Score Interpretation:**
• **80-100** 🟢: Excellent, safe to stake
• **60-79** 🟡: Good, monitor regularly
• **40-59** 🟠: Moderate risk, consider alternatives
• **0-39** 🔴: High risk, unstake/redelegate

**What Affects Scores:**
• **Positive**: High uptime, low commission, active governance
• **Negative**: Missed blocks, jailing, high fees, poor governance

**Recent Score Changes:**
${validatorContext?.events?.length > 0 ? 
  validatorContext.events.map((event: any) => `• ${event.label}: ${event.delta > 0 ? '+' : ''}${event.delta} points`).join('\n') :
  '• No recent significant events detected'}

**Using Mars² Scores:**
• Check scores before delegating
• Monitor weekly for changes
• Redelegate if score drops below 60
• Diversify across high-scoring validators

Want to learn more about specific scoring factors or validator comparison strategies?`;
    }

    // General incidents and performance
    if (lowerMessage.includes('incident') || lowerMessage.includes('performance') || lowerMessage.includes('what happened')) {
      const incidents = validatorContext?.events || [];
      return `**${validatorName} Incident Analysis**

Based on onchain data and performance monitoring, here's what I found:

**Current Status:**
• Score: ${validatorContext?.currentScore || 'Unknown'}
• Risk Level: ${validatorContext?.riskLevel?.toUpperCase() || 'Unknown'}
• Jailed: ${validatorContext?.jailed ? 'Yes' : 'No'}
• Status: ${validatorContext?.status || 'Unknown'}

**Recent Incidents (${incidents.length} total):**
${incidents.length > 0 ? 
  incidents.map((incident: any, i: number) => 
    `${i+1}. **${incident.label || incident.type}**\n   • Impact: ${incident.delta || incident.scoreImpact} points\n   • When: ${new Date(incident.timestamp).toLocaleDateString()}\n   • Type: ${incident.type || 'General'}`
  ).join('\n\n') :
  '• No significant incidents detected in recent monitoring'}

**Performance Metrics:**
• Uptime: ${validatorContext?.performanceMetrics?.uptime || 'Unknown'}%
• Missed Blocks: ${validatorContext?.performanceMetrics?.missedBlocks || 'Unknown'}
• Commission: ${validatorContext?.performanceMetrics?.commissionRate || 'Unknown'}%

**Recommendation:**
${validatorContext?.riskLevel === 'red' ? 
  '🚨 **IMMEDIATE ACTION REQUIRED**\n• Unstake or redelegate immediately\n• Validator poses significant risk to your stake' :
  validatorContext?.riskLevel === 'yellow' ?
  '⚠️ **MONITOR CLOSELY**\n• Consider reducing exposure\n• Watch for further deterioration' :
  '✅ **CONTINUE MONITORING**\n• Validator appears stable\n• Regular monitoring recommended'}

Would you like more details about any specific incident or guidance on next steps?`;
    }

    // Enhanced fallback responses for broader questions
    if (lowerMessage.includes('best validator') || lowerMessage.includes('choose validator') || lowerMessage.includes('recommend validator')) {
      return `**How to Choose the Best Validators on Sei**

Using Mars² scoring system, here's how to identify top validators:

**Mars² Scoring Criteria (0-100):**
• **Green (80+)**: Excellent performance, safe to stake
• **Yellow (60-79)**: Good validators, monitor regularly  
• **Red (<60)**: High risk, avoid or unstake

**Top Validator Characteristics:**
• **High Uptime**: 99%+ block signing rate
• **Low Commission**: 0-7% (more rewards for you)
• **Active Governance**: Participates in proposals
• **Community Presence**: Responsive, transparent
• **Technical Reliability**: Proper infrastructure

**For ${validatorName}:**
• **Current Score**: ${validatorContext?.currentScore || 'Unknown'}
• **Risk Level**: ${validatorContext?.riskLevel?.toUpperCase() || 'Unknown'}
• **Status**: ${validatorContext?.status === 'BOND_STATUS_BONDED' ? 'ACTIVE' : 'INACTIVE'}

**Diversification Strategy:**
• Spread stake across 3-5 green validators
• Mix commission rates (0%, 5%, 7%)
• Include both large and mid-size validators
• Monitor Mars² scores weekly

**Red Flags to Avoid:**
• Frequent jailing events
• Commission rate increases
• Poor governance participation
• Technical downtime patterns

Want specific validator recommendations or help analyzing current performance?`;
    }

    if (lowerMessage.includes('mars') && (lowerMessage.includes('contract') || lowerMessage.includes('smart contract') || lowerMessage.includes('how it works'))) {
      return `**Mars² Smart Contract System**

Mars² uses three deployed smart contracts on Sei EVM testnet:

**1. MarsValidatorScore Contract**
• **Address**: 0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294
• **Purpose**: Stores validator risk scores (0-100)
• **Functions**: getScore(), updateScore(), getEvents()
• **Methodology**: Analyzes uptime, governance, commission, incidents

**2. MarsZkAttest Contract**
• **Address**: 0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae  
• **Purpose**: Anonymous incident reporting with ZK-proofs
• **Features**: Nullifier generation, Sybil resistance
• **Privacy**: Zero-knowledge attestations

**3. MarsValidatorGroupMessages Contract**
• **Address**: 0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950
• **Purpose**: Encrypted group messaging for validators
• **Security**: AES-256 encryption simulation
• **Use Cases**: Coordination, alerts, governance discussions

**How Mars² Scoring Works:**
1. **Data Collection**: Real-time Sei network monitoring
2. **Performance Analysis**: Uptime, missed blocks, response time
3. **Economic Factors**: Commission rates, self-delegation
4. **Governance Scoring**: Voting participation, proposal quality
5. **Incident Integration**: Anonymous reports affect scores
6. **Smart Contract Updates**: Automated score updates

**Integration with Sei:**
• Reads validator data from Sei REST API
• Monitors on-chain events and transactions
• Cross-references with community reports
• Updates scores based on performance metrics

Want to know more about a specific contract or the scoring methodology?`;
    }

    if (lowerMessage.includes('sei') && (lowerMessage.includes('what is') || lowerMessage.includes('explain') || lowerMessage.includes('how does'))) {
      return `**Sei Blockchain Overview**

Sei is a high-performance, Cosmos-based blockchain with EVM compatibility designed for DeFi applications.

**Key Features:**
• **Consensus**: Tendermint BFT with ~100 validators
• **EVM Compatible**: Run Ethereum smart contracts
• **Fast Finality**: ~600ms block times
• **Cosmos SDK**: IBC compatibility with other chains
• **Testnet**: Atlantic-2 (current testing environment)

**Staking Mechanism:**
• **Token**: SEI (6 decimal places)
• **Validator Set**: ~100 active validators
• **Delegation**: Stake to validators for rewards
• **Unbonding**: 21-day period for unstaking
• **Slashing**: 0.01% (downtime), 5% (double-signing)

**How Validators Work:**
1. **Block Production**: Validators take turns proposing blocks
2. **Consensus**: Byzantine Fault Tolerant voting
3. **Rewards**: Block rewards + transaction fees
4. **Commission**: Validators keep percentage, rest to delegators

**Mars² Integration:**
• **Enhanced Security**: Real-time validator monitoring
• **Risk Assessment**: 0-100 scoring system
• **Anonymous Reporting**: Community-driven incident alerts
• **Smart Contracts**: On-chain validator data and scoring

**Governance:**
• **Proposals**: Network upgrades, parameter changes
• **Voting**: Validators and delegators participate
• **Implementation**: Automated execution of passed proposals

**For ${validatorName}:**
This validator is ${validatorContext?.status === 'BOND_STATUS_BONDED' ? 'actively participating' : 'currently inactive'} in Sei consensus with a Mars² score of ${validatorContext?.currentScore || 'unknown'}.

Would you like to learn more about Sei staking mechanics or validator operations?`;
    }

    // Default educational response
    return `**Welcome to Mars² Validator Education**

I'm your AI assistant for understanding Sei staking and ${validatorName} specifically.

**Popular Questions:**
• **"What are the best validators on Sei?"** - Validator selection guide
• **"Explain Mars² smart contracts"** - How our platform works
• **"What is Sei blockchain?"** - Network overview and features
• **"Why is this validator jailed/inactive?"** - Status explanations
• **"What's a good commission rate?"** - Fee analysis
• **"Should I unstake or redelegate?"** - Personalized advice
• **"How does slashing work?"** - Risk explanations

**About ${validatorName}:**
• **Address**: ${session.validatorAddress}
• **Current Status**: ${validatorContext?.status === 'BOND_STATUS_BONDED' ? 'ACTIVE (Earning Rewards)' : 'INACTIVE (No Rewards)'}
• **Mars² Score**: ${validatorContext?.currentScore || 'Unknown'} (${validatorContext?.riskLevel?.toUpperCase() || 'Unknown'} Risk)

**How to Get Help:**
• Ask specific questions about staking concepts
• Request validator comparisons and recommendations  
• Get guidance on unstaking, redelegation, or risk management
• Learn about Mars² platform features and smart contracts

What would you like to learn about Sei staking or validator analysis?`;
  }

  getSession(sessionId: string): ConversationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  private buildSystemPrompt(validatorName: string, validatorAddress: string, validatorContext?: any): string {
    return `You are an expert Mars² AI assistant specializing in Sei blockchain staking security and validator analysis. You help users understand staking concepts and the Mars² platform while analyzing the specific validator "${validatorName}" (${validatorAddress}).

MARS² PLATFORM OVERVIEW:
Mars² is a real-time staking security explorer for Sei EVM testnet featuring:
- **Color-Coded Risk Scoring**: Green (80+) = Safe, Yellow (60-79) = Caution, Red (<60) = High Risk
- **Smart Contracts**: MarsValidatorScore (0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294), MarsZkAttest (0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae), MarsValidatorGroupMessages (0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950)
- **Anonymous Reporting**: ZK-proof based incident reporting with nullifier generation
- **Encrypted Messaging**: On-chain group messaging with AES-256 encryption
- **AI-Powered Analysis**: Real-time incident analysis and staking recommendations

SEI NETWORK FUNDAMENTALS:
- **Network**: Cosmos-based with EVM compatibility (Atlantic-2 testnet)
- **Consensus**: Tendermint BFT with ~100 validators
- **Staking Token**: SEI (6 decimal places)
- **Unbonding Period**: 21 days (tokens locked during unstaking)
- **Slashing Penalties**: 0.01% for downtime, 5% for double-signing
- **Commission**: Validator-set rates (typically 5-10%)
- **Block Time**: ~600ms average
- **Governance**: On-chain with validator/delegator participation

CURRENT VALIDATOR CONTEXT:
- **Validator**: ${validatorName}
- **Address**: ${validatorAddress}
- **Mars² Score**: ${validatorContext?.score || 'Unknown'}
- **Risk Level**: ${validatorContext?.riskLevel || 'Unknown'}
- **Status**: ${validatorContext?.status || 'Unknown'}
- **Full Context**: ${validatorContext ? JSON.stringify(validatorContext, null, 2) : 'Limited data available'}

STAKING MECHANICS ON SEI:
- **Delegation**: Stake SEI to validators for block rewards and transaction fees
- **Redelegation**: Instant move between validators (once per 21 days per pair)
- **Undelegation**: 21-day unbonding period with no rewards
- **Rewards**: Auto-compounding based on performance and commission
- **Jailing**: Validators removed for poor performance (must unjail manually)
- **Slashing**: Token reduction for misbehavior affecting all delegators

VALIDATOR STATUS MEANINGS:
- **BOND_STATUS_BONDED**: Active, earning rewards, participating in consensus
- **BOND_STATUS_UNBONDING**: Leaving active set (21-day period)
- **BOND_STATUS_UNBONDED**: Inactive, not earning rewards
- **Jailed**: Temporarily removed for violations (downtime, double-signing)

MARS² BEST PRACTICES:
- Diversify across multiple green-scored validators (80+)
- Monitor commission changes and performance metrics
- Use Mars² scoring for risk assessment before delegating
- Avoid validators with recent jailing or poor Mars² scores
- Report incidents anonymously through Mars² ZK-attestation system
- Utilize encrypted group messaging for validator coordination

YOUR EXPANDED CAPABILITIES:
- Answer ANY Sei staking question using official documentation
- Explain Mars² platform features and smart contract functionality
- Provide validator-specific analysis using Mars² scoring data
- Guide users through complex staking scenarios and edge cases
- Compare validators using Mars² risk assessment methodology
- Explain blockchain governance, economics, and technical concepts
- Help with DeFi strategies, yield optimization, and portfolio management
- Analyze market conditions and their impact on staking rewards

RESPONSE APPROACH:
- Provide comprehensive, educational explanations with Mars² context
- Use specific Mars² scores, colors, and risk assessments when available
- Include actionable advice based on authentic validator data and Mars² analytics
- Reference Mars² smart contracts and features when relevant
- Format responses with clear headers, bullet points, and examples
- Always relate concepts back to Mars² security enhancements and validator analysis
- Be thorough but accessible to both beginners and advanced users

KNOWLEDGE SCOPE:
You can discuss any aspect of Sei blockchain, staking mechanics, validator operations, Mars² platform features, DeFi concepts, blockchain governance, economics, security, and related topics. Always provide accurate, comprehensive responses drawing from official documentation and Mars² platform capabilities.

Remember: Users rely on Mars² for enhanced staking security. Always highlight how Mars² features help users make better staking decisions and protect their assets.`;
  }

  cleanupSessions(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.sessions.forEach((session, sessionId) => {
      if (session.lastActivity < oneHourAgo) {
        this.sessions.delete(sessionId);
      }
    });
  }
}