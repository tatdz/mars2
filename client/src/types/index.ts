export interface Validator {
  id?: string;
  moniker?: string;
  operator_address: string;
  consensus_pubkey: any;
  jailed: boolean;
  status: string;
  tokens: string;
  delegator_shares: string;
  description: {
    moniker: string;
    identity: string;
    website: string;
    security_contact: string;
    details: string;
  };
  unbonding_height: string;
  unbonding_time: string;
  commission: {
    commission_rates: {
      rate: string;
      max_rate: string;
      max_change_rate: string;
    };
    update_time: string;
  };
  min_self_delegation: string;
  rank?: number;
  mintscan_image?: string;
  uptime?: number;
  uptime_periods?: number[];
  missed_blocks?: number;
  missed_blocks_periods?: number[];
  slashed?: boolean;
  signing_info?: {
    address: string;
    start_height: string;
    index_offset: string;
    jailed_until: string;
    tombstoned: boolean;
    missed_blocks_counter: string;
  };
  recent_rewards?: any[];
  votes?: any[];
  // Mars² specific fields
  mars_score?: number;
  mars_status?: string;
  voting_power?: number;
  recent_reports?: number;
  last_updated?: string;
}

export interface ValidatorScore {
  validator: string;
  score: number;
  color: 'green' | 'yellow' | 'red';
  events: ScoreEvent[];
}

export interface ScoreEvent {
  timestamp: number;
  reason: string;
  impact: number;
  reporter?: string;
}

export interface AttestationData {
  nullifier: string;
  validator: string;
  impact: number;
  reason: string;
}

export interface EncryptedMessage {
  index: number;
  sender: string;
  ciphertext: string;
  signature: string;
  timestamp: number;
  revealed: boolean;
  plaintext?: string;
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface NetworkStats {
  activeValidators: number;
  networkUptime: number;
  totalReports: number;
  totalMessages: number;
  revealedMessages: number;
  encryptedMessages: number;
}
