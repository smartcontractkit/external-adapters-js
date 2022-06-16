import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'

describe('execute', () => {
  const jobID = '1'
  const execute = makeExecute()
  process.env.API_KEY = process.env.API_KEY ?? 'test_api_key'

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { endpoint: 'nft-floor-price', data: {} } },
      {
        name: 'network not supplied',
        testData: {
          endpoint: 'nft-floor-price',
          id: jobID,
          data: { contractAddress: 'abc', start: 'abc', end: 'abc' },
        },
      },
      {
        name: 'contractAddress not supplied',
        testData: {
          endpoint: 'nft-floor-price',
          id: jobID,
          data: { network: 'abc', start: 'abc', end: 'abc' },
        },
      },
      {
        name: 'start not supplied',
        testData: {
          endpoint: 'nft-floor-price',
          id: jobID,
          data: { network: 'abc', contractAddress: 'abc', end: 'abc' },
        },
      },
      {
        name: 'end not supplied',
        testData: {
          endpoint: 'nft-floor-price',
          id: jobID,
          data: { network: 'abc', contractAddress: 'abc', start: 'abc' },
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
