import { check, sleep } from 'k6'
import { SharedArray } from 'k6/data'
import http from 'k6/http'
import { Rate } from 'k6/metrics'
import { Payload } from './config/types'

// For future use
const GROUP_COUNT = 1

// load the test duration from the environment or default to 12 hours
let testDuration = '12h'
if (__ENV.TEST_DURATION) {
  testDuration = __ENV.TEST_DURATION
}

let scaleupDuration = '1m'
if (__ENV.SCALEUP_DURATION) {
  scaleupDuration = __ENV.SCALEUP_DURATION
}

// load the test data, if data was generated then load it from the generated file
let payloadData: Payload[] = []
if (__ENV.PAYLOAD_GENERATED) {
  const payloadPath = __ENV.PAYLOAD_PATH || '../src/config/http.json'
  payloadData = new SharedArray('payloadData', function () {
    const f = JSON.parse(open(payloadPath))
    return f
  })
}

// set the k6 running options
export const options = {
  vus: 1,
  duration: testDuration,
  stages: [
    { duration: scaleupDuration, target: payloadData.length / 2 },
    { duration: scaleupDuration, target: payloadData.length },
    { duration: testDuration, target: payloadData },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
  },
}

export const errorRate = new Rate('errors')

interface LoadTestGroupUrls {
  [loadTestGroup: string]: {
    [adapterName: string]: string
  }
}

function getLoadTestGroupsUrls(): LoadTestGroupUrls {
  if (__ENV.LOCAL_ADAPTER_NAME) {
    /**
     * Local environment only handles a single endpoint
     */
    return {
      local: {
        [__ENV.LOCAL_ADAPTER_NAME]: `http://host.docker.internal:${
          __ENV.LOCAL_ADAPTER_PORT || '8080'
        }`,
      },
    }
  } else {
    const loadTestGroup = Array(GROUP_COUNT)
      .fill(null)
      .map((_) => {
        // are we testing in QA or staging
        if (__ENV.QA_RELEASE_TAG) {
          return `https://adapters.main.sdlc.cldev.sh/`
        } else {
          return `https://adapters.main.stage.cldev.sh/`
        }
      })
    // load the adapters from the list and if we are running in CI override it
    let adapters: string[] = []
    if (__ENV.CI_ADAPTER_NAME) {
      adapters = [__ENV.CI_ADAPTER_NAME]
    }
    const adaptersPerLoadTestGroup = loadTestGroup.map(
      (url, i) =>
        [
          i,
          Object.fromEntries(
            adapters.map((adapter) => {
              if (__ENV.QA_RELEASE_TAG) {
                return [adapter, `${url}qa-ea-${adapter}-${__ENV.QA_RELEASE_TAG}`] as const
              }
              return [adapter, `${url}${adapter}`] as const
            }),
          ),
        ] as const,
    )

    return Object.fromEntries(adaptersPerLoadTestGroup)
  }
}

function buildRequests() {
  const batchRequests: Parameters<typeof http.batch>[0] = {}
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  }
  const urls = getLoadTestGroupsUrls()
  for (const [loadTestGroup, adaptersByAdapterName] of Object.entries(urls)) {
    for (const [adapterName, url] of Object.entries(adaptersByAdapterName)) {
      for (const payload of payloadData) {
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

export default (): void => {
  const responses = http.batch(batchRequests)
  for (const [name, response] of Object.entries(responses)) {
    const result = check(response, {
      [`${name} returned 200`]: (r) => r.status == 200,
    })

    errorRate.add(!result)
  }

  sleep(1)
}
