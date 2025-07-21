import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ElizaStakingAgent } from "./eliza";
import { ChatAgent } from "./chat-agent";
import { IncidentAI } from "./incident-ai";
import { SeiIncidentAI } from "./sei-incident-ai";
import { OllamaConversationAI } from "./ollama-conversation-ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add CORS headers for API routes
  app.use('/api/*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

  // Initialize AI services
  const ollamaAI = new OllamaConversationAI();
  const elizaAgent = new ElizaStakingAgent();
  const chatAgent = new ChatAgent();
  const incidentAI = new IncidentAI();
  
  // Proxy endpoint for Sei validators API to avoid CORS issues
  app.get('/api/sei/validators', async (req, res) => {
    try {
      console.log('Fetching validators from Sei testnet API...');
      const apiUrl = 'https://rest-testnet.sei-apis.com/cosmos/staking/v1beta1/validators';
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mars2-Staking-dApp/1.0'
        }
      });
      
      console.log(`API response status: ${response.status} ${response.statusText}`);
      console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`API error response: ${errorText}`);
        throw new Error(`Failed to fetch validators: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`Successfully fetched ${data.validators?.length || 0} validators`);
      
      // Transform the data to match our expected format and add scoring simulation
      const transformedValidators = data.validators?.map((validator: any, index: number) => {
        // Generate consistent but varied scores based on validator address
        const hash = validator.operator_address.slice(-8);
        const numHash = parseInt(hash, 16);
        const baseScore = 60 + (numHash % 40); // Range 60-99
        
        // Simulate different statuses based on jailed status and tokens
        let status = 'active';
        let score = baseScore;
        
        if (validator.jailed) {
          status = 'jailed';
          score = Math.max(20, baseScore - 40);
        } else if (validator.status !== 'BOND_STATUS_BONDED') {
          status = 'inactive';
          score = Math.max(40, baseScore - 20);
        }
        
        const tokens = parseInt(validator.tokens) || 0;
        const votingPower = tokens / 1000000; // Convert to SEI from usei
        
        return {
          operator_address: validator.operator_address,
          consensus_pubkey: validator.consensus_pubkey,
          jailed: validator.jailed,
          status: validator.status,
          tokens: validator.tokens,
          delegator_shares: validator.delegator_shares,
          description: {
            moniker: validator.description?.moniker || `Validator ${index + 1}`,
            identity: validator.description?.identity || '',
            website: validator.description?.website || '',
            security_contact: validator.description?.security_contact || '',
            details: validator.description?.details || ''
          },
          unbonding_height: validator.unbonding_height,
          unbonding_time: validator.unbonding_time,
          commission: validator.commission,
          min_self_delegation: validator.min_self_delegation,
          // Mars² specific fields
          mars_score: score,
          mars_status: status,
          voting_power: votingPower,
          uptime: Math.max(85, 95 + (numHash % 10)), // 95-104% range, capped at reasonable values
          recent_reports: Math.floor(numHash % 3), // 0-2 reports
          last_updated: new Date().toISOString()
        };
      }) || [];
      
      // Sort by voting power (tokens) descending
      transformedValidators.sort((a: any, b: any) => parseInt(b.tokens) - parseInt(a.tokens));
      
      res.json({
        validators: transformedValidators
      });
    } catch (error: any) {
      console.error('Error fetching validators:', error);
      res.status(500).json({ 
        error: 'Failed to fetch validators',
        message: error.message 
      });
    }
  });



  // Eliza AI recommendations endpoint
  app.post('/api/eliza/recommendations', async (req, res) => {
    try {
      const { userAddress } = req.body;
      
      if (!userAddress || typeof userAddress !== 'string') {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'userAddress is required'
        });
      }

      console.log(`Generating AI recommendations for ${userAddress}`);
      const recommendations = await elizaAgent.getStakingRecommendations(userAddress);
      
      res.json(recommendations);
    } catch (error: any) {
      console.error('Error generating AI recommendations:', error);
      res.status(500).json({
        error: 'Failed to generate recommendations',
        message: error.message
      });
    }
  });

  // Eliza AI callback handler for interactive conversations
  app.post('/api/eliza/callback', async (req, res) => {
    try {
      const { callback, userAddress } = req.body;
      
      if (!callback || !userAddress) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'callback and userAddress are required'
        });
      }

      console.log(`Processing callback: ${callback} for ${userAddress}`);
      const response = await elizaAgent.handleCallback(callback, userAddress);
      
      res.json(response);
    } catch (error: any) {
      console.error('Error processing callback:', error);
      res.status(500).json({
        error: 'Failed to process callback',
        message: error.message
      });
    }
  });

  // Chat session initialization endpoint
  app.post('/api/chat/session', async (req, res) => {
    try {
      const { sessionId, walletAddress } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'sessionId is required'
        });
      }

      const session = chatAgent.getSession(sessionId, walletAddress);
      res.json(session);
    } catch (error: any) {
      console.error('Error initializing chat session:', error);
      res.status(500).json({
        error: 'Failed to initialize session',
        message: error.message
      });
    }
  });

  // Chat message processing endpoint
  app.post('/api/chat/message', async (req, res) => {
    try {
      const { sessionId, message, walletAddress } = req.body;
      
      if (!sessionId || !message) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'sessionId and message are required'
        });
      }

      console.log(`Processing chat message: "${message}" for session ${sessionId}`);
      const response = await chatAgent.processMessage(sessionId, message, walletAddress);
      
      res.json(response);
    } catch (error: any) {
      console.error('Error processing chat message:', error);
      res.status(500).json({
        error: 'Failed to process message',
        message: error.message
      });
    }
  });

  // AI Chat endpoint with Ollama Llama 3 integration
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { userQuestion, chatHistory = [] } = req.body;

      if (!userQuestion?.trim()) {
        return res.status(400).json({ error: 'Question is required' });
      }

      // Fetch recent validator data for context
      let validatorContext = '';
      try {
        const validatorsResponse = await fetch('https://rest-testnet.sei-apis.com/cosmos/staking/v1beta1/validators');
        if (validatorsResponse.ok) {
          const data = await validatorsResponse.json();
          const validators = data.validators?.slice(0, 3) || [];
          validatorContext = `Recent Sei Validators: ${validators.map((v: any) => 
            `${v.description?.moniker || 'Unknown'} (Status: ${v.status || 'Unknown'}, Commission: ${v.commission?.commission_rates?.rate || 'Unknown'})`
          ).join(', ')}`;
        }
      } catch (error) {
        console.warn('Failed to fetch validator context:', error);
        validatorContext = 'Validator data currently unavailable';
      }

      // Mars² documentation and contract context
      const mars2Context = `
Mars² Platform Overview:
- MarsValidatorScore Contract: 0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294 (Validator risk scoring 0-100)
- MarsZkAttest Contract: 0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae (Anonymous incident reporting)
- MarsValidatorGroupMessages Contract: 0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950 (Encrypted messaging)

Sei Network Details:
- Testnet: Atlantic-2
- Unbonding Period: 21 days
- Consensus: Tendermint BFT with ~100 validators
- Slashing: 0.01% (downtime), 5% (double-signing)
- Block Time: ~600ms

Mars² Scoring System:
- Green (80+): Safe validators
- Yellow (60-79): Monitor regularly
- Red (<60): High risk, consider unstaking
      `;

      // Build conversation context
      const messages = [
        {
          role: "system",
          content: `You are Mars² AI, an expert assistant for Sei blockchain staking and validator security. You help users with:

- Validator selection and risk assessment
- Mars² platform features and smart contracts
- Sei staking mechanics, governance, and rewards
- Risk management and delegation strategies
- Incident analysis and security concerns

Context Information:
${mars2Context}

Current Network Status:
${validatorContext}

Guidelines:
- Be concise but informative
- Reference specific Mars² contracts when relevant
- Provide actionable advice for staking decisions
- Explain technical concepts in simple terms
- Use Mars² scoring criteria for validator recommendations
- Include specific contract addresses when discussing Mars² features`
        },
        // Include recent chat history for context
        ...chatHistory.slice(-8).map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: "user",
          content: userQuestion
        }
      ];

      // Try Ollama first, fallback to enhanced responses
      let aiResponse = '';
      try {
        const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3:8b',
            messages: messages,
            stream: false,
            options: {
              temperature: 0.7,
              top_p: 0.9,
              num_predict: 400
            }
          }),
        });

        if (ollamaResponse.ok) {
          const data = await ollamaResponse.json();
          aiResponse = data.message?.content?.trim();
          console.log('Ollama chat response generated successfully');
        } else {
          throw new Error(`Ollama responded with ${ollamaResponse.status}`);
        }
      } catch (ollamaError) {
        console.warn('Ollama chat failed, using enhanced fallback:', ollamaError);
        
        // Enhanced fallback responses
        const lowerQuestion = userQuestion.toLowerCase();
        
        if (lowerQuestion.includes('best validator') || lowerQuestion.includes('choose validator')) {
          aiResponse = `**Choosing the Best Sei Validators with Mars²**

Use Mars² scoring to identify safe validators:

**Green Validators (80+ Score):**
• Excellent uptime (99%+)
• Low commission (0-5%)
• Active governance participation
• Strong technical infrastructure

**Key Selection Criteria:**
• **Mars² Score**: Prioritize 80+ (green) validators
• **Commission Rate**: Look for 0-7% for better rewards
• **Uptime**: Check for consistent block signing
• **Self-Delegation**: Higher shows validator confidence
• **Community Standing**: Established validators with good reputation

**Diversification Strategy:**
• Spread across 3-5 different validators
• Mix commission rates and validator sizes
• Monitor Mars² scores weekly
• Use Mars² incident reporting for red flags

Check the Mars² dashboard for real-time validator scores and incident reports.`;
        } else if (lowerQuestion.includes('mars') && (lowerQuestion.includes('contract') || lowerQuestion.includes('how'))) {
          aiResponse = `**Mars² Smart Contract System on Sei**

**Core Contracts:**
• **MarsValidatorScore** (0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294)
  - Stores validator risk scores (0-100)
  - Real-time performance tracking
  - Automated score updates

• **MarsZkAttest** (0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae)
  - Anonymous incident reporting
  - Zero-knowledge proofs for privacy
  - Sybil-resistant attestations

• **MarsValidatorGroupMessages** (0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950)
  - Encrypted validator communication
  - Group coordination features
  - Message verification system

**How It Works:**
1. **Data Collection**: Monitors Sei network events
2. **Risk Analysis**: Evaluates uptime, governance, incidents
3. **Score Calculation**: Generates 0-100 risk scores
4. **Community Reports**: Allows anonymous incident reporting
5. **Real-time Updates**: Continuously updates validator assessments

All contracts are deployed on Sei EVM testnet and integrate with the Mars² dashboard.`;
        } else if (lowerQuestion.includes('stake') || lowerQuestion.includes('staking')) {
          aiResponse = `**Sei Staking with Mars² Security**

**Staking Basics:**
• **Delegate** SEI tokens to validators to earn rewards
• **Rewards**: Block rewards + transaction fees (minus commission)
• **Unbonding**: 21 days to withdraw your stake
• **Slashing**: Risk of losing stake for validator misbehavior

**Mars² Advantages:**
• **Risk Scores**: 0-100 scoring system for validator safety
• **Incident Tracking**: Community-driven security reports
• **Real-time Monitoring**: Continuous validator performance analysis

**Safe Staking Strategy:**
1. **Use Mars² Scores**: Only stake with green (80+) validators
2. **Diversify**: Spread across 3-5 different validators
3. **Monitor Regularly**: Check scores weekly for changes
4. **Commission Awareness**: Lower rates = higher rewards for you
5. **Stay Informed**: Use Mars² incident reports for early warnings

**Risk Management:**
• Red validators (<60): Consider unstaking immediately
• Yellow validators (60-79): Monitor closely, consider redistribution
• Green validators (80+): Safe for staking with regular monitoring

The Mars² platform helps you make informed decisions with real-time validator risk assessment.`;
        } else {
          aiResponse = `**Mars² AI Assistant**

I'm here to help with Sei blockchain staking and Mars² platform features. I can assist with:

**Validator Questions:**
• "What are the best validators on Sei?"
• "How do I choose safe validators?"
• "What does this validator's score mean?"

**Mars² Platform:**
• "How do Mars² smart contracts work?"
• "What is the incident reporting system?"
• "How are validator scores calculated?"

**Staking Guidance:**
• "How does Sei staking work?"
• "What are the risks of staking?"
• "When should I unstake or redelegate?"

**Current Sei Network:**
• Testnet: Atlantic-2
• ~100 active validators
• 21-day unbonding period
• Mars² contracts live on Sei EVM

**Mars² Scoring:**
• **Green (80+)**: Safe to stake
• **Yellow (60-79)**: Monitor regularly
• **Red (<60)**: High risk, avoid

What specific question can I help you with about Sei staking or Mars² features?`;
        }
      }

      if (!aiResponse) {
        aiResponse = "I apologize, but I'm having trouble generating a response right now. Please try asking your question again, or check the Mars² dashboard for validator information and platform features.";
      }

      res.json({ reply: aiResponse });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ 
        error: 'Failed to process chat request',
        reply: "I'm experiencing technical difficulties. Please try again in a moment. You can find comprehensive validator information and Mars² features in the main dashboard."
      });
    }
  });

  // Enhanced AI incidents analysis endpoint using real Sei API data
  app.post('/api/eliza/incidents', async (req, res) => {
    try {
      const { validatorAddress, validatorName, userAddress } = req.body;
      console.log(`Generating AI incident analysis for ${validatorName} (${validatorAddress})`);
      
      if (!validatorAddress) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'validatorAddress is required'
        });
      }
      
      const seiIncidentAI = new SeiIncidentAI();
      const analysis = await seiIncidentAI.analyzeValidator(validatorAddress);
      
      res.json({
        id: `incident_${Date.now()}`,
        role: 'assistant',
        message: analysis.aiAnalysis,
        validatorData: {
          currentScore: analysis.currentScore,
          riskLevel: analysis.riskLevel,
          events: analysis.incidents,
          performanceMetrics: analysis.performanceMetrics,
          uptime: analysis.performanceMetrics.uptime
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error analyzing validator:', error);
      res.status(500).json({ 
        error: 'Failed to analyze validator incidents',
        message: 'Unable to fetch validator data from Sei network. Please try again later.'
      });
    }
  });

  // New conversational AI endpoints for validator education
  app.post('/api/conversation/start', async (req, res) => {
    try {
      const { validatorAddress, validatorName } = req.body;
      
      if (!validatorAddress || !validatorName) {
        return res.status(400).json({
          error: 'validatorAddress and validatorName are required'
        });
      }

      // Get validator context from Sei API
      const seiIncidentAI = new SeiIncidentAI();
      const validatorAnalysis = await seiIncidentAI.analyzeValidator(validatorAddress);
      
      const sessionId = await ollamaAI.createConversation(
        validatorAddress, 
        validatorName, 
        validatorAnalysis
      );
      
      res.json({
        sessionId,
        validatorName,
        validatorAddress,
        context: {
          score: validatorAnalysis.currentScore,
          riskLevel: validatorAnalysis.riskLevel,
          status: validatorAnalysis.status
        }
      });
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      res.status(500).json({ 
        error: 'Failed to start conversation',
        message: error.message 
      });
    }
  });

  app.post('/api/conversation/message', async (req, res) => {
    try {
      const { sessionId, message } = req.body;
      
      if (!sessionId || !message) {
        return res.status(400).json({
          error: 'sessionId and message are required'
        });
      }

      const response = await ollamaAI.sendMessage(sessionId, message);
      
      res.json({
        sessionId,
        message: response.content,
        timestamp: response.timestamp,
        role: response.role
      });
    } catch (error: any) {
      console.error('Error processing conversation message:', error);
      res.status(500).json({ 
        error: 'Failed to process message',
        message: error.message 
      });
    }
  });

  app.get('/api/conversation/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = ollamaAI.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      res.json({
        sessionId: session.sessionId,
        validatorName: session.validatorName,
        validatorAddress: session.validatorAddress,
        messages: session.messages.filter(msg => msg.role !== 'system'),
        lastActivity: session.lastActivity
      });
    } catch (error: any) {
      console.error('Error getting conversation:', error);
      res.status(500).json({ 
        error: 'Failed to get conversation',
        message: error.message 
      });
    }
  });

  // Cleanup old chat sessions periodically
  setInterval(() => {
    chatAgent.cleanupSessions();
    ollamaAI.cleanupSessions();
  }, 60 * 60 * 1000); // Every hour

  const httpServer = createServer(app);

  return httpServer;
}
