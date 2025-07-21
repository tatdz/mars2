# Mars² Staking Security dApp

A comprehensive real-time staking security explorer for the Sei EVM testnet that enables stakers and validators to monitor validator behavior, submit anonymous reports and coordinate through encrypted messaging.

## Features

- **Real-time Validator Monitoring**: Live scoring system with color-coded risk assessments
- **Anonymous Incident Reporting**: Zero-knowledge proof-based and Sibyl resistant reporting system
- **Encrypted Group Messaging**: Secure validator communication with key management
- **MetaMask Integration**: Wallet connectivity for Sei EVM testnet

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

1.**Clone the repository**
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

4. **Connect MetaMask**
   - The app will automatically configure Sei testnet in MetaMask
   - Ensure you have testnet SEI tokens for transactions

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

### Smart Contract Integration
- **ethers.js v6** for blockchain interactions
- Real-time validator data from Sei APIs
- ZK-proof simulation for anonymous reporting
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
