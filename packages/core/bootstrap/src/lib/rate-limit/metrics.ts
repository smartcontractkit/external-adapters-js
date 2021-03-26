import * as client from 'prom-client'

export const rateLimitCreditsSpentTotal = new client.Counter({
  name: 'rate_limit_credits_spent_total',
  help: 'The number of data provider credits the adapter is consuming',
  labelNames: ['job_run_id', 'participant_id', 'experimental'] as const,
})
