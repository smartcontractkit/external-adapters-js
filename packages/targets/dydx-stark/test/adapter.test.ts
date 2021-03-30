import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  context('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'asset not supplied',
        testData: { id: jobID, data: { dataPath: 'price', price: 1 } },
      },
      {
        name: 'price not a supplied',
        testData: { id: jobID, data: { asset: 'BTCUSD' } },
      },
      {
        name: 'price not a number',
        testData: { id: jobID, data: { asset: 'BTCUSD', dataPath: 'price', price: 'aaa' } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
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
