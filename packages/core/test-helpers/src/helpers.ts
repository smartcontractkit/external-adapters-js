import { Requester } from '@chainlink/ea-bootstrap'
import { AdapterRequest, Execute } from '@chainlink/types'

const mockContext = {}

export function assertError(statusCode: any, data: any, expectedJobId: any) {
  expect(statusCode.actual).toEqual(statusCode.expected)
  expect(data.jobRunID).toEqual(expectedJobId)
  expect(data.status).toEqual('errored')
  expect(data.error).toBeTruthy()
  expect(data.error.name).toBeTruthy()
  expect(data.error.message).toBeTruthy()
}

export function assertSuccess(statusCode: any, data: any, expectedJobId: any) {
  expect(statusCode.actual).toEqual(statusCode.expected)
  expect(data.jobRunID).toEqual(expectedJobId)
  expect(data.error).toBeFalsy()
  expect(data.data).toBeTruthy()
  expect(data.result).toEqual(data.data.result)
}

function buildErrors(label: string, code: number, requests: any[], execute: Execute) {
  describe(label, () => {
    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, mockContext)
        } catch (error) {
          const id = req.testData.id
          const errorResp = Requester.errored(id, error)
          assertError({ expected: code, actual: errorResp.statusCode }, errorResp, id)
        }
      })
    })
  })
}

export function successes(requests: any[], execute: Execute, assertions?: any) {
  describe('successful calls @integration', () => {
    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const id = req.testData.id || '1'
        const data = await execute(req.testData as AdapterRequest, mockContext)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, id)
        if (assertions) assertions(req, data)
      })
    })
  })
}

export function validationErrors(requests: any[], execute: Execute) {
  buildErrors('validation error', 400, requests, execute)
}
export function serverErrors(requests: any[], execute: Execute) {
  buildErrors('error calls @integration', 500, requests, execute)
}
