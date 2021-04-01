import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

const TestOracleAddress = '0x8688ebA9Bf38cBb1Fa27A8C3Fda11414D6057887'
const FunctionSelector = '0x4ab0d190'
const DataPrefixExample =
  '0x9b8c5ab8dc03bb19d6a5047c213537c5000d151e66e49458e054c68cb504904f0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000869795b26b0f5f00ba2b3cf3380634fb5f4806094357855e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060346c9e'

describe('execute', () => {
  const jobID = 'fd26a90e0aa84040bc6b4d6f5036a23a'
  const execute = makeExecute({ rpcUrl: '', privateKey: '', networkId: 1, api: {} })

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'value not supplied',
        testData: {
          id: jobID,
          data: {
            address: TestOracleAddress,
            dataPrefix: DataPrefixExample,
            functionSelector: FunctionSelector,
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
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
