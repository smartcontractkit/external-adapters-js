import { check, sleep } from 'k6'
import http, { ObjectBatchRequest } from 'k6/http'
import { Rate } from 'k6/metrics'
import { GROUP_COUNT, wsPayloads } from './config/index'

export const errorRate = new Rate('errors')
export const options = {
  vus: 1,
  duration: '10m',
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
  },
}

const payloads = wsPayloads
  .filter((p) => p.name.includes('BTC/USD'))
  .concat([
    {
      data: JSON.stringify({ data: { from: 'XRP', to: 'USD' } }),
      id: 'baz',
      method: 'POST',
      name: 'XRP/USD',
    },
    {
      data: JSON.stringify({ data: { from: 'MANA', to: 'ETH' } }),
      id: 'foo',
      method: 'POST',
      name: 'MANA/ETH',
    },
    {
      data: JSON.stringify({ data: { from: 'LON', to: 'ETH' } }),
      id: 'bar',
      method: 'POST',
      name: 'LON/ETH',
    },
  ])

function createBatchRequestsFor(body: string): ObjectBatchRequest[] {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  }
  const loadTestGroup = Array(GROUP_COUNT)
    .fill(null)
    .map((_, i) => `https://adapters-ecs-dydx-${i + 1}.staging.org.devnet.tools`)

  return loadTestGroup.map((g) => ({
    method: 'POST',
    url: `${g}/cryptocompare/call`,
    body,
    params,
  }))
}
const requests: Parameters<typeof http.batch>[0] = payloads.flatMap((p) =>
  createBatchRequestsFor(p.data),
)

export default () => {
  const responses = http.batch(requests)

  for (const [name, response] of Object.entries(responses)) {
    const result = check(response, {
      [`${name} returned 200`]: (r) => r.status == 200,
    })

    errorRate.add(!result)
  }

  sleep(10)
}
