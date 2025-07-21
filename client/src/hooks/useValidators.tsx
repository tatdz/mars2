import { useQuery } from "@tanstack/react-query";
import { Validator, ValidatorScore } from "@/types";
import { scoreValidator } from "@/lib/scoring";
import { apiRequest } from "@/lib/queryClient";

async function fetchValidators(): Promise<Validator[]> {
  try {
    // Try our proxy first
    const response = await apiRequest('GET', '/api/sei/validators');
    const data = await response.json();
    return data.validators || [];
  } catch (error) {
    console.warn('Proxy failed, trying direct API call:', error);
    
    try {
      // Fallback to direct API call
      const response = await fetch('https://sei.explorers.guru/api/validators');
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      const data = await response.json();
      return data.validators || [];
    } catch (directError) {
      console.error('Direct API call also failed:', directError);
      
      // Return sample data for demonstration
      return [
        {
          operator_address: "seivaloper1example1",
          consensus_pubkey: { "@type": "cosmos.crypto.ed25519.PubKey", key: "example1" },
          jailed: false,
          status: "BOND_STATUS_BONDED",
          tokens: "1000000",
          delegator_shares: "1000000.000000000000000000",
          description: {
            moniker: "Validator One",
            identity: "",
            website: "",
            security_contact: "",
            details: "Example validator for demonstration"
          },
          unbonding_height: "0",
          unbonding_time: "1970-01-01T00:00:00Z",
          commission: {
            commission_rates: {
              rate: "0.050000000000000000",
              max_rate: "0.200000000000000000",
              max_change_rate: "0.010000000000000000"
            },
            update_time: "2024-01-01T00:00:00Z"
          },
          min_self_delegation: "1",
          rank: 1,
          uptime: 98.5
        },
        {
          operator_address: "seivaloper1example2",
          consensus_pubkey: { "@type": "cosmos.crypto.ed25519.PubKey", key: "example2" },
          jailed: false,
          status: "BOND_STATUS_BONDED", 
          tokens: "800000",
          delegator_shares: "800000.000000000000000000",
          description: {
            moniker: "Validator Two",
            identity: "",
            website: "",
            security_contact: "",
            details: "Example validator with lower uptime"
          },
          unbonding_height: "0",
          unbonding_time: "1970-01-01T00:00:00Z",
          commission: {
            commission_rates: {
              rate: "0.070000000000000000",
              max_rate: "0.200000000000000000", 
              max_change_rate: "0.010000000000000000"
            },
            update_time: "2024-01-01T00:00:00Z"
          },
          min_self_delegation: "1",
          rank: 2,
          uptime: 65.2
        },
        {
          operator_address: "seivaloper1example3",
          consensus_pubkey: { "@type": "cosmos.crypto.ed25519.PubKey", key: "example3" },
          jailed: true,
          status: "BOND_STATUS_UNBONDING",
          tokens: "200000", 
          delegator_shares: "200000.000000000000000000",
          description: {
            moniker: "Validator Three",
            identity: "",
            website: "",
            security_contact: "",
            details: "Example jailed validator"
          },
          unbonding_height: "1000",
          unbonding_time: "2024-06-01T00:00:00Z",
          commission: {
            commission_rates: {
              rate: "0.100000000000000000",
              max_rate: "0.200000000000000000",
              max_change_rate: "0.010000000000000000"
            },
            update_time: "2024-01-01T00:00:00Z"
          },
          min_self_delegation: "1",
          rank: 3,
          uptime: 25.8
        }
      ];
    }
  }
}

export function useValidators() {
  const query = useQuery({
    queryKey: ["validators"],
    queryFn: fetchValidators,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  const validatorsWithScores: ValidatorScore[] = (query.data || []).map(validator => {
    const score = scoreValidator(validator);
    return {
      validator: validator.operator_address,
      score: score,
      color: score >= 80 ? 'green' as const : score >= 50 ? 'yellow' as const : 'red' as const,
      events: [], // TODO: Fetch from smart contract
    };
  });

  return {
    ...query,
    validators: query.data || [],
    validatorsWithScores,
  };
}

export function useValidatorStats() {
  const { validators } = useValidators();
  
  const stats = {
    total: validators.length,
    active: validators.filter(v => v.status === 'BOND_STATUS_BONDED' && !v.jailed).length,
    jailed: validators.filter(v => v.jailed).length,
    averageUptime: validators.length > 0 
      ? validators.reduce((sum, v) => sum + (v.uptime || 0), 0) / validators.length 
      : 0,
  };

  return stats;
}
