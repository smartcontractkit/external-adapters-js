import { assert } from 'chai'
import { Requester } from '@chainlink/external-adapter'
import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../src/adapter'

describe('execute', () => {
  const execute = makeExecute()
  const jobID = '278c97ffadb54a5bbb93cfec5f7b5503'
  const bytes32FuncId = '0xc2b12a73'
  const int256FuncId = '0xa53b1c1e'
  const uint256FuncId = '0xd2282dc5'
  context('successfully returns data to the node', () => {
    const requests = [
      {
        name: 'without specifying the data type',
        testData: {
          id: jobID,
          data: {
            exAddr: process.env.CONTRACT_ADDRESS,
            funcId: uint256FuncId,
            result: '54',
          },
        },
      },
      {
        name: 'with specifying uint256',
        testData: {
          id: jobID,
          data: {
            exAddr: process.env.CONTRACT_ADDRESS,
            dataType: 'uint256',
            funcId: uint256FuncId,
            result: 42,
          },
        },
      },
      {
        name: 'with specifying bytes32',
        testData: {
          id: jobID,
          data: {
            exAddr: process.env.CONTRACT_ADDRESS,
            dataType: 'bytes32',
            funcId: bytes32FuncId,
            result: 'hello there',
          },
        },
      },
      {
        name: 'with specifying uint256 and negative result',
        testData: {
          id: jobID,
          data: {
            exAddr: process.env.CONTRACT_ADDRESS,
            dataType: 'int256',
            funcId: int256FuncId,
            result: -42,
          },
        },
      },
      {
        name: 'with specifying dataToSend',
        testData: {
          id: jobID,
          data: {
            exAddr: process.env.CONTRACT_ADDRESS,
            dataType: 'int256',
            funcId: int256FuncId,
            dataToSend: 12,
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        assert.equal(data.jobRunID, jobID)
        assert.isNotEmpty(data.data)
      })
    })
  })

  context('validation error', () => {
    const requests = [{ name: 'empty body', testData: {} }]

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

  context('error calls @integration', () => {
    const requests = [{ name: 'empty data', testData: { data: {} } }]
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
