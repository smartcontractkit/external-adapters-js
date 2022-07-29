import { AdapterData, AdapterRequest, APIEndpoint, Config, Execute } from '../../src/types'
import { withCacheKey } from '../../src/lib/middleware/cache-key'

describe('Cache key middleware', () => {
  it('adds a deterministic cache key to the debug object', async () => {
    const request: AdapterRequest = {
      id: '1',
      data: {
        number: 123.4,
        maxAge: 444,
        from: 'btc',
        to: 'eth',
        overrides: {
          btc: { bitcoin: 'bitcoin' },
        },
        tokenOverrides: {
          eth: { test: 'test' },
        },
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
        statusCode: 200,
      },
    }

    const endpointExecute = async (r: AdapterRequest<AdapterData>) => {
      expect(r).toEqual({
        ...request,
        debug: {
          cacheKey: 'IiDTaC+lXPqyxhmcVrVfT2GtP/E=',
          batchCacheKey: 'w8ekGHVms2AJFoDlV/iyLzGpFsc=',
          batchChildrenCacheKeys: [
            [
              'm3A/a6C/vZvxrqFWlRtsGdCBx6Y=',
              {
                data: {
                  batchPropArray: 'str1',
                  batchPropString: 'batchString',
                  endpoint: 'random',
                  from: 'btc',
                  maxAge: 444,
                  number: 123.4,
                  overrides: {
                    btc: { bitcoin: 'bitcoin' },
                  },
                  to: 'eth',
                  tokenOverrides: {
                    eth: { test: 'test' },
                  },
                },
                id: '1',
              },
            ],
          ],
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

    const middleware = withCacheKey(() => apiEndpoint)
    const execute = await middleware(apiEndpoint.execute as Execute, {})
    await execute(request, {})
  })
})
