import { check, fail, JSONValue, sleep } from 'k6'
import { SharedArray } from 'k6/data'
import http from 'k6/http'
import { Rate } from 'k6/metrics'
import { Payload } from './config/types'
import { vu } from 'k6/execution'

// load the test duration from the environment or default to 10m
let testDuration = '10m'
if (__ENV.TEST_DURATION) {
  testDuration = __ENV.TEST_DURATION
}

let RPS = 1000
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
    fail(`Requested to use ${envUniqueRequests} unique requests, but only have ${uniqueRequests}`)
  } else if (envUniqueRequests > VU) {
    fail(`Requested to use ${envUniqueRequests} unique requests, but only have ${VU} VUs`)
  } else {
    uniqueRequests = envUniqueRequests
  }
}

console.info(`Using ${uniqueRequests} unique requests`)

let scaleupDuration = '1m'
if (__ENV.SCALEUP_DURATION) {
  scaleupDuration = __ENV.SCALEUP_DURATION
}

// set the k6 running options
export const options = {
  thresholds: {
    http_req_failed: [
      {
        threshold: 'rate<0.01', // http errors should be less than 1%
        abortOnFail: true,
      },
    ],
    http_req_duration: [
      {
        threshold: 'p(95)<1000', // 95% of request durations should be below 1s
        abortOnFail: true,
      },
    ],
    checks: [
      {
        threshold: 'rate>0.999', // 99.9% of the extra checks should be successful
        abortOnFail: true,
      },
    ],
  },
  stages: [
    { duration: '5m', target: Math.min(uniqueRequests, VU / 10) }, // 5m warmup from 0 to min(uniqueRequests, VU/10)
    // Do `scaleupDuration` duration of scaling up to (VU/10)*currentStage, then run that stage for `testDuration`
    { duration: scaleupDuration, target: VU / 10 },
    { duration: testDuration, target: VU / 10 },
    { duration: scaleupDuration, target: (VU / 10) * 2 },
    { duration: testDuration, target: (VU / 10) * 2 },
    { duration: scaleupDuration, target: (VU / 10) * 3 },
    { duration: testDuration, target: (VU / 10) * 3 },
    { duration: scaleupDuration, target: (VU / 10) * 4 },
    { duration: testDuration, target: (VU / 10) * 4 },
    { duration: scaleupDuration, target: (VU / 10) * 5 },
    { duration: testDuration, target: (VU / 10) * 5 },
    { duration: scaleupDuration, target: (VU / 10) * 6 },
    { duration: testDuration, target: (VU / 10) * 6 },
    { duration: scaleupDuration, target: (VU / 10) * 7 },
    { duration: testDuration, target: (VU / 10) * 7 },
    { duration: scaleupDuration, target: (VU / 10) * 8 },
    { duration: testDuration, target: (VU / 10) * 8 },
    { duration: scaleupDuration, target: (VU / 10) * 9 },
    { duration: testDuration, target: (VU / 10) * 9 },
    { duration: scaleupDuration, target: VU },
    { duration: testDuration, target: VU },
  ],
}

const adapterUrl = __ENV.ADAPTER_URL || ''
if (adapterUrl === '') {
  fail('Missing `ADAPTER_URL` env var!')
}

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
  const after = new Date().getTime()
  const diff = (after - before) / 1000
  const remainder = T - diff

  const result = check(response, {
    [`returns 200 status code`]: (r) => r.status == 200,
    [`returns result within expected numeric range`]: (r) => valueWithinRange(r.json('result')),
    [`doesn't exceed T`]: () => remainder >= 0,
  })

  if (!result) {
    console.log('Failing request:', config.body, 'status', response.status, 'body', response.body)
  }

  errorRate.add(!result)

  if (remainder > 0) {
    sleep(remainder)
  } else {
    console.warn(`Timer exhausted! The execution time of the test took longer than ${T} seconds`)
  }
}
