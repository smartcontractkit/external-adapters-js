import { Requester } from '@chainlink/ea-bootstrap'
import { assertError } from '@chainlink/ea-test-helpers'
import {
  AdapterRequest,
  APIEndpoint,
  ExecuteFactory,
  ExecuteWithConfig,
  Config,
} from '@chainlink/types'
import { BigNumber } from 'ethers'
import { makeExecute, priceTotalValue } from '../../src/endpoint'
import { makeEndpointSelector } from '../../src/adapter'
import { makeConfig, adapters } from '../../src/config'
import { TokenAllocations } from '../../src/types'

describe('execute', () => {
  const jobID = '1'
  process.env.ADAPTER_URL = 'ignoreable'
  const execute = makeExecute(makeConfig(''))

  describe('validation error', () => {
    const requests = [
      { name: 'empty body', testData: {} },
      { name: 'empty data', testData: { data: {} } },
      {
        name: 'allocations not supplied',
        testData: { id: jobID, data: {} },
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

  describe('calculate total price value', () => {
    const allocations: TokenAllocations = [
      {
        symbol: 'wBTC',
        balance: 100000000,
        decimals: 8,
      },
      {
        symbol: 'DAI',
        balance: BigNumber.from('1000000000000000000'),
        decimals: 18,
      },
    ]

    it('price value is correct #1', () => {
      const data = {
        wBTC: {
          quote: {
            USD: {
              price: 10,
            },
          },
        },
        DAI: {
          quote: {
            USD: {
              price: 1,
            },
          },
        },
      }
      const value = priceTotalValue('test', allocations, 'USD', data)
      const expectedValue = 11
      expect(value).toBe(expectedValue)
    })

    it('price value is correct #2', () => {
      const data = {
        wBTC: {
          quote: {
            USD: {
              price: 33.2,
            },
          },
        },
        DAI: {
          quote: {
            USD: {
              price: 0.9,
            },
          },
        },
      }
      const value = priceTotalValue('test', allocations, 'USD', data)
      const expectedValue = 34.1
      expect(value).toBe(expectedValue)
    })
  })
})

describe('source adapters', () => {
  it(`all contain endpoints`, () => {
    adapters.forEach((adapter) => expect(adapter.endpoints).toBeTruthy())
  })
})

describe('makeEndpointSelector', () => {
  const execute: ExecuteWithConfig<Config> = async () => {
    return {
      jobRunID: '1',
      statusCode: 200,
      data: { result: 1 },
      result: 1,
    }
  }

  const makeExecute: ExecuteFactory<Config> = (config) => async (request, context) =>
    execute(request, context, config)

  const request = {
    id: '1',
    data: {
      endpoint: 'testDownstreamEndpoint',
      source: adapters[0].NAME,
    },
  }

  const downstreamConfig = {
    defaultEndpoint: 'testDownstreamEndpoint',
  }
  const downstreamConfigFactory = () => downstreamConfig

  const mockAPIEndpoint: APIEndpoint = {
    supportedEndpoints: ['testDownstreamEndpoint'],
    makeExecute,
    inputParameters: {
      inputParam1: true,
    },
  }
  const downstreamEndpoints = { someCompositeEndpoint: mockAPIEndpoint }

  it(`correctly merges downstream input parameters`, () => {
    const endpointSelector = makeEndpointSelector(downstreamConfigFactory, downstreamEndpoints)
    const endpoint = endpointSelector(request)
    for (const inputParameter in adapters[0].inputParameters) {
      expect(endpoint.inputParameters).toHaveProperty(inputParameter)
    }
  })
})
