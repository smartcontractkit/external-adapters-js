import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { makeExecute } from '../../src/adapter'
import coinsList from './coinsList.json'
import nock from 'nock'

describe('price endpoint', () => {
  const jobID = '1'

  describe('validation error', () => {
    const execute = makeExecute()
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'base not supplied',
        testData: { id: jobID, data: { quote: 'USD' } },
      },
      {
        name: 'quote not supplied',
        testData: { id: jobID, data: { base: 'ETH' } },
      },
      {
        name: 'incorrect symbol to symbol override format',
        testData: {
          id: jobID,
          data: {
            base: 'ETH',
            quote: 'USD',
            overrides: {
              ETH: 'incorrectly-formatted-override',
            },
          },
        },
      },
      {
        name: 'incorrect symbol to id override format',
        testData: {
          id: jobID,
          data: {
            base: 'ETH',
            quote: 'USD',
            symbolToIdOverrides: {
              ETH: 'incorrectly-formatted-override',
            },
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.testData as AdapterRequest, {})
          throw new Error('Adapter did not produce error as expected.')
        } catch (error) {
          const errorResp = Requester.errored(jobID, error)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
