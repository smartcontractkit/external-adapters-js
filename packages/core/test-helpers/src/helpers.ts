import { assert } from 'chai'
import { Requester } from '@chainlink/ea-bootstrap'
import { AdapterRequest, Execute } from '@chainlink/types'

export function assertError(statusCode: any, data: any, expectedJobId: any) {
  assert.equal(statusCode.actual, statusCode.expected)
  assert.equal(data.jobRunID, expectedJobId)
  assert.equal(data.status, 'errored')
  assert.exists(data.error)
  assert.exists(data.error.name)
  assert.exists(data.error.message)
}

export function assertSuccess(statusCode: any, data: any, expectedJobId: any) {
  assert.equal(statusCode.actual, statusCode.expected)
  assert.equal(data.jobRunID, expectedJobId)
  assert.notExists(data.error)
  assert.isNotEmpty(data.data)
  assert.equal(data.result, data.data.result)
}

function buildErrors(label: string, code: number, requests: any[], execute: Execute) {
  context(label, () => {
    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest)
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
  context('successful calls @integration', () => {
    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const id = req.testData.id || '1'
        const data = await execute(req.testData as AdapterRequest)
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
