import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src'
import { ENV_ETHEREUM_RPC_URL } from '../../src/config'
import { TInputParameters } from '../../src/endpoint'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env[ENV_ETHEREUM_RPC_URL] = process.env[ENV_ETHEREUM_RPC_URL] || 'http://localhost:8545/'

  describe('validation error', () => {
    const requests = [
      {
        name: 'empty data with endpoint',
        testData: { data: { endpoint: 'calcNetShareValueInAsset' } },
      },
      {
        name: 'calculatorContract not supplied',
        testData: {
          id: jobID,
          data: {
            endpoint: 'calcNetShareValueInAsset',
            vaultProxy: '0x27f23c710dd3d878fe9393d93465fed1302f2ebd',
            quoteAsset: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          },
        },
      },
      {
        name: 'vaultProxy not supplied',
        testData: {
          id: jobID,
          data: {
            endpoint: 'calcNetShareValueInAsset',
            calculatorContract: '0x7c728cd0CfA92401E01A4849a01b57EE53F5b2b9',
            quoteAsset: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          },
        },
      },
      {
        name: 'quoteAsset not supplied',
        testData: {
          id: jobID,
          data: {
            endpoint: 'calcNetShareValueInAsset',
            calculatorContract: '0x7c728cd0CfA92401E01A4849a01b57EE53F5b2b9',
            vaultProxy: '0x27f23c710dd3d878fe9393d93465fed1302f2ebd',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest<TInputParameters>, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error as AdapterError)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
