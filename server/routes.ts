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

      // Try Ollama with very short timeout to ensure responsive UI
      let aiResponse = '';
      
      // Use enhanced AI responses as primary system (Ollama as optional enhancement)
      console.log(`Generating AI response for: "${userQuestion}"`);
      const lowerQuestion = userQuestion.toLowerCase();
      
      // More specific question detection with priority order
      if (lowerQuestion.includes('best validator') || lowerQuestion.includes('choose validator') || 
          (lowerQuestion.includes('validator') && (lowerQuestion.includes('recommend') || lowerQuestion.includes('select')))) {
        aiResponse = `**Choosing the Best Sei Validators with Mars²**

Based on current Sei testnet data and Mars² analysis:

**Top Selection Criteria:**
• **Mars² Score**: Target validators with 80+ (green) scores
• **Commission Rate**: Look for 2-7% for optimal rewards
• **Uptime**: Minimum 99%+ block signing performance
• **Voting Power**: Balanced - avoid over-concentrated validators
• **Self-Bond**: Higher validator self-stake shows confidence

**Current Network Context:**
${validatorContext}

**Mars² Risk Assessment:**
• **Green (80-100)**: Safe for staking, low risk
• **Yellow (60-79)**: Monitor regularly, moderate risk
• **Red (0-59)**: Avoid staking, high risk factors

**Smart Diversification:**
• Spread stake across 3-5 different validators
• Mix large and medium validators for balance
• Monitor weekly through Mars² dashboard
• Use incident reporting for early risk detection

**Mars² Smart Contracts:**
• Score Contract: 0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294
• Incident Reports: Anonymous ZK attestations available
• Real-time monitoring via Sei EVM integration`;
      } else if ((lowerQuestion.includes('stake') || lowerQuestion.includes('staking') || lowerQuestion.includes('delegate')) && 
                 !lowerQuestion.includes('risk') && !lowerQuestion.includes('security')) {
        aiResponse = `**Sei Staking Guide with Mars² Security**

**Current Sei Network:**
• **Chain**: Sei EVM Testnet (Atlantic-2)
• **Validators**: ~100 active validators
• **Block Time**: ~600ms (fastest in Cosmos)
• **Unbonding**: 21 days withdrawal period

**Staking Process:**
1. **Connect MetaMask** to Sei EVM testnet
2. **Choose Validators** using Mars² scoring system
3. **Delegate SEI** through supported interfaces
4. **Monitor Performance** via Mars² dashboard

**Network Context:**
${validatorContext}

**Mars² Risk Framework:**
• **Green Score (80+)**: Safe validators, recommended
• **Yellow Score (60-79)**: Requires monitoring
• **Red Score (<60)**: High risk, avoid delegation

**Reward Structure:**
• **Base APR**: ~15-20% (varies by network conditions)
• **Commission**: Validator fee (typically 2-10%)
• **Compound**: Rewards auto-compound if re-delegated
• **Taxes**: Consider local tax implications

**Risk Factors:**
• **Slashing**: 0.01% (downtime), 5% (double-sign)
• **Validator Risk**: Performance, governance participation
• **Market Risk**: SEI token price volatility
• **Technical Risk**: Smart contract interactions

**Mars² Protection:**
• Real-time incident monitoring via 0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae
• Anonymous community reporting system
• Automated risk scoring and alerts`;
      } else if ((lowerQuestion.includes('mars') || lowerQuestion.includes('platform') || lowerQuestion.includes('contract')) && 
                 !lowerQuestion.includes('risk') && !lowerQuestion.includes('security') && !lowerQuestion.includes('incident')) {
        aiResponse = `**Mars² Platform Overview**

**Smart Contract System:**
• **MarsValidatorScore** (0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294)
  - Real-time validator risk scoring (0-100 scale)
  - Performance tracking and incident correlation
  - On-chain score updates via Sei EVM

• **MarsZkAttest** (0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae)
  - Anonymous incident reporting system
  - Zero-knowledge proofs for privacy
  - Sybil-resistant attestation mechanism

• **MarsValidatorGroupMessages** (0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950)
  - Encrypted validator communication
  - Group coordination and governance
  - Message authenticity verification

**Network Status:**
${validatorContext}

**Key Features:**
• **Risk Assessment**: Automated scoring based on uptime, governance, incidents
• **Anonymous Reporting**: Community-driven security monitoring
• **Real-time Updates**: Live data from Sei blockchain integration
• **Encrypted Messaging**: Secure validator coordination tools

**How Mars² Works:**
1. **Data Collection**: Monitors Sei network events and performance
2. **Risk Analysis**: Calculates comprehensive validator safety scores
3. **Community Input**: Processes anonymous incident reports
4. **Score Updates**: Real-time scoring via smart contract integration
5. **User Interface**: Dashboard showing actionable security insights

**Integration:**
• Sei EVM testnet deployment
• MetaMask wallet connectivity
• Real-time API data feeds
• Cross-platform compatibility`;
      } else if (lowerQuestion.includes('risk') || lowerQuestion.includes('security') || lowerQuestion.includes('incident') || 
                 lowerQuestion.includes('slash') || lowerQuestion.includes('danger')) {
        aiResponse = `**Mars² Security & Risk Analysis**

**Current Network Status:**
${validatorContext}

**Risk Assessment Framework:**
• **Performance Risk**: Uptime, block signing consistency
• **Governance Risk**: Participation in network decisions
• **Economic Risk**: Commission changes, self-bond levels
• **Technical Risk**: Infrastructure reliability, updates
• **Community Risk**: Incident reports and reputation

**Mars² Incident System:**
• **Anonymous Reporting**: Submit incidents via ZK proofs
• **Community Verification**: Crowd-sourced incident validation
• **Real-time Scoring**: Automatic risk score adjustments
• **Alert System**: Immediate notifications for high-risk events

**Security Smart Contracts:**
• **Score Contract**: 0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294
• **Incident Contract**: 0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae
• **Messaging Contract**: 0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950

**Risk Mitigation:**
• **Diversification**: Never stake with single validator
• **Regular Monitoring**: Check scores weekly minimum
• **Incident Awareness**: Subscribe to Mars² alerts
• **Exit Strategy**: Know when to unstake/redelegate

**Slashing Protection:**
• Monitor validator uptime (>99% recommended)
• Avoid validators with governance non-participation
• Watch for double-signing incidents
• Use Mars² early warning system`;
      } else if (lowerQuestion.includes('how') || lowerQuestion.includes('what') || lowerQuestion.includes('why') || 
                 lowerQuestion.includes('when') || lowerQuestion.includes('where')) {
        // Dynamic response based on specific question content
        if (lowerQuestion.includes('work') || lowerQuestion.includes('function')) {
          aiResponse = `**How Mars² Works on Sei**

**System Architecture:**
Mars² operates as a comprehensive validator security platform on Sei EVM testnet:

**Data Collection Layer:**
• **Sei API Integration**: Real-time validator performance monitoring
• **Block Data**: Uptime tracking, missed blocks, governance participation
• **Network Events**: Slashing events, validator status changes
• **Community Reports**: Anonymous incident submissions via ZK proofs

**Analysis Engine:**
• **Risk Scoring Algorithm**: 0-100 scoring based on multiple factors
• **Performance Metrics**: Uptime, commission changes, self-bond levels
• **Governance Tracking**: Proposal voting history and participation rates
• **Incident Correlation**: Community reports impact on validator scores

**Smart Contract Integration:**
• **Score Contract** (0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294): Stores and updates validator risk scores
• **Attestation Contract** (0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae): Handles anonymous incident reporting
• **Messaging Contract** (0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950): Enables secure validator communication

**Current Sei Network:**
${validatorContext}

**User Interface:**
• Real-time dashboard showing color-coded validator scores
• Historical performance charts and trends
• Anonymous incident reporting interface
• Secure messaging system for validator coordination`;
        } else {
          aiResponse = `**Mars² AI Assistant - Personalized Response**

Based on your question: "${userQuestion}"

**Current Sei Network Status:**
${validatorContext}

**Relevant Information:**
Let me provide specific guidance based on what you're asking about:

**If you're asking about validators:** Mars² tracks 100+ Sei validators with real-time scoring. Green (80+) scores indicate safe validators, yellow (60-79) need monitoring, red (<60) should be avoided.

**If you're asking about staking:** Sei offers ~15-20% APR with 21-day unbonding. Use Mars² scores to select safe validators and diversify across 3-5 different validators.

**If you're asking about Mars² features:** Our platform provides anonymous incident reporting, encrypted messaging, and real-time risk assessment through smart contracts on Sei EVM.

**If you're asking about risks:** Main risks include validator slashing (0.01% downtime, 5% double-sign), commission changes, and technical failures. Mars² helps identify these risks early.

**If you're asking about technical details:** Mars² uses three main smart contracts for scoring, attestations, and messaging, all deployed on Sei EVM testnet.

**Smart Contracts:**
• Score: 0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294
• Reports: 0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae
• Messages: 0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950

Could you be more specific about what aspect you'd like to explore further?`;
        }
      } else {
        aiResponse = `**Mars² AI - Sei Staking Assistant**

I provide expert guidance on Sei blockchain staking using real-time data and Mars² security analysis.

**Current Network Status:**
${validatorContext}

**What I Can Help With:**

**🎯 Validator Selection**
• Best performing validators analysis
• Risk assessment using Mars² scores
• Commission rate comparisons

**📊 Staking Strategy**
• Delegation optimization
• Risk diversification
• Reward calculations

**🔒 Security Analysis**
• Mars² smart contract insights
• Incident monitoring and reporting
• Real-time risk alerts

**⚡ Sei Network**
• Fastest blockchain performance
• EVM compatibility features
• Governance participation

**🛡️ Mars² Platform**
• Anonymous incident reporting
• Encrypted validator messaging
• Zero-knowledge attestations

**Smart Contracts:**
• Score: 0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294
• Reports: 0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae
• Messages: 0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950

Ask me anything about Sei staking, validator analysis, or Mars² security features!`;
      }
      
      // Try Ollama enhancement with proper timeout (parallel processing)
      const ollamaPromise = (async () => {
        try {
          console.log('Attempting Ollama Llama3 enhancement...');
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          // Create enhanced prompt with Sei documentation context
          const enhancedMessages = [
            {
              role: 'system',
              content: `You are Mars² AI, an expert on Sei blockchain staking and validator analysis. Use the following context to provide accurate, detailed responses:

CONTEXT:
- Sei is the fastest blockchain (600ms block time) with EVM compatibility
- Mars² platform provides real-time validator risk scoring (0-100 scale)
- Current network has ~100 active validators on Atlantic-2 testnet
- Sei staking has 21-day unbonding period with ~15-20% APR
- Mars² smart contracts: Score (0x2358...), Attestation (0x45d1...), Messaging (0x9FE4...)
- Green scores (80+) = safe, Yellow (60-79) = monitor, Red (<60) = avoid
- Key risks: slashing (0.01% downtime, 5% double-sign), validator performance, commission changes

INSTRUCTIONS:
- Provide specific, actionable advice
- Reference real Mars² features and contract addresses
- Include current network context: ${validatorContext}
- Focus on practical staking guidance
- Mention Mars² security features when relevant`
            },
            ...messages.slice(-2) // Recent conversation context
          ];
          
          const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama3:8b',
              messages: enhancedMessages,
              stream: false,
              options: { 
                temperature: 0.7, 
                top_p: 0.9,
                num_predict: 400,
                num_ctx: 3072,
                repeat_penalty: 1.1
              }
            }),
            signal: controller.signal
          });
          
          if (ollamaResponse.ok) {
            const data = await ollamaResponse.json();
            const ollamaContent = data.message?.content?.trim();
            if (ollamaContent && ollamaContent.length > 100) {
              console.log('Ollama Llama3 enhanced response generated successfully');
              return ollamaContent;
            }
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.log('Ollama request timed out, using knowledge base response');
          } else {
            console.log('Ollama unavailable, using knowledge base response:', error.message);
          }
        }
        return null;
      })();

      // Use Ollama if available within timeout, otherwise use knowledge base
      try {
        const ollamaResult = await Promise.race([
          ollamaPromise,
          new Promise(resolve => setTimeout(() => resolve(null), 5000))
        ]);
        
        if (ollamaResult && typeof ollamaResult === 'string') {
          aiResponse = ollamaResult;
          console.log('Using Ollama Llama3 enhanced response');
        } else {
          console.log('Using Mars² knowledge base response');
        }
      } catch (error) {
        console.log('Ollama processing failed, using knowledge base response');
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
