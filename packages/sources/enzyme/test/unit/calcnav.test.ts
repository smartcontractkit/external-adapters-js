import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src'
import { ENV_RPC_URL } from '../../src/config'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env[ENV_RPC_URL] = process.env[ENV_RPC_URL] || 'http://localhost:8545/'

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'calculatorContract not supplied',
        testData: { id: jobID, data: { vaultProxy: '0x44902e5a88371224d9ac172e391C64257B701Ade' } },
      },
      {
        name: 'vaultProxy not supplied',
        testData: {
          id: jobID,
          data: { calculatorContract: '0x0b2cBB1974f17700531439E3e4AfF5e5D2AADD4A' },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
