import { Link, useLocation } from "wouter";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/crypto";
import { RefreshCw } from "lucide-react";

export function Header() {
  const [location] = useLocation();
  const { address, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet();

  const navItems = [
    { href: "/", label: "Validators" },
    { href: "/docs", label: "Docs" },
  ];

  return (
    <header className="bg-dark-surface border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="font-silkscreen text-2xl text-sei-blue">Mars²</div>
            <span className="text-gray-400 text-sm hidden sm:block">
              Staking Security Explorer
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  className={`transition-colors ${
                    location === item.href
                      ? "text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {item.label}
                </a>
              </Link>
            ))}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {isConnected && address ? (
              <div className="flex items-center space-x-2 bg-dark-card px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-validator-green rounded-full"></div>
                <span className="text-sm">{formatAddress(address)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={disconnectWallet}
                  className="text-xs"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                disabled={isConnecting}
                className="bg-sei-blue hover:bg-sei-dark-blue transition-colors"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
