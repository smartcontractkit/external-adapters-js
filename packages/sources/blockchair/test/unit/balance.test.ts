import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('stats endpoint', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'empty addresses array',
        testData: { dataPath: 'addresses', data: { addresses: [] } },
      },
      { name: 'no dataPath', testData: { data: { addresses: [{ address: 'abc' }] } } },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          const errorResp = Requester.errored(jobID, new AdapterError(error))
          console.log({ errorResp })
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
