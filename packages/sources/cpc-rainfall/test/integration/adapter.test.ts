import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

const TEST_API_KEY = process.env.API_KEY || "test-api-key"
const CALLBACK_URL = process.env.CALLBACK_URL || ""

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  const data = {
    'contract_id': 'xRvzgt6EKvneQfNy6',
    'weather_type': 'low_rainfall',
    'start_date': 1560211199,
    'end_date': 1563753599,
    'notional_amount': 4.5,
    'exit': 70,
    'coordinates': '38.50, 280.50',
    'edge_length': 0.25,
    'threshold_factor': 112,
    'secret': jobID
  }

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'with rainfall data',
        testData: { data },
      }
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.pending).toBe(true)
      })
    })
  })

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'null API Key',
        testData: { data },
        setup: () => process.env.API_KEY = null
      },
      {
        name: 'invalid API Key',
        testData: { data },
        setup: () => process.env.API_KEY = "invalid-key"
      },
      {
        name: "missing Callback URL",
        testData: { data },
        setup: () => process.env.CALLBACK_URL = null
      }
    ]

    afterEach(() => {
      process.env.API_KEY = TEST_API_KEY
      process.env.CALLBACK_URL = CALLBACK_URL
    })

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        req.setup && req.setup()
        try {
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
