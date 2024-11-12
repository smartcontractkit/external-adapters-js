import { check, sleep } from 'k6'
import { SharedArray } from 'k6/data'
import http from 'k6/http'
import { Rate } from 'k6/metrics'
import { Payload, Assertion } from './config/types'
import { validateOutput } from './output-test'

const GROUP_COUNT = 10
const UNIQUE_PAYLOAD_LIMIT = 50

// load the test duration from the environment or default to 12 hours
let testDuration = '12h'
if (__ENV.TEST_DURATION) {
  testDuration = __ENV.TEST_DURATION
}

// load the test data, if data was generated then load it from the generated file
let payloadData: Payload[] = []
if (__ENV.PAYLOAD_GENERATED) {
  const payloadPath = __ENV.PAYLOAD_PATH || '../src/config/http.json'
  payloadData = new SharedArray('payloadData', function () {
    return JSON.parse(open(payloadPath))
  })
}

let assertions: Assertion[] = []
const assertionsPaths = (__ENV.ASSERTIONS_PATHS && __ENV.ASSERTIONS_PATHS.split(',')) || [
  '../src/config/assertions/assertions.json',
  `../src/config/assertions/${__ENV.CI_ADAPTER_NAME}-assertions.json`,
]
assertions = new SharedArray('assertionsPaths', function () {
  const f = assertionsPaths
    .map((assertionsPath: string) => {
      try {
        return JSON.parse(open(assertionsPath))
      } catch {
        return []
      }
    })
    .reduce((lst, item) => lst.concat(item), [])
  return f
})

// set the k6 running options
export const options = {
  vus: 1,
  duration: testDuration,
  thresholds: {
    http_req_failed: ['rate<0.05'], // http errors should be less than 5%
    http_req_duration: ['p(90)<200'], // 90% of requests should be below 200ms
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

function buildRequests(i: number) {
  const batchRequests: Parameters<typeof http.batch>[0] = {}
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  }
  const urls = getLoadTestGroupsUrls()
  const limit = Math.min(payloadData.length, UNIQUE_PAYLOAD_LIMIT) / Math.min(GROUP_COUNT - i, 1)
  for (const [, adaptersByAdapterName] of Object.entries(urls)) {
    for (const [adapterName, url] of Object.entries(adaptersByAdapterName)) {
      for (let j = 0; j < limit; j++) {
        batchRequests[`Group-${adapterName}-${payloadData[j].name}`] = {
          method: payloadData[j].method,
          url,
          body: payloadData[j].data,
          params,
        }
      }
    }
  }

  return batchRequests
}

const stagedBatchRequests = new Array(GROUP_COUNT).fill(0).map((_, i) => buildRequests(i))

let iteration = 0
for (const assertion of assertions) {
  console.log(`Assertion loaded: ${JSON.stringify(assertion)}`)
}

export default (): void => {
  const before = new Date().getTime()
  const T = 5 // Don't send batch requests more frequently than once per 5s
  const responses = http.batch(stagedBatchRequests[Math.min(iteration++, GROUP_COUNT - 1)])
  for (const [name, response] of Object.entries(responses)) {
    const result = check(response, {
      [`${name} returned 200`]: (r) => r.status == 200,
    })
    validateOutput(response, assertions)
    errorRate.add(!result)
  }

  const after = new Date().getTime()
  const diff = (after - before) / 1000
  const remainder = T - diff
  if (remainder > 0) {
    sleep(remainder)
  } else {
    console.warn(`Timer exhausted! The execution time of the test took longer than ${T} seconds`)
  }
}
