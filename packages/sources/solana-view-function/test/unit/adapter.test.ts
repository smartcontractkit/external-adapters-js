import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'
import { makeConfig } from '../../src/config'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  const rpcURL = 'https://api.devnet.solana.com'

  beforeEach(() => {
    process.env.RPC_URL = rpcURL
  })

  afterEach(() => {
    delete process.env.RPC_URL
    delete process.env.COMMITMENT
  })

  describe('config', () => {
    it('correctly sets the config', () => {
      const commitment = 'finalized'
      process.env.RPC_URL = rpcURL
      process.env.COMMITMENT = commitment
      const config = makeConfig()
      expect(config.rpcUrl).toEqual(rpcURL)
      expect(config.commitment).toEqual(commitment)
    })

    it('correctly sets the default commitment if none is set', () => {
      const rpcURL = 'http.solana-devnet.com'
      process.env.RPC_URL = rpcURL
      const config = makeConfig()
      expect(config.rpcUrl).toEqual(rpcURL)
      expect(config.commitment).toEqual('confirmed')
    })
  })

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      { name: 'empty addresses', testData: { data: { addresses: [] } } },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
