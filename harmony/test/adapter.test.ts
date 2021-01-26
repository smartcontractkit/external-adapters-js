import { assert } from 'chai'
import { assertSuccess } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../src/adapter'

describe('execute', () => {
  const jobID = '278c97ffadb54a5bbb93cfec5f7b5503'
  const contractAddr = '0x0185b239a9d2080fd03536213413488a4b171334'
  const bytes32FuncId = '0xc2b12a73'
  const int256FuncId = '0xa53b1c1e'
  const uint256FuncId = '0xd2282dc5'
  const execute = makeExecute()

  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'when writing uint256 to a contract',
        testData: {
          id: jobID,
          data: {
            address: contractAddr,
            functionSelector: uint256FuncId,
            result: '0x000000000000000000000000000000000000000000000000000000000000002a',
          },
        },
      },
      {
        name: 'when writing bytes32 to a contract',
        testData: {
          id: jobID,
          data: {
            address: contractAddr,
            functionSelector: bytes32FuncId,
            result: '0x68656c6c6f207468657265000000000000000000000000000000000000000000',
          },
        },
      },
      {
        name: 'when writing int256 to a contract',
        testData: {
          id: jobID,
          data: {
            address: contractAddr,
            dataType: 'int256',
            functionSelector: int256FuncId,
            result: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd6',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, () => {
        execute(req.testData as AdapterRequest).then((data) => {
          assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
          assert.isNotEmpty(data.data)
        })
      })
    })
  })
})
