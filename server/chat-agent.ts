import { ElizaStakingAgent } from './eliza';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  sessionId: string;
  walletAddress?: string;
  messages: ChatMessage[];
  lastActivity: number;
}

export class ChatAgent {
  private elizaAgent: ElizaStakingAgent;
  private sessions: Map<string, ChatSession> = new Map();

  constructor() {
    this.elizaAgent = new ElizaStakingAgent();
  }

  // Create or get existing chat session
  getSession(sessionId: string, walletAddress?: string): ChatSession {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        sessionId,
        walletAddress,
        messages: [{
          id: 'welcome',
          role: 'assistant',
          content: `Welcome to Mars² AI Assistant! I'm here to help you with staking decisions on Sei network.\n\n${walletAddress ? `I see you have wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} connected. I can analyze your current delegations and provide personalized advice.` : 'Connect your wallet to get personalized staking recommendations.'}\n\nYou can ask me:\n• "Should I unstake from [validator]?"\n• "Who are the safest validators?"\n• "What's my staking risk?"\n• "Show me incident reports"`,
          timestamp: Date.now()
        }],
        lastActivity: Date.now()
      });
    }
    
    const session = this.sessions.get(sessionId)!;
    session.lastActivity = Date.now();
    return session;
  }

  // Process natural language chat message
  async processMessage(sessionId: string, userMessage: string, walletAddress?: string): Promise<ChatMessage> {
    const session = this.getSession(sessionId, walletAddress);
    
    // Add user message to history
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    session.messages.push(userMsg);

    // Generate AI response based on message content
    const aiResponse = await this.generateResponse(userMessage, walletAddress, session);
    
    const assistantMsg: ChatMessage = {
      id: `ai_${Date.now()}`,
      role: 'assistant', 
      content: aiResponse,
      timestamp: Date.now()
    };
    session.messages.push(assistantMsg);

    return assistantMsg;
  }

  // Generate contextual AI responses
  private async generateResponse(message: string, walletAddress: string | undefined, session: ChatSession): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    try {
      // Handle specific validator questions
      if (lowerMessage.includes('unstake from') || lowerMessage.includes('should i unstake')) {
        const validatorMatch = message.match(/(?:unstake from|unstake)\s+([a-zA-Z0-9.\s]+)/i);
        if (validatorMatch) {
          const validatorName = validatorMatch[1].trim();
          const callbackId = `unstake_${validatorName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          const response = await this.elizaAgent.handleCallback(callbackId, walletAddress || 'demo');
          return response.message;
        }
      }

      // Handle redelegation questions
      if (lowerMessage.includes('redelegate') || lowerMessage.includes('move my stake')) {
        const validatorMatch = message.match(/(?:redelegate from|move.*from)\s+([a-zA-Z0-9.\s]+)/i);
        if (validatorMatch) {
          const validatorName = validatorMatch[1].trim();
          const callbackId = `redelegate_${validatorName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          const response = await this.elizaAgent.handleCallback(callbackId, walletAddress || 'demo');
          return response.message;
        }
      }

      // Handle incident reports
      if (lowerMessage.includes('incident') || lowerMessage.includes('what happened')) {
        const validatorMatch = message.match(/(?:incident|happened).*(?:to|with)\s+([a-zA-Z0-9.\s]+)/i);
        if (validatorMatch) {
          const validatorName = validatorMatch[1].trim();
          const callbackId = `incidents_${validatorName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
          const response = await this.elizaAgent.handleCallback(callbackId, walletAddress || 'demo');
          return response.message;
        }
      }

      // Handle "safest validators" questions
      if (lowerMessage.includes('safest validator') || lowerMessage.includes('best validator') || lowerMessage.includes('recommend')) {
        const topValidators = await this.elizaAgent.getTopValidators();
        const recommendations = topValidators.slice(0, 5).map((v, i) => 
          `${i + 1}. **${v.name}** - Mars² Score: ${v.score} (${v.uptime}% uptime)`
        ).join('\n');
        
        return `Here are the top-performing validators based on Mars² scoring:\n\n${recommendations}\n\nThese validators have consistently high scores, excellent uptime, and strong governance participation. Consider redelegating to any of these for optimal security.`;
      }

      // Handle personal staking analysis
      if (lowerMessage.includes('my staking') || lowerMessage.includes('my delegation') || lowerMessage.includes('staking advice')) {
        if (!walletAddress) {
          return "To analyze your personal staking portfolio, please connect your wallet first. Once connected, I can review all your delegations and provide specific recommendations.";
        }
        
        try {
          const recommendations = await this.elizaAgent.getStakingRecommendations(walletAddress);
          const riskCount = recommendations.delegations.filter(d => d.risk_level === 'red').length;
          
          if (riskCount === 0) {
            return `Great news! Your staking portfolio looks healthy with ${recommendations.delegations.length} delegations totaling ${recommendations.total_at_risk}.\n\nAll your validators have acceptable Mars² scores. Keep monitoring for any changes in validator performance.`;
          } else {
            const riskValidators = recommendations.delegations
              .filter(d => d.risk_level === 'red')
              .map(d => `• ${d.validator_name} (Score: ${d.mars_score})`)
              .join('\n');
            
            return `⚠️ I found ${riskCount} high-risk delegation(s) in your portfolio:\n\n${riskValidators}\n\nI recommend taking action on these validators to protect your assets. Would you like specific guidance on unstaking or redelegating?`;
          }
        } catch (error) {
          return "I encountered an issue analyzing your delegations. Please try again or check your wallet connection.";
        }
      }

      // Handle general validator questions
      if (lowerMessage.includes('validator') && (lowerMessage.includes('score') || lowerMessage.includes('risk'))) {
        return "I can help you understand validator risks using Mars² scoring system:\n\n🟢 **Green (80-100)**: Safe validators with excellent performance\n🟡 **Yellow (60-79)**: Moderate risk, monitor closely\n🔴 **Red (0-59)**: High risk, consider unstaking\n\nAsk me about specific validators like \"What's RHINO's score?\" or \"Is Imperator safe?\"";
      }

      // Handle Mars² system questions  
      if (lowerMessage.includes('mars') || lowerMessage.includes('how does this work')) {
        return "Mars² is a real-time validator risk assessment system for Sei network:\n\n📊 **Scoring**: Automated analysis of uptime, missed blocks, and governance participation\n📝 **Anonymous Reports**: Community-submitted incident reports with ZK-proofs\n🔐 **Encrypted Messaging**: Secure validator communication channels\n\nValidators are scored 0-100, with color coding for easy risk assessment. The system helps you make informed staking decisions.";
      }

      // Handle greetings and general help
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
        return walletAddress 
          ? `Hello! I'm your Mars² staking assistant. I can help you with:\n\n• Analyzing your current delegations\n• Providing validator risk assessments\n• Guiding you through unstaking/redelegating\n• Explaining incident reports\n\nWhat would you like to know about your staking positions?`
          : `Hello! I'm the Mars² AI assistant. I help with Sei validator analysis and staking decisions.\n\nConnect your wallet for personalized advice, or ask me general questions like:\n• "Who are the safest validators?"\n• "How does Mars² scoring work?"\n• "What makes a validator risky?"`;
      }

      // Default response for unclear messages
      return "I'm not sure I understand that question. Here are some things you can ask me:\n\n• \"Should I unstake from [validator name]?\"\n• \"Who are the safest validators?\"\n• \"What's my staking risk?\"\n• \"Show me incident reports for [validator]\"\n• \"How does Mars² scoring work?\"\n\nTry rephrasing your question, and I'll do my best to help!";

    } catch (error) {
      console.error('Chat agent error:', error);
      return "I encountered an error processing your request. Please try again or contact support if the issue persists.";
    }
  }

  // Clean up old sessions (called periodically)
  cleanupSessions() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    this.sessions.forEach((session, sessionId) => {
      if (now - session.lastActivity > maxAge) {
        this.sessions.delete(sessionId);
      }
    });
  }
}