import { assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src'
import { TInputParameters } from '../../src/endpoint'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  beforeAll(() => {
    process.env.AVALANCHE_RPC_URL = process.env.AVALANCHE_RPC_URL || 'http://localhost:1000'
    process.env.COINPAPRIKA_ADAPTER_URL =
      process.env.COINPAPRIKA_ADAPTER_URL || 'http://localhost:4000'
    process.env.API_VERBOSE = true as unknown as string
  })

  describe('successful calls', () => {
    const requests = [
      {
        name: 'with source',
        testData: {
          id: jobID,
          data: {
            source: 'coinpaprika',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest<TInputParameters>, {})
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).toBeDefined()
        expect(data.data.result).toBeDefined()
      })
    })
  })
})
