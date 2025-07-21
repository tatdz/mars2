import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "./useWallet";
import { getContract } from "@/lib/contracts";
import { generateNullifier, encryptMessage, signMessage } from "@/lib/crypto";
import { AttestationData, EncryptedMessage } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useContracts() {
  const { signer, provider, isConnected } = useWallet();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get validator score
  const getValidatorScore = useCallback(async (validatorAddress: string): Promise<number> => {
    if (!provider) throw new Error("Provider not available");
    
    const contract = getContract("MarsValidatorScore", provider);
    const score = await contract.getScore(validatorAddress);
    return Number(score);
  }, [provider]);

  // Submit attestation
  const submitAttestation = useMutation({
    mutationFn: async (data: AttestationData) => {
      if (!signer || !isConnected) {
        throw new Error("Wallet not connected");
      }

      setIsSubmitting(true);
      
      try {
        const contract = getContract("MarsZkAttest", signer);
        
        // Check if already attested
        const hasAttested = await contract.hasAttested(data.nullifier);
        if (hasAttested) {
          throw new Error("You have already submitted an attestation for this incident");
        }

        const tx = await contract.attest(
          data.nullifier,
          data.validator,
          data.impact,
          data.reason
        );
        
        await tx.wait();
        return tx.hash;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: (txHash) => {
      toast({
        title: "Attestation Submitted",
        description: `Transaction hash: ${txHash.slice(0, 10)}...`,
      });
      queryClient.invalidateQueries({ queryKey: ["validators"] });
    },
    onError: (error: any) => {
      toast({
        title: "Attestation Failed",
        description: error.message || "Failed to submit attestation",
        variant: "destructive",
      });
    },
  });

  // Get messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ["messages"],
    queryFn: async (): Promise<EncryptedMessage[]> => {
      if (!provider) return [];
      
      const contract = getContract("MarsValidatorGroupMessages", provider);
      const messagesData = await contract.getMessages();
      
      return messagesData.map((msg: any, index: number) => ({
        index,
        sender: msg.sender,
        ciphertext: msg.ciphertext,
        signature: msg.signature,
        timestamp: Number(msg.timestamp) * 1000,
        revealed: msg.revealed,
        plaintext: msg.revealed ? msg.plaintext : undefined,
      }));
    },
    enabled: !!provider,
    refetchInterval: 30000,
  });

  // Post message
  const postMessage = useMutation({
    mutationFn: async (messageText: string) => {
      if (!signer || !isConnected) {
        throw new Error("Wallet not connected");
      }

      const encrypted = await encryptMessage(messageText);
      const signature = await signMessage(messageText, signer);
      
      const contract = getContract("MarsValidatorGroupMessages", signer);
      const tx = await contract.postMessage(
        ethers.toUtf8Bytes(encrypted),
        ethers.toUtf8Bytes(signature)
      );
      
      await tx.wait();
      return tx.hash;
    },
    onSuccess: (txHash) => {
      toast({
        title: "Message Posted",
        description: `Transaction hash: ${txHash.slice(0, 10)}...`,
      });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Post Message",
        description: error.message || "Failed to post message",
        variant: "destructive",
      });
    },
  });

  // Reveal message
  const revealMessage = useMutation({
    mutationFn: async ({ index, plaintext }: { index: number; plaintext: string }) => {
      if (!signer || !isConnected) {
        throw new Error("Wallet not connected");
      }

      const contract = getContract("MarsValidatorGroupMessages", signer);
      const tx = await contract.revealMessage(index, plaintext);
      
      await tx.wait();
      return tx.hash;
    },
    onSuccess: (txHash) => {
      toast({
        title: "Message Revealed",
        description: `Transaction hash: ${txHash.slice(0, 10)}...`,
      });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Reveal Message",
        description: error.message || "Failed to reveal message",
        variant: "destructive",
      });
    },
  });

  // Submit report
  const submitReport = useMutation({
    mutationFn: async (data: {
      validatorAddress: string;
      incidentType: string;
      severity: string;
      description: string;
      evidence: string;
    }) => {
      if (!signer || !isConnected) {
        throw new Error("Wallet not connected");
      }

      setIsSubmitting(true);
      
      try {
        const contract = getContract("MarsZkAttest", signer);
        
        // Generate nullifier for the report
        const nullifier = await generateNullifier(data.validatorAddress, data.incidentType);
        
        // Check if already reported
        const hasAttested = await contract.hasAttested(nullifier);
        if (hasAttested) {
          throw new Error("You have already submitted a report for this incident");
        }

        // Calculate impact based on severity
        const impactMap: { [key: string]: number } = {
          low: -5,
          medium: -15,
          high: -25,
          critical: -40,
        };
        
        const impact = impactMap[data.severity] || -10;
        
        const tx = await contract.attest(
          nullifier,
          data.validatorAddress,
          impact,
          `${data.incidentType}: ${data.description}`
        );
        
        await tx.wait();
        return tx.hash;
      } finally {
        setIsSubmitting(false);
      }
    },
    onSuccess: (txHash) => {
      toast({
        title: "Report Submitted Successfully",
        description: `Anonymous report submitted. Transaction: ${txHash.slice(0, 10)}...`,
      });
      queryClient.invalidateQueries({ queryKey: ["validators"] });
    },
    onError: (error: any) => {
      toast({
        title: "Report Submission Failed",
        description: error.message || "Failed to submit report",
        variant: "destructive",
      });
    },
  });

  return {
    getValidatorScore,
    submitAttestation,
    submitReport,
    postMessage,
    revealMessage,
    messages,
    isLoadingMessages,
    isSubmitting,
  };
}
