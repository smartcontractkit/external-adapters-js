import { check } from 'k6'
import { SharedArray } from 'k6/data'
import http, { BatchRequests } from 'k6/http'
import { Rate } from 'k6/metrics'
import { Payload } from './config/types'

// load the test iterations from the environment or default to 100
let iterations = 100
if (__ENV.LOAD_TEST_ITERATIONS) {
  iterations = parseInt(__ENV.LOAD_TEST_ITERATIONS)
}

// set the k6 running options
export const options = {
  vus: 1,
  iterations,
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
  },
}

export const errorRate = new Rate('errors')

// load the test data, if data was generated then load it from the generated file
if (!__ENV.PAYLOAD_PATH) {
  console.error('PAYLOAD_PATH env var is not present')
  process.exit(1)
}

const payloadData: Payload[] = new SharedArray('payloadData', () =>
  JSON.parse(open(__ENV.PAYLOAD_PATH)),
)

function buildRequests() {
  const batchRequests: BatchRequests = {}
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  const adapterName = __ENV.LOAD_TEST_ADAPTER_NAME
  const adapterUrl = `http://${adapterName}-adapter:8080`

  for (const payload of payloadData) {
    batchRequests[`${adapterName}-${payload.name}`] = {
      method: payload.method,
      url: adapterUrl,
      body: JSON.stringify({
        data: JSON.parse(payload.data),
      }),
      params,
    }
  }

  return batchRequests
}

const batchRequests = buildRequests()

export default (): void => {
  const responses = http.batch(batchRequests)
  for (const [name, response] of Object.entries(responses)) {
    const result = check(response, {
      [`${name} returned 200`]: (r) => r.status == 200,
    })

    errorRate.add(!result)
  }
}
