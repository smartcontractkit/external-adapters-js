import { Builder } from '@chainlink/ea-bootstrap'
import type { AdapterRequest, APIEndpoint, ConfigFactory } from '@chainlink/ea-bootstrap'
import { adaptersV2, adaptersV3, makeConfig as makeUpstreamConfig } from './config'
import { Config } from './types'
import * as types from '@chainlink/ea-bootstrap'
import { AdapterImplementation as v2AdapterImplementation } from '@chainlink/ea-bootstrap'
import { Adapter as v3AdapterImplementation } from '@chainlink/external-adapter-framework/adapter'

const endpointMap = createEndpointMap(adaptersV2, adaptersV3)

function createEndpointMap(
  adaptersV2: v2AdapterImplementation[],
  adaptersV3: v3AdapterImplementation[],
) {
  const endpointList = adaptersV2.map((adapter) => {
    if (!adapter.endpoints)
      throw new Error(`${adapter.NAME} package does not have endpoints exported.`)
    return [adapter.NAME, adapter.endpoints]
  })

  // Build API endpoint map with the same structure as v2 using v3 properties
  const v3EndpointList = adaptersV3.map((adapter) => {
    if (!adapter.endpoints) throw new Error(`${adapter.name} package does not have endpoints set.`)

    const adapterEndpointMap = {} as { [endpoint: string]: APIEndpoint }
    adapter.endpoints.forEach((e) => {
      adapterEndpointMap[e.name] = {
        supportedEndpoints: e.aliases ? [e.name, ...e.aliases] : [e.name],
        inputParameters: e.inputParameters.definition,
      } as APIEndpoint
    })
    return [adapter.name, adapterEndpointMap]
  })

  return Object.fromEntries(endpointList.concat(v3EndpointList))
}

/**
 * endPointSelector Factory that either:
 * - accepts a static upstream endpoint name
 *
 * OR
 *
 * - dynamically uses "method" as the endpoint
 */

export const makeEndpointSelector = <C extends types.Config>(
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
