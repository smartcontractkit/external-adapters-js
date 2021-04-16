import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest, AdapterRequestMeta, AdapterResponse } from '@chainlink/types'
jest.setTimeout(100000)
let address: string
let execute: {
  (arg0: { id: string; data: Record<string, unknown>; meta: AdapterRequestMeta }): any
  (input: AdapterRequest): Promise<AdapterResponse>
}

describe('execute', () => {
  const jobID = '278c97ffadb54a5bbb93cfec5f7b5503'
  const int256FuncId = '0xa53b1c1e'
  const uint256FuncId = '0xd2282dc5'

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'with sending string while int datatype and func',
        testData: {
          id: jobID,
          data: {
            exAddr: address,
            dataType: 'int256',
            funcId: int256FuncId,
            dataToSend: 'not correct',
          },
        },
      },
      {
        name: 'with specifying uint256 and negative result',
        testData: {
          id: jobID,
          data: {
            exAddr: address,
            dataType: 'uint256',
            funcId: uint256FuncId,
            result: -42,
          },
        },
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
