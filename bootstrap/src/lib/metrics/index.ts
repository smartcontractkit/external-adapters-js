import * as client from 'prom-client'

const collectDefaultMetrics = client.collectDefaultMetrics
const Registry = client.Registry
const register = new Registry()

collectDefaultMetrics({ register })

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'The number of http requests this external adapter has serviced for its entire uptime',
  labelNames: ['method', 'statusCode', 'apiKey', 'retry'] as const,
})

export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'A histogram bucket of the distribution of http request durations',
  // we should tune these as we collect data, this is the default
  // bucket distribution that prom comes with
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
})
