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
      // Wait for MetaMask to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if MetaMask is locked
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length === 0) {
          // No accounts connected, request access
          const requestedAccounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          if (requestedAccounts.length === 0) {
            throw new Error("User rejected the connection request");
          }
        }
      } catch (requestError: any) {
        if (requestError.code === 4001) {
          throw new Error("User rejected the connection request");
        }
        if (requestError.code === -32002) {
          throw new Error("MetaMask is already processing a request. Please check MetaMask.");
        }
        throw requestError;
      }

      // Get current accounts after successful request
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      
      if (accounts.length === 0) {
        throw new Error("No accounts available. Please unlock MetaMask.");
      }

      // Check network and switch if needed
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const expectedChainId = `0x${SEI_TESTNET_CONFIG.chainId.toString(16)}`;

      if (chainId !== expectedChainId) {
        try {
          await addSeiNetwork();
          // Verify network switch
          const newChainId = await window.ethereum.request({ method: "eth_chainId" });
          if (newChainId !== expectedChainId) {
            console.warn("Network switch may have failed, but continuing...");
          }
        } catch (networkError: any) {
          console.error("Failed to add Sei network:", networkError);
          // Don't fail the connection for network issues, just warn
          toast({
            title: "Network Warning",
            description: "Could not switch to Sei testnet. Please switch manually in MetaMask.",
            variant: "destructive",
          });
        }
      }

      // Set up provider and signer with better error handling
      let newProvider: ethers.BrowserProvider;
      let newSigner: ethers.Signer;
      
      try {
        newProvider = new ethers.BrowserProvider(window.ethereum);
        newSigner = await newProvider.getSigner();
      } catch (providerError: any) {
        console.error("Provider setup failed:", providerError);
        throw new Error("Failed to initialize wallet provider. Please refresh and try again.");
      }
      
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
      
      let errorMessage = "Failed to connect to MetaMask";
      if (error.message.includes("User rejected")) {
        errorMessage = "Connection cancelled by user";
      } else if (error.message.includes("already processing")) {
        errorMessage = "MetaMask is busy. Please check MetaMask and try again.";
      } else if (error.message.includes("unlock")) {
        errorMessage = "Please unlock MetaMask and try again";
      } else if (error.code === -32603) {
        errorMessage = "MetaMask internal error. Please refresh and try again.";
      }
      
      updateWalletState({
        isConnecting: false,
        error: errorMessage,
      });
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
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
        // Wait for MetaMask to be ready
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          try {
            const newProvider = new ethers.BrowserProvider(window.ethereum);
            const newSigner = await newProvider.getSigner();
            
            setProvider(newProvider);
            setSigner(newSigner);
            updateWalletState({
              address: accounts[0],
              isConnected: true,
            });
          } catch (providerError) {
            console.error("Failed to setup provider on mount:", providerError);
            // Don't show error toast on mount, just log it
          }
        }
      } catch (error) {
        console.error("Failed to check wallet connection:", error);
        // Don't show error toast on mount check
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
