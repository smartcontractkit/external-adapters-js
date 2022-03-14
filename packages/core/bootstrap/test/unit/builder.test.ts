import { Builder } from '../../src/lib/modules/selector'
import {
  UpstreamEndpointsGroup,
  APIEndpoint,
  ExecuteFactory,
  ExecuteWithConfig,
  Config,
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
})
