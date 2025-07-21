import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Shield, UserX, Lock, Database, TrendingUp, Wallet, Search, AlertTriangle } from "lucide-react";

const contractAddresses = [
  {
    name: "MarsValidatorScore",
    address: "0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294",
    url: "https://seitrace.com/address/0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294?chain=atlantic-2&tab=transactions",
    color: "text-validator-green",
  },
  {
    name: "MarsZkAttest",
    address: "0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae",
    url: "https://seitrace.com/address/0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae?chain=atlantic-2&tab=transactions",
    color: "text-validator-yellow",
  },
  {
    name: "MarsValidatorGroupMessages",
    address: "0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950",
    url: "https://seitrace.com/address/0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950?chain=atlantic-2&tab=transactions",
    color: "text-purple-400",
  },
];

const features = [
  {
    icon: TrendingUp,
    title: "Automated validator risk scoring",
    description: "Real-time scoring based on uptime, missed blocks, and governance participation",
    color: "text-validator-green",
  },
  {
    icon: UserX,
    title: "Anonymous, Sybil-resistant incident reports",
    description: "Zero-knowledge proofs ensure anonymous reporting while preventing spam",
    color: "text-validator-yellow",
  },
  {
    icon: Lock,
    title: "Encrypted validator group messages",
    description: "AES-256 encrypted on-chain messaging with selective revelation",
    color: "text-sei-blue",
  },
  {
    icon: Database,
    title: "On-chain storage and verification",
    description: "All data stored permanently on Sei EVM testnet for transparency",
    color: "text-purple-400",
  },
];

const techStack = [
  { category: "Frontend", tech: "React + ethers.js v6" },
  { category: "Wallet", tech: "MetaMask" },
  { category: "Contracts", tech: "Solidity 0.8.28" },
  { category: "Network", tech: "Sei EVM Testnet" },
  { category: "Encryption", tech: "AES-256 + Ed25519" },
  { category: "Data Feed", tech: "Sei Explorers API" },
];

const userJourney = [
  {
    icon: Wallet,
    title: "Connect Wallet",
    description: "Connect MetaMask to Sei EVM testnet",
    color: "text-sei-blue",
  },
  {
    icon: Search,
    title: "Browse Validators",
    description: "View real-time scores and performance",
    color: "text-validator-green",
  },
  {
    icon: AlertTriangle,
    title: "Report & Collaborate",
    description: "Submit reports and read encrypted messages",
    color: "text-validator-yellow",
  },
];

const colorLegend = [
  { range: "80–100", color: "text-validator-green bg-validator-green", label: "Stake freely" },
  { range: "50–79", color: "text-validator-yellow bg-validator-yellow", label: "Monitor closely" },
  { range: "0–49", color: "text-validator-red bg-validator-red", label: "Unstake" },
];

const troubleshooting = [
  {
    issue: "Attest already exists",
    solution: "nullifier is reused",
  },
  {
    issue: "Message not revealed",
    solution: "already revealed or invalid index",
  },
  {
    issue: "Wallet not connected",
    solution: "add Sei EVM testnet in MetaMask",
  },
];

export default function Docs() {
  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Mars² Documentation</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Complete technical documentation for the Mars² staking security explorer on Sei EVM testnet.
          </p>
        </div>

        {/* Problem Statement & Mission */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-dark-card border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl">Problem Statement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Validators on Sei often miss blocks or become jailed. Stakers cannot report or respond securely. 
                Mars² solves this with scoring, reporting, and encrypted coordination.
              </p>
              
              <div>
                <h4 className="font-semibold mb-2">Mission</h4>
                <p className="text-gray-300 text-sm">
                  To give delegators real-time staking intelligence and give validators encrypted onchain channels—improving 
                  security for the entire Sei network.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-gray-700">
            <CardHeader>
              <CardTitle className="text-xl">Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <feature.icon className={`w-5 h-5 mt-0.5 ${feature.color}`} />
                    <div>
                      <div className="font-medium">{feature.title}</div>
                      <div className="text-sm text-gray-400">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contract Addresses */}
        <Card className="bg-dark-card border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl">Deployed Contract Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {contractAddresses.map((contract, index) => (
                <div key={index} className="space-y-3">
                  <div className={`font-medium ${contract.color}`}>{contract.name}</div>
                  <div className="text-gray-400 font-mono text-xs break-all">{contract.address}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-gray-600 hover:bg-gray-700"
                  >
                    <a href={contract.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View on Explorer
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card className="bg-dark-card border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl">Tech Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {techStack.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="font-medium text-gray-300">{item.category}</div>
                  <div className="text-gray-400">{item.tech}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Journey */}
        <Card className="bg-dark-card border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl">User Journey</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {userJourney.map((step, index) => (
                <div key={index} className="text-center space-y-3">
                  <div className={`w-12 h-12 ${step.color.replace('text-', 'bg-')} rounded-full flex items-center justify-center mx-auto`}>
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">{index + 1}. {step.title}</h4>
                    <p className="text-sm text-gray-400">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Color Code Legend */}
        <Card className="bg-dark-card border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl">Color Code Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-4">Score</th>
                    <th className="text-left py-2 px-4">Color</th>
                    <th className="text-left py-2 px-4">Action Suggested</th>
                  </tr>
                </thead>
                <tbody>
                  {colorLegend.map((item, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="py-2 px-4">{item.range}</td>
                      <td className="py-2 px-4">
                        <Badge className={`${item.color} bg-opacity-20`}>
                          {item.range}
                        </Badge>
                      </td>
                      <td className="py-2 px-4 text-gray-400">{item.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="bg-dark-card border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl">Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {troubleshooting.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2">
                  <span className="font-medium text-validator-red">"{item.issue}":</span>
                  <span className="text-gray-400">{item.solution}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Network Information */}
        <Card className="bg-dark-card border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl">Network Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Sei EVM Testnet Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network Name:</span>
                    <span>Sei EVM Testnet</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Chain ID:</span>
                    <span>713715</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">RPC URL:</span>
                    <span className="font-mono text-xs">https://evm-rpc.testnet.sei.io</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Explorer:</span>
                    <span>https://seitrace.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Currency:</span>
                    <span>SEI</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">API Endpoints</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="text-gray-400">Validator Data:</div>
                    <div className="font-mono text-xs break-all">https://sei.explorers.guru/api/validators</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Smart Contracts:</div>
                    <div className="font-mono text-xs">Deployed on Sei EVM Testnet (Atlantic-2)</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
