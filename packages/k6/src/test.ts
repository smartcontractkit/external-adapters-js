import { check, sleep } from 'k6'
import http from 'k6/http'
import { Rate } from 'k6/metrics'
import config from './config'
import requestsNonWS from './non-WS'
import requestsWS from './WS'

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

interface LoadTestGroupUrls {
  [loadTestGroup: string]: {
    [adapterName: string]: string
  }
}

function getLoadTestGroupsUrls(): LoadTestGroupUrls {
  if (__ENV.LOCAL) {
    /**
     * Local environment only handles a single endpoint
     */
    return {
      local: {
        [__ENV.LOCAL_ADAPTER_NAME]: 'http://localhost:8080',
      },
    }
  } else {
    const loadTestGroup = Array(GROUP_COUNT)
      .fill(null)
      .map((_, i) => `https://adapters-ecs-dydx-${i + 1}.staging.org.devnet.tools`)
    const adaptersPerLoadTestGroup = loadTestGroup.map(
      (u, i) =>
        [i, Object.fromEntries(ADAPTERS.map((a) => [a, `${u}/${a}/call`] as const))] as const,
    )

    return Object.fromEntries(adaptersPerLoadTestGroup)
  }
}

const buildRequests = () => {
  const batchRequests: Parameters<typeof http.batch>[0] = {}
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  }
  const urls = getLoadTestGroupsUrls()
  for (const [loadTestGroup, adaptersByAdapterName] of Object.entries(urls)) {
    for (const [adapterName, url] of Object.entries(adaptersByAdapterName)) {
      if (__ENV.WS_ENABLED) {
        for (const payload of requestsWS) {
          batchRequests[`Group-${loadTestGroup}-${adapterName}-${payload.name}`] = {
            method: payload.method,
            url,
            body: payload.data,
            params,
          }
        }
      }

      for (const payload of requestsNonWS[adapterName as keyof typeof requestsNonWS]) {
        batchRequests[`Group-${loadTestGroup}-${adapterName}-${payload.name}`] = {
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
