import { AdapterRequest, APIEndpoint, Config, Execute } from '@chainlink/types'
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
        debug: {
          cacheKey: 'Golyna0Qc+GRcASb5oBWQsn7yyI=',
          batchCacheKey: 'dqKaaikVnrFiduxXI7VKTYpph9c=',
          batchChildrenCacheKeys: [
            [
              'TqD76f8doobwnYbka8XwwKh0O8M=',
              {
                data: {
                  batchPropArray: 'str1',
                  batchPropString: 'batchString',
                  endpoint: 'random',
                  from: 'btc',
                  includes: {},
                  maxAge: 444,
                  number: 123.4,
                  overrides: {
                    btc: 'bitcoin',
                  },
                  to: 'eth',
                  tokenOverrides: {
                    eth: 'test',
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
