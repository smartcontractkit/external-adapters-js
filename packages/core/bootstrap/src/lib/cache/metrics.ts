import * as client from 'prom-client'

enum CacheTypes {
  Redis = 'redis',
  Local = 'local',
}

export const cache_execution_duration_seconds = new client.Histogram({
  name: 'cache_execution_duration_seconds',
  help: 'A histogram bucket of the distribution of cache execution durations',
  labelNames: ['participant_id', 'feed_id', 'cache_type', 'cache_hit', 'experimental'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
})

export const cache_data_staleness_seconds = new client.Histogram({
  name: 'cache_data_staleness_seconds',
  help: 'Observes the staleness of the data returned',
  labelNames: ['participant_id', 'feed_id', 'cache_type', 'experimental'] as const,
  buckets: [0, 1, 5, 10, 30, 60, 90, 120],
})

interface CacheExecutionDurationParams {
  participantId: string
  feedId: string
}

type EndObserveCacheExecutionDuration = (cacheHit: boolean, staleness?: number) => number

export const beginObserveCacheExecutionDuration = ({
  participantId,
  feedId,
}: CacheExecutionDurationParams): EndObserveCacheExecutionDuration => {
  const cacheType = process.env.CACHE_TYPE === 'redis' ? CacheTypes.Redis : CacheTypes.Local
  const defaultLabels = {
    feed_id: feedId,
    participant_id: participantId,
    experimental: 'true',
    cache_type: cacheType,
  }

  const end = cache_execution_duration_seconds.startTimer()
  return (cacheHit: boolean, staleness = 0): number => {
    cache_data_staleness_seconds.labels({ ...defaultLabels }).observe(staleness)
    return end({ ...defaultLabels, cache_hit: String(cacheHit) })
  }
}
