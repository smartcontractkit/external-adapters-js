import { Builder } from '../../src/lib/modules/selector'
import {
  UpstreamEndpointsGroup,
  APIEndpoint,
  ExecuteFactory,
  ExecuteWithConfig,
  Config,
  AdapterRequest,
} from '@chainlink/types'

describe('Selector', () => {
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

  describe(`selectCompositeEndpoint`, () => {
    const request = {
      id: '1',
      data: {
        endpoint: 'testDownstreamEndpoint',
        source: 'SOMESOURCEADAPTER',
      },
    }
    const downstreamConfig = {
      defaultEndpoint: 'testDownstreamEndpoint',
    }
    const mockAPIEndpoint: APIEndpoint = {
      supportedEndpoints: ['testDownstreamEndpoint'],
      makeExecute,
      inputParameters: {
        inputParam1: true,
      },
    }
    const downstreamEndpoints = { someCompositeEndpoint: mockAPIEndpoint }
    const upstreamConfig = {}
    const endpointName = 'testUpstreamEndpoint'
    const mockAPIEndpoint2: APIEndpoint = {
      supportedEndpoints: ['testUpstreamEndpoint'],
      makeExecute,
      inputParameters: {
        inputParam2: true,
      },
    }
    const endpointMap = {
      SOMESOURCEADAPTER: { someSourceEndpoint: mockAPIEndpoint2 },
    }
    it(`correctly merges downstream input parameters`, () => {
      const upstreamEndpoint: UpstreamEndpointsGroup = ['source', endpointMap, endpointName]
      const mergedDownstreamEndpoint = Builder.selectCompositeEndpoint(
        request,
        downstreamConfig,
        downstreamEndpoints,
        [upstreamEndpoint],
        upstreamConfig,
        false,
      )
      expect(mergedDownstreamEndpoint.inputParameters).toHaveProperty('inputParam2')
      expect(mergedDownstreamEndpoint.inputParameters['inputParam2']).toBeTruthy()
    })

    it(`ignores required input parameters when ignoreRequired is true`, () => {
      const upstreamEndpoint: UpstreamEndpointsGroup = ['source', endpointMap, endpointName]
      const mergedDownstreamEndpoint = Builder.selectCompositeEndpoint(
        request,
        downstreamConfig,
        downstreamEndpoints,
        [upstreamEndpoint],
        upstreamConfig,
        true,
      )
      expect(mergedDownstreamEndpoint.inputParameters).toHaveProperty('inputParam2')
      expect(mergedDownstreamEndpoint.inputParameters['inputparam2']).toBeFalsy()
    })
  })

  describe('selectEndpoint', () => {
    it('endpoint not found when no default endpoint is configured and param is not present', () => {
      const config: Config = {}
      const apiEndpoints: Record<string, APIEndpoint<Config>> = {}
      const request = {
        id: '1',
        data: null,
      }
      expect(() => Builder.selectEndpoint(request, config, apiEndpoints)).toThrowError(
        'Endpoint not supplied and no default found',
      )
    })

    it('endpoint not found when no endpoints are configured and param is present', () => {
      const config: Config = {}
      const apiEndpoints: Record<string, APIEndpoint<Config>> = {}
      const request = {
        id: '1',
        data: {
          endpoint: 'test',
        },
      }
      expect(() => Builder.selectEndpoint(request, config, apiEndpoints)).toThrowError(
        'Endpoint test not supported',
      )
    })

    it('endpoint not found when no endpoints are configured, default is set and param is present', () => {
      const config: Config = {
        defaultEndpoint: 'asdf',
      }
      const apiEndpoints: Record<string, APIEndpoint<Config>> = {}
      const request = {
        id: '1',
        data: {
          endpoint: 'test',
        },
      }
      expect(() => Builder.selectEndpoint(request, config, apiEndpoints)).toThrowError(
        'Endpoint test not supported',
      )
    })

    it('overriden endpoint not found in supported ones', () => {
      const config: Config = {}
      const apiEndpoints: Record<string, APIEndpoint<Config>> = {
        test: {
          supportedEndpoints: ['test'],
          endpointOverride: () => {
            return 'qwerp'
          },
        },
      }
      const request = {
        id: '1',
        data: {
          endpoint: 'test',
        },
      }
      expect(() => Builder.selectEndpoint(request, config, apiEndpoints)).toThrowError(
        'Overriden Endpoint qwerp not supported',
      )
    })

    it('resultPath is modified according to endpointResultPaths', () => {
      const config: Config = {}
      const apiEndpoints: Record<string, APIEndpoint<Config>> = {
        test: {
          supportedEndpoints: ['test', 'qwer'],
          endpointResultPaths: {
            test: 'replaced.string',
            qwer: (request: AdapterRequest) => request.data.stuff,
          },
        },
      }

      const request = {
        id: '1',
        data: {
          endpoint: 'test',
          stuff: 'STUFF',
          resultPath: undefined,
        },
      }
      Builder.selectEndpoint(request, config, apiEndpoints)
      expect(request.data.resultPath).toBe('replaced.string')

      const request2 = {
        id: '1',
        data: {
          endpoint: 'qwer',
          stuff: 'STUFF',
          resultPath: undefined,
        },
      }
      Builder.selectEndpoint(request2, config, apiEndpoints)
      expect(request2.data.resultPath).toBe('STUFF')
    })
  })

  describe('buildSelector', () => {
    it('returns execute result', async () => {
      const result = {
        result: 123.4,
        jobRunID: '1',
        statusCode: 200,
        data: {
          number: 123.4,
        },
      }
      const config: Config = {
        api: {
          baseURL: 'http://test.com',
        },
      }
      const apiEndpoints: Record<string, APIEndpoint<Config>> = {
        test: {
          execute: async () => result,
          supportedEndpoints: ['test'],
        },
      }
      const request = {
        id: '1',
        data: {
          endpoint: 'test',
        },
      }

      expect(await Builder.buildSelector(request, {}, config, apiEndpoints)).toBe(result)
    })

    it('returns makeExecute result', async () => {
      const result = {
        result: 123.4,
        jobRunID: '1',
        statusCode: 200,
        data: {
          number: 123.4,
        },
      }
      const config: Config = {
        api: {
          baseURL: 'http://test.com',
        },
      }
      const apiEndpoints: Record<string, APIEndpoint<Config>> = {
        test: {
          makeExecute: () => async () => result,
          supportedEndpoints: ['test'],
        },
      }
      const request = {
        id: '1',
        data: {
          endpoint: 'test',
        },
      }

      expect(await Builder.buildSelector(request, {}, config, apiEndpoints)).toBe(result)
    })

    it('throws exception when no handler is defined', async () => {
      const result = {
        result: 123.4,
        jobRunID: '1',
        statusCode: 200,
        data: {
          number: 123.4,
        },
      }
      const config: Config = {
        api: {
          baseURL: 'http://test.com',
        },
      }
      const apiEndpoints: Record<string, APIEndpoint<Config>> = {
        test: {
          supportedEndpoints: ['test'],
        },
      }
      const request = {
        id: '1',
        data: {
          endpoint: 'test',
        },
      }

      expect(
        async () => await Builder.buildSelector(request, {}, config, apiEndpoints),
      ).rejects.toThrowError('Internal error: no execute handler found')
    })
  })
})
