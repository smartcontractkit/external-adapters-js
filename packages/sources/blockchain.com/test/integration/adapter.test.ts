import { Requester } from '@chainlink/ea-bootstrap'
import { assertSuccess, assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { shouldBehaveLikeBalanceAdapter } from '@chainlink/ea-test-helpers'
import { makeExecute } from '../../src/adapter'

shouldBehaveLikeBalanceAdapter(makeExecute(), ['bitcoin_mainnet', 'bitcoin_testnet'])

describe('endpoints: difficulty & height', () => {
  const jobID = '1'
  const execute = makeExecute()

  describe('successful calls @integration', () => {
    const requests = [
      {
        name: 'endpoint difficulty',
        testData: {
          id: jobID,
          data: {
            endpoint: 'difficulty',
          },
        },
      },
      {
        name: 'endpoint height',
        testData: {
          id: jobID,
          data: {
            endpoint: 'height',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data.result).toBeGreaterThan(0)
        expect(data.data.result).toBeGreaterThan(0)
      })
    })
  })

  describe('validation error', () => {
    const requests = [
      {
        name: 'empty body',
        testData: {},
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

  describe('error calls @integration', () => {
    const requests = [
      {
        name: 'unknown endpoint',
        testData: {
          id: jobID,
          data: { endpoint: 'not_real' },
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
