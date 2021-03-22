import * as client from 'prom-client'
import { MAXIMUM_MAX_AGE } from './index'

enum CacheTypes {
  Redis = 'redis',
  Local = 'local',
}

export const cacheExecutionDurationSeconds = new client.Histogram({
  name: 'cache_execution_duration_seconds',
  help: 'A histogram bucket of the distribution of cache execution durations',
  // we should tune these as we collect data, this is the default
  // bucket distribution that prom comes with
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
})

export const cacheDataStaleness = new client.Histogram({
  name: 'cache_data_staleness',
  help: 'Observes the staleness of the data returned',
  labelNames: ['job_run_id', 'participant_id', 'cache_type', 'experimental'] as const,
  buckets: [0, 1000, 5000, 10000, 30000, 60000, 90000, MAXIMUM_MAX_AGE], // ms
})

export const observeMetrics = (id: string, participantId: string) => {
  const cacheType = process.env.CACHE_TYPE === 'redis' ? CacheTypes.Redis : CacheTypes.Local
  const defaultLabels = { job_run_id: id, participant_id: participantId, experimental: 'true' }

  const end = cacheExecutionDurationSeconds.startTimer()
  return (staleness = 0): number => {
    cacheDataStaleness.labels({ ...defaultLabels, cache_type: cacheType }).observe(staleness)
    return end()
  }
}
