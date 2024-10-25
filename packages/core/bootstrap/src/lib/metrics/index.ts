import * as client from 'prom-client'
import { getEnv, getEnvWithFallback, parseBool } from '../util'
import { getFeedId } from './util'
import type { Middleware, AdapterRequest, AdapterMetricsMeta, AdapterContext } from '../../types'
import { WARMUP_REQUEST_ID } from '../middleware/cache-warmer/config'
import { HttpRequestType, requestDurationBuckets } from './constants'
import { AdapterError } from '../modules/error'

export const METRICS_ENABLED = parseBool(
  getEnvWithFallback('METRICS_ENABLED', ['EXPERIMENTAL_METRICS_ENABLED']),
)

export const setupMetrics = (name: string): void => {
  client.collectDefaultMetrics()
  client.register.setDefaultLabels({
    app_name: name || 'N/A',
    app_version: getEnv('npm_package_version'),
  })
}
const DEFAULT_SUCCESSFUL_PROVIDER_STATUS_CODE = 200
export const getMetricsMeta = (input: AdapterRequest): AdapterMetricsMeta => ({
  feedId: getFeedId(input),
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

export const withMetrics =
  <R extends AdapterRequest, C extends AdapterContext>(): Middleware<R, C> =>
  async (execute, context) =>
  async (input) => {
    const metricsMeta: AdapterMetricsMeta = getMetricsMeta(input)
    const recordMetrics = () => {
      const labels: Parameters<typeof httpRequestsTotal.labels>[0] = {
        is_cache_warming: String(input.id === WARMUP_REQUEST_ID),
        method: 'POST',
        feed_id: metricsMeta.feedId,
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
          result.data.maxAge || result.maxAge
            ? HttpRequestType.CACHE_HIT
            : HttpRequestType.DATA_PROVIDER_HIT,
      })

      let sourceString
      if (
        input?.data?.source &&
        typeof input?.data?.source === 'string' &&
        input?.data?.source !== ''
      ) {
        const sourceName = input?.data?.source
        sourceString = '?SOURCE=' + sourceName.toUpperCase()
      }

      let adapterNameStr = context.name

      if (sourceString && adapterNameStr) {
        adapterNameStr = context.name + sourceString
      }

      return {
        ...result,
        meta: { adapterName: adapterNameStr },
        metricsMeta: { ...result.metricsMeta, ...metricsMeta },
      }
    } catch (e: any) {
      const error = new AdapterError(e as Partial<AdapterError>)
      const providerStatusCode: number | undefined = (
        error.cause as unknown as { response: { status: number } }
      )?.response?.status
      record({
        statusCode: providerStatusCode ? 200 : 500,
        providerStatusCode,
        type: error.metricsLabel || HttpRequestType.ADAPTER_ERROR,
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
