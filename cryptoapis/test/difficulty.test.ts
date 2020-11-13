import { assert } from 'chai'
import { Requester, assertSuccess, assertError } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { executeWithDefaults } from '../src/adapter'

describe('difficulty endpoint', () => {
  const jobID = '1'

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'BTC difficulty',
        testData: {
          id: jobID,
          data: { blockchain: 'BTC', endpoint: 'difficulty' },
        },
      },
      {
        name: 'BTC testnet difficulty',
        testData: {
          id: jobID,
          data: { blockchain: 'BTC', network: 'Testnet', endpoint: 'difficulty' },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await executeWithDefaults(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        assert.isAbove(data.result, 0)
        assert.isAbove(data.data.result, 0)
      })
    })
  })

  context('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'unknown blockchain',
        testData: { id: jobID, data: { blockchain: 'not_real' } },
      },
      {
        name: 'unknown network',
        testData: { id: jobID, data: { blockchain: 'BTC', network: 'not_real' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await executeWithDefaults(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
