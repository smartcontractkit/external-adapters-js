import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess, setEnvVariables } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src'
import process from 'process'
import { TInputParameters } from '../../src/endpoint'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.CACHE_ENABLED = 'false'
  process.env.BOMBAY_12_LCD_URL = process.env.BOMBAY_12_LCD_URL || 'https://bombay-lcd.terra.dev'
})

afterAll(() => {
  setEnvVariables(oldEnv)
})

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: {
          data: {
            address: 'terra1dw5ex5g802vgrek3nzppwt29tfzlpa38ep97qy',
            query: { aggregator_query: { get_latest_round_data: {} } },
            chainId: 'bombay-12',
          },
        },
      },
      {
        name: 'address/query',
        testData: {
          id: jobID,
          data: {
            address: 'terra1dw5ex5g802vgrek3nzppwt29tfzlpa38ep97qy',
            query: { aggregator_query: { get_latest_round_data: {} } },
            chainId: 'bombay-12',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest<TInputParameters>, {})
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result && Object.keys(data.result).length).toBeGreaterThan(0)
      })
    })
  })

  describe('error calls', () => {
    const requests = [
      {
        name: 'unknown address',
        testData: {
          id: jobID,
          data: {
            address: 'not_real',
            query: { aggregator_query: { get_latest_round_data: {} } },
            chainId: 'bombay-12',
          },
        },
      },
      {
        name: 'unknown query',
        testData: {
          id: jobID,
          data: {
            address: 'terra1dw5ex5g802vgrek3nzppwt29tfzlpa38ep97qy',
            query: { get_latest_round_data: {} },
            chainId: 'bombay-12',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest<TInputParameters>, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error as AdapterError)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
