import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src'
import process from 'process'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.CACHE_ENABLED = 'false'
  process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || 'https://bombay-lcd.terra.dev'
  process.env.CHAIN_ID = process.env.CHAIN_ID || 'bombay-12'
})

afterAll(() => {
  process.env = oldEnv
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
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest, {})
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(Object.keys(data.result).length).toBeGreaterThan(0)
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
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
