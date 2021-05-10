import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { product: 'ferrari-f12tdf', feedId: 1 } },
      },
      {
        name: 'F12 TDF feed 1',
        testData: { id: jobID, data: { product: 'ferrari-f12tdf', feedId: 1 } },
      },
      {
        name: 'F12 TDF feed 2',
        testData: { id: jobID, data: { product: 'ferrari-f12tdf', feedId: 2 } },
      },
      {
        name: 'F12 TDF feed 3',
        testData: { id: jobID, data: { product: 'ferrari-f12tdf', feedId: 3 } },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).toBeGreaterThan(0)
        expect(data.data.result).toBeGreaterThan(0)
      })
    })
  })

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'unknown product',
        testData: { id: jobID, data: { product: 'NOT_A_REAL_PRODUCT', feedId: 1 } },
      },
      {
        name: 'unknown feedId',
        testData: { id: jobID, data: { product: 'ferrari-f12tdf', feedId: 999999 } },
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
