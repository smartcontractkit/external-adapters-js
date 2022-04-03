import { AdapterRequest, APIEndpoint, Config, Execute } from '@chainlink/types'
import { withNormalizedInput } from '../../src/lib/middleware/normalize'

describe('Normalize middleware', () => {
  it('successfully cleans up input', async () => {
    const request: AdapterRequest = {
      id: '1',
      data: {
        number: 123.4,
        maxAge: 444,
        from: 'btc',
        to: 'eth',
        overrides: {
          btc: 'bitcoin',
        },
        tokenOverrides: {
          eth: 'test',
        },
        includes: {},
        endpoint: 'random',
        batchPropString: 'batchString',
        batchPropArray: ['str1', 'str2'],
      },
    }
    const response = {
      result: 123.4,
      jobRunID: '1',
      statusCode: 200,
      data: {
        number: 123.4,
      },
    }

    const endpointExecute = async (r) => {
      expect(r).toEqual({
        ...request,
        data: {
          ...request.data,
          number: undefined,
          batchPropString: 'BATCHSTRING',
          batchPropArray: ['STR1', 'STR2'],
        },
      })
      return response
    }

    const apiEndpoint: APIEndpoint<Config> = {
      supportedEndpoints: ['test'],
      inputParameters: {
        from: {
          type: 'string',
        },
        to: {
          type: 'string',
        },
        batchPropString: {
          type: 'string',
        },
        batchPropArray: {
          type: 'array',
        },
      },
      execute: endpointExecute,
      batchablePropertyPath: [
        {
          name: 'batchPropString',
        },
        {
          name: 'batchPropArray',
        },
      ],
    }

    const middleware = withNormalizedInput(() => apiEndpoint)
    const execute = await middleware(apiEndpoint.execute as Execute, {})
    await execute(request, {})
  })
})
