import { Builder } from '@chainlink/ea-bootstrap'
import { AdapterRequest, APIEndpoint, ConfigFactory } from '@chainlink/types'
import { adapters, makeConfig as makeUpstreamConfig } from './config'
import { Config } from './types'

const endpointMap = Object.fromEntries(adapters.map((adapter) => [adapter.NAME, adapter.endpoints]))

/**
 * endPointSelector Factory that either:
 * - accepts a static upstream endpoint name
 *
 * OR
 *
 * - dynamically uses "method" as the endpoint
 */

export const makeEndpointSelector = <C>(
  makeDownstreamConfig: ConfigFactory<C>,
  downstreamEndpoints: Record<string, APIEndpoint<C>>,
  upstreamEndpointName?: string,
): ((request: AdapterRequest) => APIEndpoint<C>) => {
  const upstreamConfig = makeUpstreamConfig()
  return (request: AdapterRequest): APIEndpoint<C> => {
    const endpointName =
      upstreamEndpointName ?? request.data['method'] ?? upstreamConfig.defaultMethod

    return Builder.selectCompositeEndpoint<C, Config>(
      request,
      makeDownstreamConfig(),
      downstreamEndpoints,
      [['source', endpointMap, endpointName]],
      upstreamConfig,
      true,
    )
  }
}
