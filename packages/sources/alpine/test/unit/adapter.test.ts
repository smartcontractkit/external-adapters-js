import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('validation error', () => {
    const requests = [{ name: 'chain not supplied', testData: { id: jobID, data: { foo: 'bar' } } }]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
        } catch (error) {
          console.log({ error })
          const errorResp = Requester.errored(jobID, error)
          console.log({ errorResp })
          assertError(400, errorResp, jobID)
        }
      })
    })
  })
})
