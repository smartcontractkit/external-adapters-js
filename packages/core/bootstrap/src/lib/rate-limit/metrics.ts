import * as client from 'prom-client'

export const rateLimitCreditsSpentTotal = new client.Counter({
  name: 'rate_limit_credits_spent_total',
  help: 'The number of data provider credits the adapter is consuming',
  labelNames: ['id', 'participantId', 'experimental'] as const,
})

export const rateLimitDataStaleness = new client.Counter({
  name: 'rate_limit_data_staleness',
  help: 'The number of data provider credits the adapter is consuming',
  labelNames: ['id', 'participantId', 'experimental'] as const,
})
