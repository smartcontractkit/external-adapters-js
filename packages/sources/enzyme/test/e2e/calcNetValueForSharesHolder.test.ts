import { Requester } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src'
import { ENV_RPC_URL } from '../../src/config'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env[ENV_RPC_URL] = process.env[ENV_RPC_URL] || 'http://localhost:8545/'

  describe('successful calls', () => {
    const requests = [
      {
        name: 'id not supplied',
        testData: {
          data: {
            endpoint: 'calcNetValueForSharesHolder',
            calculatorContract: '0x0b2cBB1974f17700531439E3e4AfF5e5D2AADD4A',
            vaultProxy: '0x399acf6102c466a3e4c5f94cd00fc1bfb071d3c1',
            sharesHolder: '0x31d675bd2bdfdd3e332311bef7cb6ba357a5d4e3',
          },
        },
      },
      {
        name: 'calculatorContract/vaultProxy/sharesHolder',
        testData: {
          id: jobID,
          data: {
            endpoint: 'calcNetValueForSharesHolder',
            calculatorContract: '0x0b2cBB1974f17700531439E3e4AfF5e5D2AADD4A',
            vaultProxy: '0x399acf6102c466a3e4c5f94cd00fc1bfb071d3c1',
            sharesHolder: '0x31d675bd2bdfdd3e332311bef7cb6ba357a5d4e3',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest, {})
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(Number(data.result)).toBeGreaterThan(0)
        expect(Number(data.data.result)).toBeGreaterThan(0)
      })
    })
  })

  describe('error calls', () => {
    const requests = [
      {
        name: 'unknown calculatorContract',
        testData: {
          id: jobID,
          data: {
            endpoint: 'calcNetValueForSharesHolder',
            calculatorContract: '0x0000000000000000000000000000000000000000',
            vaultProxy: '0x399acf6102c466a3e4c5f94cd00fc1bfb071d3c1',
            sharesHolder: '0x31d675bd2bdfdd3e332311bef7cb6ba357a5d4e3',
          },
        },
      },
      {
        name: 'unknown vaultProxy',
        testData: {
          id: jobID,
          data: {
            endpoint: 'calcNetValueForSharesHolder',
            calculatorContract: '0x0b2cBB1974f17700531439E3e4AfF5e5D2AADD4A',
            vaultProxy: '0x0000000000000000000000000000000000000000',
            sharesHolder: '0x31d675bd2bdfdd3e332311bef7cb6ba357a5d4e3',
          },
        },
      },
      {
        name: 'unknown sharesHolder',
        testData: {
          id: jobID,
          data: {
            endpoint: 'calcNetValueForSharesHolder',
            calculatorContract: '0x0b2cBB1974f17700531439E3e4AfF5e5D2AADD4A',
            vaultProxy: '0x399acf6102c466a3e4c5f94cd00fc1bfb071d3c1',
            sharesHolder: '0x0000000000000000000000000000000000000000',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 500, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
