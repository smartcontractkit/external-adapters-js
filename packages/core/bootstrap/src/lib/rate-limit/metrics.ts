import { AdapterResponse } from '@chainlink/types'
import * as client from 'prom-client'

export const rateLimitCreditsSpentTotal = new client.Counter({
  name: 'rate_limit_credits_spent_total',
  help: 'The number of data provider credits the adapter is consuming',
  labelNames: ['job_run_id', 'participant_id', 'experimental'] as const,
})

export const observeMetrics = (
  id: string,
  requestTypeId: string,
  result: AdapterResponse,
): void => {
  const defaultLabels = { job_run_id: id, participant_id: requestTypeId, experimental: 'true' }

  rateLimitCreditsSpentTotal.labels(defaultLabels).inc(result.debug.providerCost)
}
