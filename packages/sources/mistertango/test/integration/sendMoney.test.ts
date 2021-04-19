import { Requester, util } from '@chainlink/ea-bootstrap'
import { assertError, assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  // checking API values
  util.getRequiredEnv('API_KEY')
  util.getRequiredEnv('API_USER')
  util.getRequiredEnv('API_SECRET')

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'sendmoney endpoint',
        testData: {
          data: {
            endpoint: 'sendmoney',
            amount: 0.01,
            account: 'GB33BUKB20201555555555',
            details: 'test transaction',
          },
        },
      },
      {
        name: 'write endpoint',
        testData: {
          id: jobID,
          data: {
            endpoint: 'write',
            amount: 0.01,
            account: 'GB33BUKB20201555555555',
            details: 'test transaction',
          },
        },
      },
      {
        name: 'name parameter included',
        testData: {
          id: jobID,
          data: {
            endpoint: 'sendmoney',
            amount: 0.01,
            recipient: 'Not Real',
            account: 'GB33BUKB20201555555555',
            details: 'test transaction',
          },
        },
      },
    ]

    requests.forEach(req => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).toBeGreaterThan(0)
        expect(data.data.result).toBeGreaterThan(0)
      })
    })
  })

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'zero amount',
        testData: {
          id: jobID,
          data: {
            endpoint: 'sendmoney',
            amount: 0,
            account: 'GB33BUKB20201555555555',
            details: 'test transaction',
          },
        },
      }
    ]

    requests.forEach(req => {
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
