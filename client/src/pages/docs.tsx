import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Lock, 
  Users, 
  Zap,
  BookOpen,
  FileText,
  Settings,
  HelpCircle,
  ExternalLink
} from "lucide-react";

const docSections = [
  {
    id: "overview",
    title: "Overview",
    icon: BookOpen,
    content: {
      title: "Mars² Staking Security Explorer",
      description: "Real-time validator monitoring and risk assessment for Sei EVM testnet",
      sections: [
        {
          title: "What is Mars²?",
          content: "Mars² is a comprehensive staking security platform that helps delegators make informed decisions by providing real-time validator performance metrics, anonymous incident reporting, and secure validator communication channels."
        },
        {
          title: "Key Features",
          content: "• Real-time validator scoring and risk assessment\n• Anonymous incident reporting with zero-knowledge proofs\n• Encrypted validator group messaging\n• Plain English recommendations for stakers"
        },
        {
          title: "Network Support",
          content: "Currently supports Sei EVM Testnet (Atlantic-2) with plans to expand to mainnet and other Cosmos-based networks."
        }
      ]
    }
  },
  {
    id: "scoring",
    title: "Validator Scoring",
    icon: Shield,
    content: {
      title: "Understanding Validator Scores",
      description: "How Mars² calculates and presents validator risk assessments",
      sections: [
        {
          title: "Score Calculation",
          content: "Validator scores range from 0-100 and are calculated based on:\n• Uptime percentage (40% weight)\n• Block production consistency (30% weight)\n• Governance participation (20% weight)\n• Community reports and incidents (10% weight)"
        },
        {
          title: "Score Categories",
          content: "🟢 Green (80-100): Safe to stake freely\n🟡 Yellow (50-79): Monitor closely, acceptable risk\n🔴 Red (0-49): Consider unstaking immediately"
        },
        {
          title: "Real-time Updates",
          content: "Scores are updated every 30 seconds using live data from Sei blockchain explorers and on-chain smart contracts."
        }
      ]
    }
  },
  {
    id: "reporting",
    title: "Anonymous Reporting",
    icon: AlertTriangle,
    content: {
      title: "Incident Reporting System",
      description: "Submit anonymous validator incident reports using zero-knowledge proofs",
      sections: [
        {
          title: "Privacy Protection",
          content: "All reports are submitted anonymously using zero-knowledge proofs. Your identity is never revealed, but double-reporting is prevented through cryptographic nullifiers."
        },
        {
          title: "Report Types",
          content: "• Missed blocks (>10 in 1 hour)\n• Validator jailed events\n• Network downtime incidents\n• Double signing violations\n• Other network disruptions"
        },
        {
          title: "Impact on Scores",
          content: "Verified reports automatically adjust validator scores based on incident severity. Community consensus helps maintain report accuracy."
        }
      ]
    }
  },
  {
    id: "messaging",
    title: "Validator Messages",
    icon: Lock,
    content: {
      title: "Encrypted Group Communication",
      description: "Secure messaging system for validator coordination",
      sections: [
        {
          title: "End-to-End Encryption",
          content: "Messages are encrypted using AES-256-GCM with validator-generated keys. Only group members can decrypt and read messages."
        },
        {
          title: "Key Management",
          content: "Validators can generate new encryption keys, import existing ones, or share keys securely with trusted validators."
        },
        {
          title: "Emergency Transparency",
          content: "During critical network events, messages may be revealed to stakers for transparency and coordination as outlined in validator agreements."
        }
      ]
    }
  },
  {
    id: "integration",
    title: "MetaMask Integration",
    icon: Settings,
    content: {
      title: "Wallet Connection Guide",
      description: "How to connect and interact with Mars² using MetaMask",
      sections: [
        {
          title: "Network Configuration",
          content: "Mars² automatically configures MetaMask for Sei EVM Testnet:\n• Network Name: Sei Testnet\n• RPC URL: https://evm-rpc-testnet.sei-apis.com\n• Chain ID: 1328\n• Currency: SEI"
        },
        {
          title: "Required Permissions",
          content: "Mars² requests minimal permissions:\n• Account access for identity verification\n• Transaction signing for reports and messages\n• Network switching for Sei testnet"
        },
        {
          title: "Security Best Practices",
          content: "• Only connect trusted wallets\n• Verify transaction details before signing\n• Keep your seed phrase secure\n• Use hardware wallets when possible"
        }
      ]
    }
  },
  {
    id: "contracts",
    title: "Smart Contracts",
    icon: FileText,
    content: {
      title: "Sei EVM Smart Contracts",
      description: "Mars² smart contract addresses and explorer links on Sei testnet",
      sections: [
        {
          title: "MarsValidatorScore Contract",
          content: "Address: 0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294\n\nThis contract handles validator scoring and score updates based on performance metrics and incident reports.\n\nExplorer: https://seitrace.com/address/0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294?chain=atlantic-2&tab=transactions"
        },
        {
          title: "MarsZkAttest Contract", 
          content: "Address: 0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae\n\nThis contract manages anonymous incident reporting using zero-knowledge proofs for privacy-preserving attestations.\n\nExplorer: https://seitrace.com/address/0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae?chain=atlantic-2&tab=transactions"
        },
        {
          title: "MarsValidatorGroupMessages Contract",
          content: "Address: 0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950\n\nThis contract enables encrypted group messaging between validators for coordination and transparency.\n\nExplorer: https://seitrace.com/address/0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950?chain=atlantic-2&tab=transactions"
        }
      ]
    }
  },
  {
    id: "userflow",
    title: "User Flow",
    icon: Users,
    content: {
      title: "How to Use Mars²",
      description: "Step-by-step guides for stakers and validators",
      sections: [
        {
          title: "For Stakers",
          content: "1. Connect MetaMask wallet to Sei testnet\n2. Browse validator dashboard to see real-time scores\n3. Use color-coded system:\n   • Green (80-100): Safe validators to stake with\n   • Yellow (50-79): Monitor closely, moderate risk\n   • Red (0-49): High risk, consider unstaking\n4. Click info button for detailed score breakdowns\n5. Report incidents anonymously if you observe validator issues\n6. Monitor your chosen validators regularly for score changes"
        },
        {
          title: "For Validators",
          content: "1. Connect MetaMask wallet to access validator features\n2. Monitor your own score on the dashboard\n3. Set up encrypted messaging:\n   • Generate secure keys in messaging section\n   • Import keys from other validators you trust\n   • Send encrypted messages to coordinate with other validators\n4. Respond to incident reports professionally\n5. Maintain high uptime and governance participation\n6. Use messaging system for emergency coordination"
        },
        {
          title: "Anonymous Reporting Flow",
          content: "1. Navigate to any validator's row in the dashboard\n2. Click the yellow warning icon to report an incident\n3. Select incident type (missed blocks, downtime, etc.)\n4. Provide detailed description of the issue\n5. Submit report - your identity remains anonymous\n6. Report is verified using zero-knowledge proofs\n7. Validator's score updates automatically if report is valid\n8. Monitor the validator to see if issue is resolved"
        }
      ]
    }
  },
  {
    id: "api",
    title: "API Reference",
    icon: FileText,
    content: {
      title: "Developer Documentation",
      description: "Integration guides and API endpoints for developers",
      sections: [
        {
          title: "REST API Endpoints",
          content: "• GET /api/sei/validators - Fetch all validator data\n• POST /api/reports - Submit incident reports\n• GET /api/scores/{address} - Get validator score\n• WebSocket /ws - Real-time score updates"
        },
        {
          title: "Data Sources",
          content: "• Sei blockchain explorers for validator data\n• On-chain events for real-time updates\n• Community reports for incident tracking"
        },
        {
          title: "Rate Limits",
          content: "API calls are rate-limited to ensure fair usage:\n• Validator data: 1 request per 30 seconds\n• Report submissions: 1 per incident per user\n• Messages: 10 per hour per validator"
        }
      ]
    }
  }
];

export function DocsPage() {
  const [selectedSection, setSelectedSection] = useState("overview");
  
  const currentSection = docSections.find(section => section.id === selectedSection);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Navigation */}
        <div className="lg:col-span-1">
          <Card className="bg-dark-card border-gray-700 sticky top-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Documentation</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {docSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setSelectedSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                        selectedSection === section.id
                          ? "bg-purple-accent text-white"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{section.title}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {currentSection && (
            <Card className="bg-dark-card border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <currentSection.icon className="w-6 h-6 text-purple-accent" />
                  <div>
                    <CardTitle className="text-white text-2xl">
                      {currentSection.content.title}
                    </CardTitle>
                    <p className="text-gray-400 mt-1">
                      {currentSection.content.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentSection.content.sections.map((section, index) => (
                  <div key={index} className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">
                      {section.title}
                    </h3>
                    <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                      {section.content}
                    </div>
                    {index < currentSection.content.sections.length - 1 && (
                      <Separator className="bg-gray-600" />
                    )}
                  </div>
                ))}

                {/* Additional Info Cards */}
                {selectedSection === "overview" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <Card className="bg-dark-bg border-gray-600">
                      <CardContent className="pt-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="w-5 h-5 text-green-400" />
                          <span className="font-semibold text-white">Active Validators</span>
                        </div>
                        <p className="text-2xl font-bold text-green-400">100</p>
                        <p className="text-xs text-gray-400">Monitored on Sei testnet</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-dark-bg border-gray-600">
                      <CardContent className="pt-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Eye className="w-5 h-5 text-purple-accent" />
                          <span className="font-semibold text-white">Reports Filed</span>
                        </div>
                        <p className="text-2xl font-bold text-white">156</p>
                        <p className="text-xs text-white">Anonymous & verified</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {selectedSection === "scoring" && (
                  <div className="bg-dark-bg border border-gray-600 rounded-lg p-4 mt-6">
                    <h4 className="font-semibold text-white mb-3">Score Examples</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Validator with 99.9% uptime</span>
                        <Badge className="bg-green-500 text-white">95 Score</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Validator with recent downtime</span>
                        <Badge className="bg-yellow-500 text-white">72 Score</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Validator with slashing event</span>
                        <Badge className="bg-red-500 text-white">25 Score</Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm text-gray-400 pt-4 border-t border-gray-600">
                  <HelpCircle className="w-4 h-4" />
                  <span>Need help? Contact the Mars² team or check our</span>
                  <a href="#" className="text-purple-accent hover:text-purple-300 inline-flex items-center space-x-1">
                    <span>GitHub repository</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}