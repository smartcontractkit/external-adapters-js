import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { makeExecute } from '../../src/adapter'
import { TInputParameters } from '../../src/endpoint'
import * as endpoints from '../../src/endpoint'
import testPayload from '../../test-payload.json'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()

  process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || 'fake_rpc_url'

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'empty addresses',
        testData: { id: jobID, data: { addresses: [] } },
      },
      {
        name: 'empty result',
        testData: { id: jobID, data: { result: [] } },
      },
      {
        name: 'invalid confirmations (string)',
        testData: {
          id: jobID,
          data: {
            addresses: [{ address: '0xEF9FFcFbeCB6213E5903529c8457b6F61141140d' }],
            minConfirmations: 'asd',
          },
        },
      },
      {
        name: 'invalid confirmations (float)',
        testData: {
          id: jobID,
          data: {
            addresses: [{ address: '0xEF9FFcFbeCB6213E5903529c8457b6F61141140d' }],
            minConfirmations: 12.3,
          },
        },
      },
      {
        name: 'invalid confirmations (negative)',
        testData: {
          id: jobID,
          data: {
            addresses: [{ address: '0xEF9FFcFbeCB6213E5903529c8457b6F61141140d' }],
            minConfirmations: -1,
          },
        },
      },
      {
        name: 'invalid confirmations (over 64)',
        testData: {
          id: jobID,
          data: {
            addresses: [{ address: '0xEF9FFcFbeCB6213E5903529c8457b6F61141140d' }],
            minConfirmations: 65,
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

describe('test-payload.json', () => {
  it('should contain all endpoints/aliases', () => {
    const endpointsWithAliases = Object.keys(endpoints)
      .map((e) => [...(endpoints[e as keyof typeof endpoints].supportedEndpoints || [])])
      .flat()
    endpointsWithAliases.forEach((alias) => {
      const requests = testPayload.requests as { endpoint?: string }[]
      const aliasedRequest = requests.find((req) => req?.endpoint === alias)
      expect(aliasedRequest).toBeDefined()
    })
  })
})
