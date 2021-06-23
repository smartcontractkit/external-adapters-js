import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'
import { callback } from "../../src/endpoint"

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } }
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

describe("callback", () => {

  describe("callback validation error", () => {
    const requests = [
      { name: 'null request', request: null },
      { name: 'empty request', request: {} }
    ]

    requests.forEach(req => {
      it(`${req.name}`, async () => {
        const result = await callback.callbackHandler(req)
        expect(result.success).toBe(false)
        expect(result.error).not.toBeNull()
      })
    })
  })
})