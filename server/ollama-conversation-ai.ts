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
      
      // Start Ollama service if not running
      try {
        await execAsync('curl -s http://localhost:11434/api/tags', { timeout: 2000 });
        this.ollamaAvailable = true;
        console.log('Ollama service detected and running');
      } catch {
        console.log('Starting Ollama service...');
        // Start Ollama in background
        exec('OLLAMA_HOST=0.0.0.0:11434 ollama serve', (error) => {
          if (error) {
            console.warn('Ollama service start failed:', error.message);
          }
        });
        
        // Wait and check again
        await new Promise(resolve => setTimeout(resolve, 3000));
        try {
          await execAsync('curl -s http://localhost:11434/api/tags', { timeout: 2000 });
          this.ollamaAvailable = true;
          console.log('Ollama service started successfully');
        } catch {
          console.warn('Ollama service failed to start, using fallback responses');
        }
      }
      
      // Try to pull llama3 model if Ollama is available
      if (this.ollamaAvailable) {
        try {
          console.log('Checking for Llama3 model...');
          const { stdout } = await execAsync('ollama list');
          if (!stdout.includes('llama3')) {
            console.log('Pulling Llama3 model...');
            exec('ollama pull llama3:8b', (error, stdout, stderr) => {
              if (error) {
                console.error('Failed to pull Llama3:', error);
              } else {
                console.log('Llama3 model pulled successfully');
              }
            });
          }
        } catch (error) {
          console.warn('Could not check/pull Llama3 model:', error);
        }
      }
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
    
    if (this.ollamaAvailable) {
      try {
        aiResponse = await this.generateOllamaResponse(session.messages);
      } catch (error) {
        console.error('Ollama generation failed:', error);
        aiResponse = await this.generateFallbackResponse(userMessage, session);
      }
    } else {
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
    // Format messages for Ollama
    const conversationText = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
    
    const systemContext = messages.find(msg => msg.role === 'system')?.content || '';
    
    const prompt = `${systemContext}\n\nConversation:\n${conversationText}\nassistant:`;
    
    try {
      const { stdout } = await execAsync(`ollama generate llama3:8b "${prompt.replace(/"/g, '\\"')}"`, {
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });
      
      return stdout.trim() || 'I apologize, but I encountered an issue generating a response. Could you please rephrase your question?';
    } catch (error) {
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
   
2. **Unbonding Period: 14 Days**
   • Tokens are locked and cannot be moved
   • No rewards earned during this period
   • Cannot cancel once started

3. **Tokens Returned**
   • Available in wallet after 14 days
   • Can be freely transferred or restaked

**For ${validatorName}:**
${validatorContext?.jailed ? 
  `🚨 **RECOMMENDED ACTION: UNSTAKE IMMEDIATELY**\n• Validator is jailed - not earning rewards\n• Your tokens are at risk\n• 14-day unbonding period starts now` :
  validatorContext?.riskLevel === 'red' ?
  `⚠️ **CONSIDER UNSTAKING**\n• High risk validator\n• Consider partial unstaking\n• Monitor closely if keeping stake` :
  `• Validator appears healthy\n• Unstaking not urgently needed\n• Your choice based on strategy`}

**Unstaking vs Redelegating:**
• **Unstaking**: 14-day wait, tokens return to wallet
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
• Can only redelegate from same validator once per 14 days
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

    // Default educational response
    return `**Welcome to Mars² Validator Education**

I'm here to help you understand Sei network staking and ${validatorName} specifically.

**Popular Topics:**
• **"What does jailed mean?"** - Learn about validator penalties
• **"Why is this validator inactive?"** - Understand validator statuses  
• **"What's a commission rate?"** - Learn about validator fees
• **"Should I unstake?"** - Get personalized advice
• **"How does redelegation work?"** - Learn about moving stake
• **"What's slashing?"** - Understand staking risks
• **"Explain the Mars² score"** - Learn our risk assessment

**About ${validatorName}:**
• Address: ${session.validatorAddress}
• Current Status: ${validatorContext?.status || 'Unknown'}
• Mars² Score: ${validatorContext?.currentScore || 'Unknown'}

**How to Ask Questions:**
• Be specific: "Why was this validator jailed?"
• Ask for examples: "Show me how commission affects my rewards"
• Request guidance: "Should I redelegate to a different validator?"

What would you like to learn about Sei staking or ${validatorName}?`;
  }

  getSession(sessionId: string): ConversationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  private buildSystemPrompt(validatorName: string, validatorAddress: string, validatorContext?: any): string {
    return `You are a knowledgeable Sei blockchain staking advisor specializing in validator analysis and education. You're helping users understand staking concepts and the specific validator "${validatorName}" (${validatorAddress}).

CONTEXT ABOUT THIS VALIDATOR:
${validatorContext ? JSON.stringify(validatorContext, null, 2) : 'Limited context available'}

YOUR ROLE:
- Educate users about Sei staking terminology and concepts
- Analyze validator performance and provide recommendations  
- Explain technical concepts in simple terms
- Use official Sei documentation and best practices
- Be helpful, accurate, and educational

FOCUS AREAS:
- Validator statuses (jailed, active, inactive)
- Staking mechanics (unstaking, redelegation, rewards)
- Risk assessment and Mars² scoring
- Commission rates and economics
- Slashing and penalty mechanisms
- Performance metrics and analysis

RESPONSE STYLE:
- Clear, educational explanations
- Use examples and analogies
- Provide actionable advice
- Include specific data when available
- Format with headers and bullet points for readability
- Always relate general concepts back to the specific validator when relevant

Remember: Users may be new to staking, so explain concepts clearly and provide context for technical terms.`;
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