import * as client from 'prom-client'
import { MAXIMUM_MAX_AGE } from './index'

enum CacheTypes {
  Redis = 'redis',
  Local = 'local',
}

export const cache_execution_duration_miliseconds = new client.Histogram({
  name: 'cache_execution_duration_miliseconds',
  help: 'A histogram bucket of the distribution of cache execution durations',
  labelNames: ['job_run_id', 'participant_id', 'cache_type', 'cache_hit', 'experimental'] as const,
  // default bucket distribution that prom comes with in ms
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
})

export const cache_data_staleness = new client.Histogram({
  name: 'cache_data_staleness',
  help: 'Observes the staleness of the data returned',
  labelNames: ['job_run_id', 'participant_id', 'cache_type', 'experimental'] as const,
  buckets: [0, 1000, 5000, 10000, 30000, 60000, 90000, MAXIMUM_MAX_AGE], // ms
})

export const observeMetrics = (id: string, participantId: string) => {
  const cacheType = process.env.CACHE_TYPE === 'redis' ? CacheTypes.Redis : CacheTypes.Local
  const defaultLabels = {
    job_run_id: id,
    participant_id: participantId,
    experimental: 'true',
    cache_type: cacheType,
  }

  const start = process.hrtime()
  return (cacheHit: boolean, staleness = 0): number => {
    const delta = process.hrtime(start)
    const ms = (delta[0] + delta[1] / 1e9) * 1000
    cache_data_staleness.labels({ ...defaultLabels }).observe(staleness)
    cache_execution_duration_miliseconds
      .labels({ ...defaultLabels, cache_hit: String(cacheHit) })
      .observe(ms)
    return ms
  }
}
