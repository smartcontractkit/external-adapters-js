import * as client from 'prom-client'
import { normalizeStatusCode } from '../metrics/util'

interface CacheExecutionDurationParams {
  participantId: string
  feedId?: string
  isFromWs: boolean
}
export const beginObserveCacheMetrics = ({
  participantId,
  feedId,
  isFromWs,
}: CacheExecutionDurationParams) => {
  const cacheType = process.env.CACHE_TYPE === 'redis' ? CacheTypes.Redis : CacheTypes.Local
  const base = {
    feed_id: feedId,
    participant_id: participantId,
    experimental: 'true',
    cache_type: cacheType,
    is_from_ws: String(isFromWs),
  }

  const recordCacheExecutionDuration = cache_execution_duration_seconds.startTimer()
  return {
    stalenessAndExecutionTime(cacheHit: boolean, staleness = 0) {
      cache_data_staleness_seconds.labels(base).set(staleness)
      return recordCacheExecutionDuration({ ...base, cache_hit: String(cacheHit) })
    },

    cacheGet({ value }: { value: unknown }) {
      if (typeof value === 'number' || typeof value === 'string') {
        const parsedValue = Number(value)
        if (!Number.isNaN(parsedValue) && Number.isFinite(parsedValue)) {
          cache_data_get_values.labels(base).set(parsedValue)
        }
      }
      cache_data_get_count.labels(base).inc()
    },

    cacheSet({ statusCode, maxAge }: { statusCode: number; maxAge: number }) {
      cache_data_set_count.labels({ ...base, status_code: normalizeStatusCode(statusCode) }).inc()
      cache_data_max_age.labels(base).set(maxAge)
    },
  }
}

export const redis_connections_open = new client.Counter({
  name: 'redis_connections_open',
  help: 'The number of redis connections that are open',
})

enum CacheTypes {
  Redis = 'redis',
  Local = 'local',
}

const baseLabels = [
  'feed_id',
  'participant_id',
  'cache_type',
  'is_from_ws',
  'experimental',
] as const

const cache_execution_duration_seconds = new client.Histogram({
  name: 'cache_execution_duration_seconds',
  help: 'A histogram bucket of the distribution of cache execution durations',
  labelNames: [...baseLabels, 'cache_hit'] as const,
  buckets: [0.01, 0.1, 1, 10],
})

const cache_data_get_count = new client.Counter({
  name: 'cache_data_get_count',
  help: 'A counter that increments every time a value is fetched from the cache',
  labelNames: baseLabels,
})

const cache_data_get_values = new client.Gauge({
  name: 'cache_data_get_values',
  help: 'A gauge keeping track of values being fetched from cache',
  labelNames: baseLabels,
})

const cache_data_max_age = new client.Gauge({
  name: 'cache_data_max_age',
  help: 'A gauge tracking the max age of stored values in the cache',
  labelNames: baseLabels,
})

const cache_data_set_count = new client.Counter({
  name: 'cache_data_set_count',
  help: 'A counter that increments every time a value is set to the cache',
  labelNames: [...baseLabels, 'status_code'],
})

const cache_data_staleness_seconds = new client.Gauge({
  name: 'cache_data_staleness_seconds',
  help: 'Observes the staleness of the data returned',
  labelNames: baseLabels,
})
