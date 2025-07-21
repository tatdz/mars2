import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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
      
      // Transform the data to match our expected format
      const transformedData = {
        validators: data.validators || []
      };
      
      res.json(transformedData);
    } catch (error: any) {
      console.error('Error fetching validators:', error);
      res.status(500).json({ 
        error: 'Failed to fetch validators',
        message: error.message 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
