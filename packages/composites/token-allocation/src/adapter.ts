import { Builder } from '@chainlink/ea-bootstrap'
import type { AdapterRequest, APIEndpoint, ConfigFactory } from '@chainlink/ea-bootstrap'
import { adapters, makeConfig as makeUpstreamConfig } from './config'
import { Config } from './types'

const endpointMap = Object.fromEntries(
  adapters.map((adapter) => {
    if (!adapter.endpoints)
      throw new Error(`${adapter.NAME} package does not have endpoints exported.`)
    return [adapter.NAME, adapter.endpoints]
  }),
)

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
      [['source', endpointMap, endpointName as string]],
      upstreamConfig,
      true,
    )
  }
}
