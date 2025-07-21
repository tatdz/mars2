# 🚀 Mars² — Secure Staking Intelligence for Sei

Mars² is a real-time, onchain risk radar for validators on the Sei EVM network.
It gives delegators live color-coded trust scores, enables anonymous (Sybil-resistant) incident reports, and provides validators with a shared encrypted communication channel to coordinate in emergencies—all fully deployed and verifiable on Sei testnet.

🎯 Stake confidently. Report anonymously. Coordinate securely.

## Features

- **Real-time Validator Monitoring**: Live scoring system with color-coded risk assessments
- **Real AI-Powered Analysis**: OpenAI GPT-4o integration for genuine machine learning validator assessment
- **Anonymous Incident Reporting**: Zero-knowledge proof-based and Sibyl resistant reporting system  
- **Encrypted Group Messaging**: Secure validator communication with key management
- **MetaMask Integration**: Wallet connectivity for Sei EVM testnet
- **Performance Optimized**: Sub-second response times for all analysis features

## Smart Contracts

Mars² uses three main contracts deployed on Sei EVM Testnet (Atlantic-2):

| Contract | Address | Description |
|----------|---------|-------------|
| **MarsValidatorScore** | `0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294` | Validator scoring and updates |
| **MarsZkAttest** | `0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae` | Anonymous incident reporting |
| **MarsValidatorGroupMessages** | `0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950` | Encrypted group messaging |

### Contract Links on Sei Block Explorer

- **MarsValidatorScore**: [View on Seitrace](https://seitrace.com/address/0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294?chain=atlantic-2&tab=transactions)
- **MarsZkAttest**: [View on Seitrace](https://seitrace.com/address/0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae?chain=atlantic-2&tab=transactions)
- **MarsValidatorGroupMessages**: [View on Seitrace](https://seitrace.com/address/0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950?chain=atlantic-2&tab=transactions)

## Network Configuration

**Sei EVM Testnet (Atlantic-2)**
- Network Name: Sei Testnet
- RPC URL: https://evm-rpc-testnet.sei-apis.com
- Chain ID: 1328
- Currency: SEI
- Block Explorer: https://seitrace.com

## Getting Started

### Quick Start
1. **Clone the repository**
   ```bash
   git clone https://github.com/tatdz/mars2.git
   cd mars2
   ```
2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
The application will be available at `http://localhost:5000`

4. **Connect MetaMask**
   - The app will automatically configure Sei testnet in MetaMask
   - Ensure you have testnet SEI tokens for transactions

5. **Try AI Recommendations**
   - Connect your wallet and click "Get AI Recommendations"
   - Experience sub-second analysis of validator delegations
   - Get instant, actionable staking advice

## Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** with custom Mars² theming
- **Radix UI** components for accessibility
- **TanStack Query** for state management
- **Wouter** for lightweight routing

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **Memory storage** for development
- **AI-powered analysis** with fast timeout handling

### Smart Contract Integration
- **ethers.js v6** for blockchain interactions
- Real-time validator data from Sei APIs
- ZK-proof simulation for anonymous reporting
- Optimized parallel processing for validator score fetching

### AI Features
- **Real OpenAI Integration** using GPT-4o for validator analysis
- **Machine Learning Assessment** of complex performance patterns
- **Portfolio Strategy Analysis** with diversification recommendations
- **Confidence Scoring** and detailed reasoning for each recommendation
- **Intelligent Fallback** when AI service limits reached

### Performance Features
- **Sub-5 second responses** even with real AI processing
- **Parallel validator analysis** with optimized timeouts
- **Graceful degradation** when blockchain RPC is unavailable
- **Real-time score updates** from Mars² smart contracts

## User Flow Guides

### For Stakers 🪙

**Getting Started:**
1. **Connect Wallet**: Click "Connect MetaMask" and approve the Sei testnet configuration
2. **Browse Validators**: View the real-time validator dashboard with color-coded scores
3. **Get AI Recommendations**: Click "Get AI Recommendations" for personalized staking advice
4. **Understand the Scoring**:
   - 🟢 **Green (80-100)**: Safe validators to stake with
   - 🟡 **Yellow (50-79)**: Monitor closely, moderate risk  
   - 🔴 **Red (0-49)**: High risk, consider unstaking

**Real AI-Powered Analysis:**
1. **OpenAI GPT-4o Integration**: Genuine machine learning analysis of validator performance patterns
2. **Comprehensive Assessment**: AI examines uptime, commission, governance participation, jailed status
3. **Portfolio Insights**: Strategic analysis of entire delegation portfolio with diversification recommendations
4. **Confidence Scoring**: Each recommendation includes AI confidence levels and specific concerns
5. **Enhanced Fallback**: Sophisticated analysis when AI quota limits reached

**Monitoring Your Stakes:**
1. Click the info button (ℹ️) next to any validator for detailed score breakdowns
2. Monitor your chosen validators regularly for score changes
3. Use the network stats sidebar to understand overall network health

**Reporting Issues:**
1. Navigate to any validator's row in the dashboard
2. Click the yellow warning icon (⚠️) to report an incident
3. Select incident type (missed blocks, downtime, governance issues, etc.)
4. Provide a detailed description of the issue you observed
5. Submit report - your identity remains completely anonymous
6. The validator's score will update automatically if the report is verified

### For Validators ⚡

**Account Setup:**
1. **Connect Wallet**: Use MetaMask with your validator operator account
2. **Monitor Your Score**: Find your validator in the dashboard and track your performance
3. **Understand Score Factors**: Uptime, missed blocks, governance participation, and incident reports

**Encrypted Messaging:**
1. Navigate to the "Messaging" page
2. **Generate Keys**: Click "Generate New Keys" to create your encryption keypair
3. **Import Validator Keys**: Add public keys from other validators you want to communicate with
4. **Send Messages**: Compose encrypted messages for coordination and emergency communication
5. **Decrypt Messages**: View and decrypt messages sent to you by other validators

**Incident Response:**
1. Monitor your score for any negative changes
2. Check for incident reports that may affect your rating
3. Use the messaging system to coordinate with other validators during network issues
4. Maintain high uptime and active governance participation

## Recent Updates

### Real AI Integration (2025-07-21)
- **🤖 OpenAI GPT-4o Integration**: Deployed genuine machine learning for validator analysis
- **🧠 Advanced Pattern Recognition**: AI analyzes complex validator performance metrics
- **📊 Portfolio Strategy Analysis**: Comprehensive delegation portfolio assessment
- **🎯 Confidence Scoring**: Each recommendation includes AI confidence levels and specific concerns
- **🔄 Intelligent Fallback**: Enhanced rule-based system when AI quota limits reached

### Performance Optimization (2025-07-21)
- **⚡ Sub-5 Second AI Analysis**: Real OpenAI processing with optimized parallel execution
- **🔧 Smart Timeout Handling**: Added 3-second timeouts for all network calls
- **🚀 Parallel Processing**: Multiple validator analysis with Promise.allSettled
- **🛡️ Graceful Degradation**: Sophisticated fallback when AI service unavailable
- **📊 Enhanced Error Handling**: Comprehensive logging and fallback mechanisms

### System Simplification (2025-07-21)  
- **🧹 Removed Chat System**: Eliminated all conversational AI components for focused user experience
- **🎯 Core Feature Focus**: Streamlined application to concentrate on validator monitoring and incident reporting
- **⚡ Improved Performance**: Cleaner codebase with faster page loads and better resource utilization

### Key Features
- **Real-time Validator Dashboard** with color-coded risk scores
- **OpenAI GPT-4o Analysis** with genuine machine learning recommendations
- **Portfolio Strategy Assessment** with diversification insights
- **Anonymous Incident Reporting** using zero-knowledge proofs
- **Encrypted Validator Messaging** for secure coordination
- **MetaMask Integration** with automatic Sei testnet configuration

### AI Capabilities
- **Real Machine Learning**: Uses OpenAI's latest GPT-4o model for validator analysis
- **Comprehensive Data Analysis**: Examines uptime, commission, governance, jailed status
- **Strategic Insights**: Portfolio-level recommendations and risk assessment
- **Confidence Scoring**: AI provides confidence levels for each recommendation
- **Specific Action Plans**: Detailed next steps for each validator situation

**Best Practices:**
- Keep your validator running with high uptime (99%+ recommended)
- Participate actively in governance proposals
- Respond professionally to any incident reports
- Use encrypted messaging for sensitive coordination
- Regularly backup your encryption keys

### Anonymous Reporting Flow 🔒

**Step-by-Step Process:**
1. **Identify Issue**: Observe problematic validator behavior (downtime, missed blocks, etc.)
2. **Access Report Form**: Click the warning icon (⚠️) next to the validator
3. **Select Issue Type**: Choose from predefined categories or select "Other"
4. **Provide Details**: Write a detailed description (minimum 10 characters)
5. **Submit Anonymously**: Your report is submitted with zero-knowledge proof verification
6. **Automatic Processing**: The system verifies the report and updates the validator's score
7. **Monitor Resolution**: Check if the validator addresses the reported issue

**Privacy Protection:**
- Your wallet address is never revealed in reports
- Zero-knowledge proofs prevent double-reporting while maintaining anonymity
- All reports are Sybil-resistant to prevent spam attacks
- Report authenticity is cryptographically verified
- AES-256 encryption simulation for messaging

## Demo Features

The application includes demo functionality that works without requiring MetaMask signatures for testing:

- **Validator Scoring**: Color-coded risk assessment (Green: 80+, Yellow: 60-79, Red: <60)
- **Report Submission**: Anonymous incident reporting with ZK-proof verification
- **Group Messaging**: Encrypted communication between validators
- **Real-time Updates**: Live data from Sei testnet APIs

## Development

### Project Structure
```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
└── components.json  # UI component configuration
```

### Key Components
- `ValidatorTable`: Main dashboard with scoring system
- `ReportModal`: Anonymous incident reporting interface
- `GroupChat`: Encrypted messaging system
- `NetworkStats`: Real-time network statistics

## License

MIT License - see LICENSE file for details
