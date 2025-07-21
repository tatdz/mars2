import { ethers } from "ethers";

export function generateNullifier(address: string, eventId: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(address + eventId));
}

export async function encryptMessage(message: string, key?: string): Promise<string> {
  // In a real implementation, this would use proper AES-256 encryption
  // For now, we'll use a simple base64 encoding to simulate encryption
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(data)));
  return `encrypted_${base64}`;
}

export async function decryptMessage(ciphertext: string, key?: string): Promise<string> {
  // In a real implementation, this would decrypt using AES-256
  // For now, we'll decode the base64 to simulate decryption
  if (!ciphertext.startsWith('encrypted_')) {
    throw new Error('Invalid ciphertext format');
  }
  
  const base64 = ciphertext.substring(10); // Remove 'encrypted_' prefix
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

export async function signMessage(message: string, signer: ethers.Signer): Promise<string> {
  return await signer.signMessage(message);
}

export function verifySignature(message: string, signature: string, address: string): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function generateEventId(validatorAddress: string, reason: string, timestamp?: number): string {
  const ts = timestamp || Date.now();
  return ethers.keccak256(ethers.toUtf8Bytes(`${validatorAddress}_${reason}_${ts}`));
}
