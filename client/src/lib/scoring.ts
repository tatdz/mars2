import { Validator, ValidatorScore } from "@/types";

export function scoreValidator(validator: Validator): number {
  let score = 80; // Base score

  // Penalize jailed validators
  if (validator.jailed) {
    score -= 40;
  }

  // Penalize slashed validators
  if (validator.slashed) {
    score -= 50;
  }

  // Reward high uptime
  if (validator.uptime >= 99.9) {
    score += 10;
  }

  // Penalize missed blocks
  if (validator.missed_blocks > 10) {
    score -= 20;
  } else if (validator.missed_blocks > 3) {
    score -= 10;
  }

  // Reward recent rewards (activity)
  if (validator.recent_rewards && validator.recent_rewards.length > 0) {
    score += 5;
  }

  // Reward governance participation
  if (validator.votes && validator.votes.length > 0) {
    score += 5;
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

export function getScoreColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 80) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}

export function getScoreColorClass(score: number): string {
  const color = getScoreColor(score);
  switch (color) {
    case 'green':
      return 'text-validator-green';
    case 'yellow':
      return 'text-validator-yellow';
    case 'red':
      return 'text-validator-red';
    default:
      return 'text-gray-400';
  }
}

export function getScoreBgClass(score: number): string {
  const color = getScoreColor(score);
  switch (color) {
    case 'green':
      return 'bg-validator-green';
    case 'yellow':
      return 'bg-validator-yellow';
    case 'red':
      return 'bg-validator-red';
    default:
      return 'bg-gray-400';
  }
}

export function getStatusColor(status: string, jailed: boolean): string {
  if (jailed) return 'text-validator-red';
  if (status === 'BOND_STATUS_BONDED') return 'text-validator-green';
  return 'text-validator-yellow';
}

export function getStatusText(status: string, jailed: boolean): string {
  if (jailed) return 'Jailed';
  if (status === 'BOND_STATUS_BONDED') return 'Active';
  if (status === 'BOND_STATUS_UNBONDED') return 'Unbonded';
  if (status === 'BOND_STATUS_UNBONDING') return 'Unbonding';
  return 'Unknown';
}

export interface ActionMessage {
  title: string;
  action: string;
  color: 'green' | 'yellow' | 'red';
  showAlert?: boolean;
}

export function getNextActionMessage(score: number): ActionMessage {
  if (score >= 80) {
    return {
      title: "✅ Validator Health: Excellent",
      action: "This validator is healthy. Uptime and performance are excellent. You can stake confidently. No action is needed.",
      color: "green"
    };
  } else if (score >= 50) {
    return {
      title: "⚠️ Validator Health: Moderate Risk",
      action: "This validator's status requires monitoring. Some incidents may be affecting performance. View validator's performance history and consider reducing stake if the issue persists.",
      color: "yellow"
    };
  } else {
    return {
      title: "🚨 Validator Health: High Risk",
      action: "⚠️ This validator is unstable or has been flagged. Take action immediately. Unstake from this validator and choose a safer validator to delegate to.",
      color: "red",
      showAlert: true
    };
  }
}
