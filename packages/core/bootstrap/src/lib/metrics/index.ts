import * as client from 'prom-client'
import { getEnv, parseBool } from '../util'
import { WARMUP_REQUEST_ID } from '../middleware/cache-warmer/config'
import { Middleware, AdapterRequest, AdapterMetricsMeta } from '@chainlink/types'
import { HttpRequestType, requestDurationBuckets } from './constants'
import * as util from './util'

export const METRICS_ENABLED = parseBool(getEnv('EXPERIMENTAL_METRICS_ENABLED'))

export const setupMetrics = (name: string): void => {
  client.collectDefaultMetrics()
  client.register.setDefaultLabels({
    app_name: getEnv('METRICS_NAME') || name || 'N/A',
    app_version: getEnv('npm_package_version'),
  })
}
const DEFAULT_SUCCESSFUL_PROVIDER_STATUS_CODE = 200
export const getMetricsMeta = (input: AdapterRequest): AdapterMetricsMeta => ({
  // If no requestOrigin comes through, then this is a cache warmer request
  requestOrigin: input.data.metricsMeta?.requestOrigin || util.WARMER_FEED_ID,
  feedId: util.getFeedId(input),
})

export const recordDataProviderRequest = METRICS_ENABLED
  ? (): ((method?: string, providerStatusCode?: number) => void) => {
      const labels: Parameters<typeof dataProviderRequests.labels>[0] = {}
      const end = dataProviderRequestDurationSeconds.startTimer()
      return (method = 'get', providerStatusCode?: number) => {
        end()
        labels.provider_status_code = providerStatusCode
        labels.method = method.toUpperCase()
        dataProviderRequests.labels(labels).inc()
      }
    }
  : () => {
      return () => null
    }

export const withMetrics: Middleware =
  async (execute, context) => async (input: AdapterRequest) => {
    const metricsMeta: AdapterMetricsMeta = getMetricsMeta(input)
    const recordMetrics = () => {
      const labels: Parameters<typeof httpRequestsTotal.labels>[0] = {
        is_cache_warming: String(input.id === WARMUP_REQUEST_ID),
        method: 'POST',
        feed_id: metricsMeta.feedId,
        request_origin: metricsMeta.requestOrigin,
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
        providerStatusCode: result.providerStatusCode || DEFAULT_SUCCESSFUL_PROVIDER_STATUS_CODE,
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
    'request_origin',
  ] as const,
})

export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'A histogram bucket of the distribution of http request durations',
  buckets: requestDurationBuckets,
})

export const dataProviderRequests = new client.Counter({
  name: 'data_provider_requests',
  help: 'The number of http requests that are made to a data provider',
  labelNames: ['method', 'provider_status_code'] as const,
})

export const dataProviderRequestDurationSeconds = new client.Histogram({
  name: 'data_provider_request_duration_seconds',
  help: 'A histogram bucket of the distribution of data provider request durations',
  buckets: requestDurationBuckets,
})

export * as util from './util'
