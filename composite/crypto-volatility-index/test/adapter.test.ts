import { assert } from 'chai'
import { Requester } from '@chainlink/external-adapter'
import { assertSuccess, assertError } from '@chainlink/adapter-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { execute } from '../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const contractAddress = '0xdd042a17f7d9c407b66e62e4c5e8ee53ecd1aa77' // Mock address on Kovan testnet
  context('successful calls @integration', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: { data: { contractAddress } },
      },
      {
        name: 'Calculates with on-chain value',
        testData: {
          id: jobID,
          data: { contractAddress },
        },
      },
    ]
    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          const data = await execute(req.testData as AdapterRequest)
          assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
          assert.isAbove(data.result, 0)
          assert.isAbove(data.data.result, 0)
        } catch (error) {
          console.log(error)
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
