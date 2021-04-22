import { Requester } from '@chainlink/external-adapter'
import { assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('aggregator composite tests', () => {
  const jobID = '1'
  const execute = makeExecute()
  const envOld = process.env
  process.env.DATA_PROVIDERS = 'coingecko,coinpaprika'
  process.env.REDUCE_DATA_PROVIDER_URL = 'http://localhost:4000'
  process.env.COINGECKO_DATA_PROVIDER_URL = 'http://localhost:3000'
  process.env.COINPAPRIKA_DATA_PROVIDER_URL = 'http://localhost:3001'

  after(() => {
    process.env = envOld //reset environment variables
  })

  context('validation error', () => {
    const requests = [
      { name: 'not real reducer', testData: { id: '1', data: { reducer: 'not_real' } } },
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
