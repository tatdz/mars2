import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { WalletState } from "@/types";
import { addSeiNetwork, SEI_TESTNET_CONFIG } from "@/lib/contracts";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  });
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const { toast } = useToast();

  const updateWalletState = useCallback((updates: Partial<WalletState>) => {
    setWalletState(prev => ({ ...prev, ...updates }));
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      updateWalletState({ error: "MetaMask is not installed" });
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to use this application.",
        variant: "destructive",
      });
      return;
    }

    updateWalletState({ isConnecting: true, error: null });

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Check if we're on the correct network
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const expectedChainId = `0x${SEI_TESTNET_CONFIG.chainId.toString(16)}`;

      if (chainId !== expectedChainId) {
        try {
          await addSeiNetwork();
        } catch (networkError) {
          console.error("Failed to add Sei network:", networkError);
          toast({
            title: "Network Error",
            description: "Failed to add Sei EVM testnet. Please add it manually.",
            variant: "destructive",
          });
        }
      }

      // Set up provider and signer
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const newSigner = await newProvider.getSigner();
      
      setProvider(newProvider);
      setSigner(newSigner);

      updateWalletState({
        address: accounts[0],
        isConnected: true,
        isConnecting: false,
        error: null,
      });

      toast({
        title: "Wallet Connected",
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      updateWalletState({
        isConnecting: false,
        error: error.message || "Failed to connect wallet",
      });
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to MetaMask",
        variant: "destructive",
      });
    }
  }, [updateWalletState, toast]);

  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    updateWalletState({
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    });
    toast({
      title: "Wallet Disconnected",
      description: "Successfully disconnected from MetaMask",
    });
  }, [updateWalletState, toast]);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== walletState.address) {
        updateWalletState({ address: accounts[0] });
      }
    };

    const handleChainChanged = (chainId: string) => {
      const expectedChainId = `0x${SEI_TESTNET_CONFIG.chainId.toString(16)}`;
      if (chainId !== expectedChainId) {
        toast({
          title: "Wrong Network",
          description: "Please switch to Sei EVM testnet",
          variant: "destructive",
        });
      }
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [walletState.address, updateWalletState, disconnectWallet, toast]);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          const newProvider = new ethers.BrowserProvider(window.ethereum);
          const newSigner = await newProvider.getSigner();
          
          setProvider(newProvider);
          setSigner(newSigner);
          updateWalletState({
            address: accounts[0],
            isConnected: true,
          });
        }
      } catch (error) {
        console.error("Failed to check wallet connection:", error);
      }
    };

    checkConnection();
  }, [updateWalletState]);

  return {
    ...walletState,
    provider,
    signer,
    connectWallet,
    disconnectWallet,
  };
}
