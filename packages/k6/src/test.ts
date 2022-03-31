import { check, sleep } from 'k6'
import { SharedArray } from 'k6/data'
import http from 'k6/http'
import { Rate } from 'k6/metrics'

// TODO set from env var
const GROUP_COUNT = 1

// load the test duration from the environment or default to 2 minutes
let testDuration = '2m'
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
// TODO get adapters to test
let payloadData = []
if (__ENV.PAYLOAD_GENERATED) {
  const payloadPath = __ENV.PAYLOAD_PATH || '../src/http.json'
  payloadData = new SharedArray('payloadData', function () {
    const f = JSON.parse(open(payloadPath))
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
    // TODO set adapters to test
    // TODO set secondsPerCall for set of adapters to test
    let adapters: { name: string; secondsPerCall: number }[] = []
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
          //TODO why is coinapi special?
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
        //TODO replace httpPayloadsByAdapters with ones generated from flux:configure
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
