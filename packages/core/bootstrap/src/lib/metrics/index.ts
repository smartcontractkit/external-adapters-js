import * as client from 'prom-client'
import { parseBool } from '../util'

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
  labelNames: ['method', 'status_code', 'retry', 'type'] as const,
})

export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'A histogram bucket of the distribution of http request durations',
  // we should tune these as we collect data, this is the default
  // bucket distribution that prom comes with
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
})

/**
 * Normalizes http status codes.
 *
 * Returns strings in the format (2|3|4|5)XX.
 *
 * @author https://github.com/joao-fontenele/express-prometheus-middleware
 * @param {!number} status - status code of the requests
 * @returns {string} the normalized status code.
 */
export function normalizeStatusCode(status?: number): string {
  if (!status) {
    return '5XX'
  }

  if (status >= 200 && status < 300) {
    return '2XX'
  }

  if (status >= 300 && status < 400) {
    return '3XX'
  }

  if (status >= 400 && status < 500) {
    return '4XX'
  }
  return '5XX'
}
