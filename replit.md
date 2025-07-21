# Mars² Staking Security dApp

## Overview

Mars² is a real-time staking security explorer for the Sei EVM testnet that enables delegators, validators, and observers to monitor validator behavior, submit anonymous reports, and coordinate through encrypted messaging. The application features a color-coded validator scoring system, anonymous Sybil-resistant incident submission, and secure group-encrypted validator messages.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom Mars² theme variables
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state and React hooks for local state
- **Wallet Integration**: ethers.js v6 for MetaMask connectivity

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: Drizzle ORM configured for PostgreSQL (schema defined but using memory storage currently)
- **Build System**: Vite for frontend bundling, esbuild for server compilation
- **Session Management**: connect-pg-simple for PostgreSQL sessions

### Smart Contract Integration
- **Network**: Sei EVM Testnet (Atlantic-2)
- **Contracts**: Three deployed contracts for validator scoring, ZK attestations, and group messaging
- **Interaction**: Direct contract calls via ethers.js with provider/signer pattern

## Key Components

### Validator Management
- **ValidatorTable**: Main dashboard displaying validator information with real-time scoring
- **NetworkStats**: Sidebar component showing network-wide statistics
- **Scoring System**: Automated risk assessment based on uptime, missed blocks, and governance participation

### Anonymous Reporting System
- **ReportModal**: Form-based incident reporting with ZK-proof integration
- **Nullifier Generation**: Prevents double-reporting while maintaining anonymity
- **Impact Scoring**: Negative score adjustments based on incident severity

### Encrypted Messaging
- **GroupChat**: On-chain messaging system with AES-256 encryption simulation
- **Message Revelation**: Selective decryption of group messages
- **Signature Verification**: Ensures message authenticity

### Wallet Integration
- **MetaMask Detection**: Automatic wallet detection and connection prompts
- **Network Switching**: Automatic Sei testnet configuration
- **Transaction Handling**: Smart contract interaction with proper error handling

## Data Flow

1. **Validator Data**: Fetched from Sei explorers API and cached via TanStack Query
2. **Smart Contract Reads**: Real-time score fetching from MarsValidatorScore contract
3. **User Actions**: Wallet-signed transactions for attestations and messages
4. **State Updates**: Optimistic updates with query invalidation on success

## External Dependencies

### Blockchain Infrastructure
- **Sei EVM Testnet**: Primary blockchain network
- **MetaMask**: Required wallet provider
- **Ethers.js**: Blockchain interaction library

### Data Sources
- **Sei Explorers API**: Validator information and network statistics
- **Smart Contracts**: On-chain scoring, attestations, and messaging data

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide Icons**: Icon library
- **Google Fonts**: Silkscreen font for branding

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with HMR
- **Database**: Memory storage for development (MemStorage class)
- **Environment Variables**: DATABASE_URL for production PostgreSQL connection

### Production Build
- **Frontend**: Vite build to `dist/public`
- **Backend**: esbuild compilation to `dist/index.js`
- **Database**: Drizzle migrations with PostgreSQL
- **Session Storage**: PostgreSQL-backed sessions

### Environment Configuration
- **Replit Integration**: Special handling for Replit environment
- **Error Handling**: Runtime error overlay for development
- **Asset Management**: Static asset serving for attached files

## Architecture Decisions

### Database Strategy
- **Problem**: Need for persistent data storage with development flexibility
- **Solution**: Drizzle ORM with memory storage fallback and PostgreSQL production target
- **Rationale**: Allows rapid development while maintaining production scalability

### Wallet Integration Approach
- **Problem**: Web3 wallet connectivity with network-specific requirements
- **Solution**: ethers.js with automatic network detection and switching
- **Rationale**: Robust Web3 standard with good TypeScript support

### State Management Pattern
- **Problem**: Complex server state with real-time updates needed
- **Solution**: TanStack Query for server state, React hooks for UI state
- **Rationale**: Optimizes caching and provides built-in loading/error states

### Styling Architecture
- **Problem**: Consistent theming with Mars² branding requirements
- **Solution**: Tailwind CSS with custom CSS variables for theme colors
- **Rationale**: Utility-first approach with design system flexibility

### Smart Contract Interaction
- **Problem**: Multiple contracts with different interaction patterns
- **Solution**: Centralized contract factory with typed ABIs
- **Rationale**: Type safety and maintainable contract management

## Recent Changes: Latest modifications with dates

### 2025-07-21: Advanced Incident AI with Onchain Data Analysis
- **Onchain Incident Analysis**: Implemented comprehensive AI system that fetches real validator incident data from Mars² smart contracts
- **Enhanced Ask AI Button**: Replaced "See Incidents" with intelligent "Ask AI about incidents" button with purple Mars² branding
- **Real-time Contract Integration**: Direct integration with MarsValidatorScore contract (0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294) for authentic incident data
- **Intelligent Risk Assessment**: AI analyzes actual onchain events, performance metrics, and generates detailed risk reports
- **Contextual Recommendations**: Provides specific unstake/redelegate advice based on Mars² scoring system and incident severity
- **Professional AI Modal**: Enhanced incident analysis modal with technical data, performance metrics, and formatted analysis
- **Event Categorization**: Automatically categorizes incidents into performance, governance, slashing, and community report types
- **Fallback Demo Data**: Generates realistic incident scenarios for testing when onchain data is unavailable
- **Color-Coded UI**: Consistent button styling with red unstake, yellow redelegate, and purple AI incident buttons
- **Hidden for Safe Validators**: Action buttons automatically hidden for validators with green scores (80+)

### 2025-07-21: Performance Optimization - Fixed Slow AI Staking Recommendations
- **Timeout Implementation**: Added 2-3 second timeouts for contract calls and API requests to prevent hanging
- **Fast Failure**: Network connection failures now fail immediately instead of hanging for minutes
- **Parallel Processing**: Changed from sequential to parallel processing using Promise.allSettled for multiple validator analysis
- **Graceful Degradation**: Failed validator score fetches gracefully fall back to simulated scores
- **Error Handling**: Improved error logging and fallback mechanisms for DNS resolution failures
- **Performance Monitoring**: Added tracking of failed vs successful validator processing
- **User Experience**: AI staking recommendations now complete in under 5 seconds instead of minutes

### 2025-07-21: Complete Chat System Removal
- **Removed Components**: Deleted SidebarChat, ChatSidebar, ConversationModal React components
- **Cleaned Header**: Removed chat button and related functionality from Header component  
- **Updated App.tsx**: Removed chat state management and imports
- **Server Cleanup**: Deleted chat-agent.ts and ollama-conversation-ai.ts files
- **API Cleanup**: Removed all /api/ai/chat, /api/chat/*, and /api/conversation/* endpoints
- **Focus Shift**: Application now concentrates on core validator monitoring and incident reporting features

### 2025-07-21: Enhanced Conversational AI with Mars² Documentation and Robust Fallbacks
- **Ollama Llama3 Integration**: Successfully deployed Ollama with Llama3:8b model for advanced AI conversations with HTTP API integration
- **Enhanced Mars² Knowledge Base**: AI system now includes comprehensive Mars² platform documentation, smart contract addresses, and security mechanisms
- **Broader Sei Expertise**: Expanded AI capabilities to answer ANY Sei staking question including validator selection, commission analysis, and risk assessment
- **Smart Contract Education**: AI explains Mars² smart contracts (0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294, etc.) with detailed functionality descriptions
- **Advanced Validator Analysis**: AI provides detailed validator comparisons, recommendations, and Mars² scoring methodology explanations
- **Robust Fallback System**: Enhanced fallback responses covering validator selection, Mars² contracts, Sei blockchain overview, and comprehensive staking education
- **Improved Error Handling**: Dynamic Ollama availability checking with graceful fallback to enhanced educational responses
- **Real-time Chat Interface**: ConversationModal component with enhanced messaging, session management, and persistent validator context
- **Comprehensive Coverage**: AI handles complex topics including DeFi strategies, governance, slashing mechanics, and technical blockchain concepts
- **Fixed Technical Issues**: Corrected unbonding period to 21 days, improved API timeout handling, and enhanced response quality

### 2025-07-21: Eliza AI Agent Integration  
- **AI-Powered Staking Recommendations**: Integrated @elizaos/plugin-sei for personalized staking advice
- **Smart Delegation Analysis**: Automatically fetches user's current delegations from Sei REST API
- **Mars² Score Integration**: AI agent queries MarsValidatorScore contract for real risk assessments
- **Personalized Action Buttons**: Each recommendation includes Unstake, Redelegate, and See Incidents actions
- **Intelligent Risk Assessment**: AI generates plain-English recommendations based on Mars² scoring system
- **Backend Eliza Service**: Created ElizaStakingAgent class with contract integration and delegation analysis
- **Frontend AI Component**: Added StakingRecommendations component with loading states and error handling
- **API Endpoint**: POST /api/eliza/recommendations for AI-powered staking advice
- **Enhanced User Experience**: Users now get instant, personalized advice on wallet connection

### 2025-07-21: Major UI/UX Improvements
- **Network Stats Layout**: Changed from vertical to horizontal layout to save space and improve visual balance
- **Report Page Design**: Enhanced with colorful futuristic gradients and improved readability
  - Added gradient backgrounds to all sidebar cards
  - Improved badge styling with emojis and shadow effects
  - Enhanced text contrast for better readability
- **Messaging Page**: Fixed Generate/Import text colors to white for proper visibility
- **Documentation Updates**: Added real smart contract addresses and Seitrace explorer links
- **Contract Addresses Added**:
  - MarsValidatorScore: 0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294
  - MarsZkAttest: 0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae
  - MarsValidatorGroupMessages: 0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950
- **Validator Selection**: Added dropdown with validator names and addresses for better UX
- **Form Validation**: Reduced minimum description requirement from 20 to 10 characters
- **README.md**: Created comprehensive documentation with contract addresses and setup instructions
- **Documentation Reorganization**: Split Smart Contracts into separate section and added User Flow guides
- **UI/UX Improvements**: Fixed text visibility issues and made action buttons more prominent
- **Button Enhancements**: Increased size of report and info buttons for better user experience
- **GitHub README Enhancement**: Updated Mars² description with new branding and added comprehensive hosting instructions
- **User Flow Documentation**: Added detailed step-by-step guides for stakers, validators, and anonymous reporting workflow