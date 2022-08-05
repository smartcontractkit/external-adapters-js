import { assertError } from '@chainlink/ea-test-helpers'
import { AdapterError, AdapterRequest, Requester } from '@chainlink/ea-bootstrap'
import * as circuitbreakerAllocationAdapter from '../../src/index'
import { dataProviderConfig, mockDataProviderResponses } from './fixtures'
import nock from 'nock'
import { TInputParameters } from '../../src/endpoint'

let oldEnv: NodeJS.ProcessEnv

describe('execute', () => {
  const execute = circuitbreakerAllocationAdapter.makeExecute()

  beforeAll(async () => {
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
  })

  afterAll(() => {
    process.env = oldEnv
    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
  })

  describe('valid result method', () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.CACHE_ENABLED = 'false'
    for (const source of Object.keys(dataProviderConfig)) {
      const { providerUrlEnvVar, providerUrl } = dataProviderConfig[source]
      process.env[providerUrlEnvVar] = providerUrl
    }

    mockDataProviderResponses()
    const jobID = '1'
    const request = [
      {
        name: 'should return correct result values',
        input: {
          id: jobID,
          data: {
            primarySource: 'coingecko',
            secondarySource: 'coinmarketcap',
            from: 'ETH',
            to: 'USD',
          },
        },
      },
    ]

    request.forEach((req) => {
      it(`${req.name}`, async () => {
        const resp = await execute(req.input, {})
        expect(resp).toMatchSnapshot()
      })
    })
  })

  describe('validation error', () => {
    const jobID = '1'
    const requests = [
      {
        name: 'empty data',
        input: { id: jobID, data: {} },
      },
      {
        name: 'empty body',
        input: {},
      },
      {
        name: 'primary source attribute not supplied',
        input: {
          id: jobID,
          data: {
            firstSource: 'coinmarketcap',
            from: 'ETH',
            to: 'USD',
          },
        },
      },
      {
        name: 'unsupported primary source',
        input: {
          id: jobID,
          data: {
            primarySource: 'none',
            from: 'ETH',
            to: 'USD',
          },
        },
      },
      {
        name: 'unsupported secondary source',
        input: {
          id: jobID,
          data: {
            secondarySource: 'none',
            from: 'ETH',
            to: 'USD',
          },
        },
      },
      {
        name: 'empty first and secondary source',
        input: {
          id: jobID,
          data: {
            from: 'ETH',
            to: 'USD',
          },
        },
      },
      { name: 'allocations not supplied', input: { id: jobID, data: {} } },
      { name: 'base not supplied', input: { id: jobID, data: { quote: 'ARS' } } },
      { name: 'quote not supplied', input: { id: jobID, data: { base: 'BTC' } } },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        try {
          await execute(req.input as unknown as AdapterRequest<TInputParameters>, {})
        } catch (error) {
          const errorResp = Requester.errored(jobID, error as AdapterError)
          assertError({ expected: 400, actual: errorResp.statusCode }, errorResp, jobID)
        }
      })
    })
  })
})
