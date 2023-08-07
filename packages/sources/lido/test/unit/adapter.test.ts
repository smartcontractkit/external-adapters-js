import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('validation error', () => {
    const request = { name: 'missing data', testData: { id: jobID } }
    it('get stmatic price', async () => {
      try {
        await execute(request.testData as AdapterRequest<TInputParameters>, {})
      } catch (error) {
        const errorResp = Requester.errored(jobID, error as AdapterError)
        assertError(400, errorResp, jobID)
      }
    })
  })
})
