import { check, sleep } from 'k6'
import { SharedArray } from 'k6/data'
import http from 'k6/http'
import { Rate } from 'k6/metrics'
import {
  ADAPTERS,
  AdapterNames,
  GROUP_COUNT,
  httpPayloadsByAdapter,
  wsPayloads,
} from './config/index'

// load the test duration from the environment or default to 12 hours
let testDuration = '12h'
if (__ENV.TEST_DURATION) {
  testDuration = __ENV.TEST_DURATION
}

// set the k6 running options
export const options = {
  vus: 1,
  duration: testDuration,
  thresholds: {
    http_req_failed: ['rate<0.01'], // http errors should be less than 1%
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
  },
}

let currIteration = 0
export const errorRate = new Rate('errors')

// load the test data, if data was generated then load it from the generated file
let payloadData = wsPayloads
if (__ENV.PAYLOAD_GENERATED) {
  payloadData = new SharedArray('payloadData', function () {
    const f = JSON.parse(open('../src/config/ws.json'))
    return f
  })
}

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
        [__ENV.LOCAL_ADAPTER_NAME]: 'http://localhost:8080',
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
    let adapters = ADAPTERS
    if (__ENV.CI_ADAPTER_NAME && __ENV.CI_SECONDS_PER_CALL) {
      adapters = [
        {
          name: __ENV.CI_ADAPTER_NAME,
          secondsPerCall: parseInt(__ENV.CI_SECONDS_PER_CALL),
        },
      ]
    }
    const adaptersToMap = adapters
      .filter((a) => currIteration % a.secondsPerCall === 0)
      .map((a) => a.name)
    const adaptersPerLoadTestGroup = loadTestGroup.map(
      (u, i) =>
        [
          i,
          Object.fromEntries(
            adaptersToMap.map((a) => {
              if (__ENV.QA_RELEASE_TAG) {
                return [a, `${u}qa-ea-${a}-${__ENV.QA_RELEASE_TAG}`] as const
              }
              return [a, `${u}${a}`] as const
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
      if (__ENV.WS_ENABLED) {
        for (const payload of payloadData) {
          if (adapterName === 'coinapi') {
            const body = JSON.parse(payload.data)
            body.data.endpoint = 'assets'
            batchRequests[`Group-${loadTestGroup}-${adapterName}-${payload.name}`] = {
              method: payload.method,
              url,
              body,
              params,
            }
          } else {
            batchRequests[`Group-${loadTestGroup}-${adapterName}-${payload.name}`] = {
              method: payload.method,
              url,
              body: payload.data,
              params,
            }
          }
        }
      } else {
        for (const payload of httpPayloadsByAdapter[adapterName as AdapterNames]) {
          batchRequests[`Group-${loadTestGroup}-${adapterName}-${payload.name}`] = {
            method: payload.method,
            url,
            body: payload.data,
            params,
          }
        }
      }
    }
  }

  return batchRequests
}

const batchRequests = buildRequests()
console.log(JSON.stringify(batchRequests))

export default (): void => {
  currIteration++
  const responses = http.batch(batchRequests)
  for (const [name, response] of Object.entries(responses)) {
    const result = check(response, {
      [`${name} returned 200`]: (r) => r.status == 200,
    })

    errorRate.add(!result)
  }

  sleep(1)
}
