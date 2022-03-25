import { check, JSONValue, sleep } from 'k6'
import { SharedArray } from 'k6/data'
import http from 'k6/http'
import { Rate } from 'k6/metrics'
import { Payload } from './config/types'
import { vu } from 'k6/execution'

// load the test duration from the environment or default to 1 hour
let testDuration = '1h'
if (__ENV.TEST_DURATION) {
  testDuration = __ENV.TEST_DURATION
}

let RPS = 10
if (__ENV.RPS && !isNaN(parseInt(__ENV.RPS))) {
  RPS = parseInt(__ENV.RPS)
}

let T = 1 + 1 // Expect 1s response time + 1s network latency
if (__ENV.T && !isNaN(parseInt(__ENV.T))) {
  T = parseInt(__ENV.T)
}

let VU = RPS * T
if (__ENV.VU && !isNaN(parseInt(__ENV.VU))) {
  VU = parseInt(__ENV.VU)
}

// set the k6 running options
export const options = {
  vus: VU,
  duration: testDuration,
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(90)<1000'], // 90% of requests should be below 1s
  },
}

export const errorRate = new Rate('errors')

// load the test data
const payloadPath = __ENV.PAYLOAD_PATH || '../src/config/http.json'
const payloadData = new SharedArray('payloadData', () => {
  return JSON.parse(open(payloadPath)) as Payload[]
})

function buildRequests() {
  const requests = []
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  for (const payload of payloadData) {
    requests.push({
      body: payload.data,
      params,
    })
  }

  return requests
}

const requests = buildRequests()

let uniqueRequests = Math.min(requests.length, VU)
if (__ENV.UNIQUE_REQUESTS && parseInt(__ENV.UNIQUE_REQUESTS)) {
  const envUniqueRequests = parseInt(__ENV.UNIQUE_REQUESTS)
  if (envUniqueRequests > uniqueRequests) {
    console.error(
      `Requested to use ${envUniqueRequests} unique requests, but only have ${uniqueRequests}`,
    )
  } else if (envUniqueRequests > VU) {
    console.error(`Requested to use ${envUniqueRequests} unqiue requests, but only have ${VU} VUs`)
  } else {
    uniqueRequests = envUniqueRequests
  }
}

console.info(`Using ${uniqueRequests} unique requests`)

const buildAdapterUrl = (): string => {
  if (__ENV.LOCAL_ADAPTER_NAME) {
    /**
     * Local environment only handles a single endpoint
     */
    return `http://host.docker.internal:${__ENV.LOCAL_ADAPTER_PORT || '8080'}`
  } else {
    if (__ENV.QA_RELEASE_TAG) {
      return `https://adapters.main.sdlc.cldev.sh/${__ENV.CI_ADAPTER_NAME}`
    } else {
      return `https://adapters.main.stage.cldev.sh/${__ENV.CI_ADAPTER_NAME}-load-testing`
    }
  }
}

const adapterUrl = buildAdapterUrl()

const valueWithinRange = (val: JSONValue): boolean => {
  if (val === null) {
    return false
  }

  const numVal = Number(val)
  if (isNaN(numVal)) {
    return false
  }

  return 0 < numVal && numVal < 10_000_000_000_000
}

export default (): void => {
  const before = new Date().getTime()

  const config = requests[(vu.idInTest - 1) % uniqueRequests]
  const response = http.post(adapterUrl, config.body, config.params)

  const result = check(response, {
    [`returns 200 status code`]: (r) => r.status == 200,
    [`returns result within expected numeric range`]: (r) => valueWithinRange(r.json('result')),
  })

  if (!result) {
    console.log('Failing request:', config.body, 'status', response.status, 'body', response.body)
  }

  errorRate.add(!result)

  const after = new Date().getTime()
  const diff = (after - before) / 1000
  const remainder = T - diff
  if (remainder > 0) {
    sleep(remainder)
  } else {
    console.warn(`Timer exhausted! The execution time of the test took longer than ${T} seconds`)
  }
}
