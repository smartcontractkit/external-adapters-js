import { AdapterResponse } from '@chainlink/types'
import * as client from 'prom-client'
import { MAXIMUM_MAX_AGE } from '../cache'

enum CacheTypes {
  Redis = 'redis',
  Local = 'local',
}

export const rateLimitCreditsSpentTotal = new client.Counter({
  name: 'rate_limit_credits_spent_total',
  help: 'The number of data provider credits the adapter is consuming',
  labelNames: ['job_run_id', 'experimental'] as const,
})

export const rateLimitDataStaleness = new client.Histogram({
  name: 'rate_limit_data_staleness',
  help: 'Observes the staleness of the data returned',
  labelNames: ['job_run_id', 'experimental', 'cache_type'] as const,
  buckets: [0, 1000, 5000, 10000, 30000, 60000, 90000, MAXIMUM_MAX_AGE], // ms
})

export const observeMetrics = (id: string, requestTypeId: string, result: AdapterResponse) => {
  const cacheType = process.env.CACHE_TYPE === 'redis' ? CacheTypes.Redis : CacheTypes.Local
  const defaultLabels = { job_run_id: id, participantId: requestTypeId, experimental: 'true' }

  const isCacheHit = !!result.maxAge
  if (!isCacheHit) {
    rateLimitCreditsSpentTotal.labels(defaultLabels).inc(result.data.cost || 1)
  }

  const ttl = Number((result as any).ttl)
  let staleness = 0
  if (result.maxAge && ttl) {
    staleness = result.maxAge - ttl * 1000
  }
  rateLimitDataStaleness.labels({ ...defaultLabels, cache_type: cacheType }).observe(staleness)
}
