export interface IEpochResponse {
  epoch_id: number
  apr_1d: number
  apr_7d: number
  apr_30d: number
  apr_90d: number
  base_reward: number
  rewards: number
  fees: number
  total_rewards: number
  total_return: number
  attestation_penalties: number
  withdrawals: number
  deposits: number
  penalties: number
  slashings: number
  total_deductions: number
  total_eff_balance: number
  total_dep_balance: number
  total_validators: number
  pending_validators: number
  slashed_validators: number
  active_validators: number
  attestation_count: number
  validator_participation_rate: number
  start_slot: number
  end_slot: number
}
