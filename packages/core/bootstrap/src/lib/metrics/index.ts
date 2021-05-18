import * as client from 'prom-client'
import { parseBool } from '../util'
export * as util from './util'

client.collectDefaultMetrics()
client.register.setDefaultLabels(
  // we'll inject both name and versions in
  // when EAEE gets merged, because it'll be a lot easier
  // to refactor with full type coverage support
  { app_name: process.env.METRICS_NAME || 'N/A', app_version: 'N/A' },
)
export const METRICS_ENABLED = parseBool(process.env.EXPERIMENTAL_METRICS_ENABLED)

export enum HttpRequestType {
  CACHE_HIT = 'cacheHit',
  DATA_PROVIDER_HIT = 'dataProviderHit',
}

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'The number of http requests this external adapter has serviced for its entire uptime',
  labelNames: ['method', 'status_code', 'retry', 'type', 'isCacheWarming'] as const,
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
