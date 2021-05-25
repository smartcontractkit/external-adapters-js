import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'
import requestsWS from './WS.js'
import requestsNonWS from './non-WS.js'
import config from './config.js'

const { GROUP_COUNT, ADAPTERS } = config

export let options = {
  vus: 1,
  duration: '12h',
  batch:
    (requestsWS.length * ADAPTERS.length +
      Object.values(requestsNonWS).reduce((total, group) => group.length + total, 0)) *
    GROUP_COUNT,
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
  },
}

export let errorRate = new Rate('errors')

const buildRequests = () => {
  const batchRequests = {}

  for (let i = 1; i <= GROUP_COUNT; i++) {
    const baseUrl = `https://adapters-ecs-dydx-${i}.staging.org.devnet.tools`

    for (const adapter of ADAPTERS) {
      const url = `${baseUrl}/${adapter}/call`

      for (const payload of requestsWS) {
        const params = {
          headers: {
            'Content-Type': 'application/json',
          },
        }

        batchRequests[`Group-${i}-${adapter}-${payload.name}`] = {
          method: payload.method,
          url,
          body: payload.data,
          params,
        }
      }

      for (const payload of requestsNonWS[adapter]) {
        const params = {
          headers: {
            'Content-Type': 'application/json',
          },
        }

        batchRequests[`Group-${i}-${adapter}-${payload.name}`] = {
          method: payload.method,
          url,
          body: payload.data,
          params,
        }
      }
    }
  }

  return batchRequests
}

const batchRequests = buildRequests()

export default () => {
  const responses = http.batch(batchRequests)
  for (const [name, response] of Object.entries(responses)) {
    const result = check(response, {
      [`${name} returned 200`]: (r) => r.status == 200,
    })

    errorRate.add(!result)
  }

  sleep(60) // Wait 60 seconds
}
