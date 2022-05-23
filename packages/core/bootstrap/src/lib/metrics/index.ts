import * as client from 'prom-client'
import { getEnv, parseBool } from '../util'
import { WARMUP_REQUEST_ID } from '../middleware/cache-warmer/config'
import { Middleware, AdapterRequest, AdapterMetricsMeta } from '@chainlink/types'
import * as util from './util'

export const METRICS_ENABLED = parseBool(getEnv('EXPERIMENTAL_METRICS_ENABLED'))

export const setupMetrics = (name: string): void => {
  client.collectDefaultMetrics()
  client.register.setDefaultLabels({
    app_name: getEnv('METRICS_NAME') || name || 'N/A',
    app_version: getEnv('npm_package_version'),
  })
}

export const getMetricsMeta = (input: AdapterRequest): AdapterMetricsMeta => ({
  // If no requestOrigin comes through, then this is a cache warmer request
  requestOrigin: input.data.metricsMeta?.requestOrigin || util.WARMER_FEED_ID,
  feedId: util.getFeedId(input),
})

export const recordDataProviderAttempt = (): ((
  method?: string,
  providerStatusCode?: number,
) => void) => {
  const labels: Parameters<typeof dataProviderRequestAttempts.labels>[0] = {}
  const end = dataProviderRequestDurationSeconds.startTimer()
  return (method = 'get', providerStatusCode?: number) => {
    end()
    labels.provider_status_code = providerStatusCode
    labels.method = method.toUpperCase()
    dataProviderRequestAttempts.labels(labels).inc()
  }
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
  CONFIG_ERROR = 'configError',
  RATE_LIMIT_ERROR = 'rateLimitError',
  BURST_LIMIT_ERROR = 'burstLimitError',
  BACKOFF_ERROR = 'backoffError',
  OVERRIDES_ERROR = 'overridesError',
  VALIDATION_ERROR = 'validationError',
  TIMEOUT_ERROR = 'timeoutError',
  RES_EMPTY_ERROR = 'responseEmptyError',
  RES_INVALID_ERROR = 'responseInvalidError',
  CUSTOM_ERROR = 'customError',
}

// we should tune these as we collect data, this is the default bucket distribution that prom comes with
const requestDurationBuckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]

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

export const dataProviderRequestAttempts = new client.Counter({
  name: 'data_provider_request_attempts',
  help: 'The number of http requests that attempt to request from a data provider',
  labelNames: ['method', 'provider_status_code'] as const,
})

export const dataProviderRequestDurationSeconds = new client.Histogram({
  name: 'data_provider_request_duration_seconds',
  help: 'A histogram bucket of the distribution of data provider request durations',
  buckets: requestDurationBuckets,
})

export * as util from './util'
