import { ethers } from "ethers";
import { Contract } from "ethers";

// Contract addresses on Sei EVM Testnet
export const CONTRACT_ADDRESSES = {
  MarsValidatorScore: "0x2358F2a3A43aa1aD43A1B6A04D52E26b7c37B294",
  MarsZkAttest: "0x45d1DfaC9051d1B2552126D68caD5E6d3B9c5Cae",
  MarsValidatorGroupMessages: "0x9FE44Ee4805318bc5093A1daE2cc42A519dDD950",
};

// Simplified ABIs for the contracts
export const MARS_VALIDATOR_SCORE_ABI = [
  "function getScore(address validator) view returns (int256)",
  "function getEvents(address validator) view returns (tuple(string reason, int256 delta, uint256 timestamp)[])",
  "function applyScore(address validator, string reason, int256 delta) external",
];

export const MARS_ZK_ATTEST_ABI = [
  "function attest(bytes32 nullifier, address validator, int256 impact, string reason) external",
  "function hasAttested(bytes32 nullifier) view returns (bool)",
];

export const MARS_VALIDATOR_GROUP_MESSAGES_ABI = [
  "function postMessage(bytes calldata ciphertext, bytes calldata signature) external",
  "function revealMessage(uint256 index, string calldata plaintext) external",
  "function getMessages() view returns (tuple(address sender, bytes ciphertext, bytes signature, uint256 timestamp, bool revealed, string plaintext)[])",
  "function getMessageCount() view returns (uint256)",
];

export const SEI_TESTNET_CONFIG = {
  chainId: 713715,
  name: "Sei EVM Testnet",
  rpcUrl: "https://evm-rpc.testnet.sei.io",
  explorerUrl: "https://seitrace.com",
  currency: "SEI",
};

export function getContract(
  contractName: keyof typeof CONTRACT_ADDRESSES,
  signerOrProvider: ethers.Signer | ethers.Provider
): Contract {
  const address = CONTRACT_ADDRESSES[contractName];
  
  let abi: string[];
  switch (contractName) {
    case "MarsValidatorScore":
      abi = MARS_VALIDATOR_SCORE_ABI;
      break;
    case "MarsZkAttest":
      abi = MARS_ZK_ATTEST_ABI;
      break;
    case "MarsValidatorGroupMessages":
      abi = MARS_VALIDATOR_GROUP_MESSAGES_ABI;
      break;
    default:
      throw new Error(`Unknown contract: ${contractName}`);
  }
  
  return new ethers.Contract(address, abi, signerOrProvider);
}

export async function addSeiNetwork() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: `0x${SEI_TESTNET_CONFIG.chainId.toString(16)}`,
          chainName: SEI_TESTNET_CONFIG.name,
          nativeCurrency: {
            name: SEI_TESTNET_CONFIG.currency,
            symbol: SEI_TESTNET_CONFIG.currency,
            decimals: 18,
          },
          rpcUrls: [SEI_TESTNET_CONFIG.rpcUrl],
          blockExplorerUrls: [SEI_TESTNET_CONFIG.explorerUrl],
        },
      ],
    });
  } catch (error) {
    console.error("Failed to add Sei network:", error);
    throw error;
  }
}
