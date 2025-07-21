import { useQuery } from "@tanstack/react-query";
import { Validator, ValidatorScore } from "@/types";
import { scoreValidator } from "@/lib/scoring";

const SEI_VALIDATORS_API = "https://sei.explorers.guru/api/validators";

async function fetchValidators(): Promise<Validator[]> {
  const response = await fetch(SEI_VALIDATORS_API);
  if (!response.ok) {
    throw new Error(`Failed to fetch validators: ${response.statusText}`);
  }
  const data = await response.json();
  return data.validators || [];
}

export function useValidators() {
  const query = useQuery({
    queryKey: ["validators"],
    queryFn: fetchValidators,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  const validatorsWithScores: ValidatorScore[] = (query.data || []).map(validator => ({
    validator: validator.operator_address,
    score: scoreValidator(validator),
    color: validator.score >= 80 ? 'green' : validator.score >= 50 ? 'yellow' : 'red',
    events: [], // TODO: Fetch from smart contract
  }));

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
