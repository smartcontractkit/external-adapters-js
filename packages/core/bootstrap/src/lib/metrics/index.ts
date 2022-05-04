import * as client from 'prom-client'
import { getEnv, parseBool } from '../util'
import { WARMUP_REQUEST_ID } from '../middleware/cache-warmer/config'
import * as util from './util'
import { Middleware, AdapterRequest, AdapterMetricsMeta } from '@chainlink/types'

export const setupMetrics = (name: string): void => {
  client.collectDefaultMetrics()
  client.register.setDefaultLabels({
    app_name: getEnv('METRICS_NAME') || name || 'N/A',
    app_version: getEnv('npm_package_version'),
  })
}

export const METRICS_ENABLED = parseBool(getEnv('EXPERIMENTAL_METRICS_ENABLED'))

export const withMetrics: Middleware =
  async (execute, context) => async (input: AdapterRequest) => {
    const feedId = util.getFeedId(input)
    const metricsMeta: AdapterMetricsMeta = {
      feedId,
    }

    const recordMetrics = () => {
      const labels: Parameters<typeof httpRequestsTotal.labels>[0] = {
        is_cache_warming: String(input.id === WARMUP_REQUEST_ID),
        method: 'POST',
        feed_id: feedId,
      }
      const end = httpRequestDurationSeconds.startTimer()

      return (props: {
        providerStatusCode?: number
        statusCode?: number
        type?: HttpRequestType
      }) => {
        labels.type = props.type
        labels.status_code = props.statusCode
        labels.provider_status_code = props.providerStatusCode
        end()
        httpRequestsTotal.labels(labels).inc()
      }
    }

    const record = recordMetrics()
    try {
      const result = await execute({ ...input, metricsMeta }, context)
      record({
        statusCode: result.statusCode,
        type:
          result.data.maxAge || (result as any).maxAge
            ? HttpRequestType.CACHE_HIT
            : HttpRequestType.DATA_PROVIDER_HIT,
      })
      return { ...result, metricsMeta: { ...result.metricsMeta, ...metricsMeta } }
    } catch (error) {
      const providerStatusCode: number | undefined = error.cause?.response?.status
      record({
        statusCode: providerStatusCode ? 200 : 500,
        providerStatusCode,
        type: providerStatusCode
          ? HttpRequestType.DATA_PROVIDER_HIT
          : HttpRequestType.ADAPTER_ERROR,
      })
      throw error
    }
  }

export enum HttpRequestType {
  CACHE_HIT = 'cacheHit',
  DATA_PROVIDER_HIT = 'dataProviderHit',
  ADAPTER_ERROR = 'adapterError',
}

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'The number of http requests this external adapter has serviced for its entire uptime',
  labelNames: [
    'method',
    'status_code',
    'retry',
    'type',
    'is_cache_warming',
    'feed_id',
    'provider_status_code',
  ] as const,
})

export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'A histogram bucket of the distribution of http request durations',
  // we should tune these as we collect data, this is the default
  // bucket distribution that prom comes with
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
})

export const cacheWarmerRequests = new client.Counter({
  name: 'cache_warmer_requests',
  help: 'The number of requests caused by the warmer',
  labelNames: ['method', 'statusCode', 'apiKey', 'retry'] as const,
})

export const httpRequestsCacheHits = new client.Counter({
  name: 'http_requests_cache_hits',
  help: 'The number of http requests that hit the cache',
  labelNames: ['method', 'statusCode', 'apiKey', 'retry'] as const,
})

export const httpRequestsDataProviderHits = new client.Counter({
  name: 'http_requests_data_provider_hits',
  help: 'The number of http requests that hit the provider',
  labelNames: ['method', 'statusCode', 'apiKey', 'retry'] as const,
})

export * as util from './util'
