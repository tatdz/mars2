import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ElizaStakingAgent } from "./eliza";
import { ChatAgent } from "./chat-agent";
import { IncidentAI } from "./incident-ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add CORS headers for API routes
  app.use('/api/*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
  
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

  // Initialize Eliza AI agent
  const elizaAgent = new ElizaStakingAgent();
  
  // Initialize Chat Agent
  const chatAgent = new ChatAgent();
  
  // Initialize Incident AI
  const incidentAI = new IncidentAI();

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

  // Enhanced AI incidents analysis endpoint with onchain data
  app.post('/api/eliza/incidents', async (req, res) => {
    try {
      const { validatorName, validatorAddress, userQuestion = "What incidents have affected this validator?" } = req.body;
      
      if (!validatorName) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'validatorName is required'
        });
      }

      console.log(`Generating AI incident analysis for ${validatorName}`);
      
      // Fetch comprehensive incident data from onchain sources
      const incidentData = await incidentAI.fetchValidatorIncidentData(
        validatorAddress || 'demo_address', 
        validatorName
      );
      
      // Generate intelligent analysis using the incident AI
      const analysis = await incidentAI.generateIncidentAnalysis(incidentData, userQuestion);
      
      res.json({
        id: `incident_${Date.now()}`,
        role: 'assistant',
        content: analysis,
        timestamp: Date.now(),
        validatorData: incidentData
      });
    } catch (error: any) {
      console.error('Error generating AI incident analysis:', error);
      res.status(500).json({
        error: 'Failed to generate incident analysis',
        message: error.message
      });
    }
  });

  // Cleanup old chat sessions periodically
  setInterval(() => {
    chatAgent.cleanupSessions();
  }, 60 * 60 * 1000); // Every hour

  const httpServer = createServer(app);

  return httpServer;
}
