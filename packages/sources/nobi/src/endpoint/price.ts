import {
  AdapterEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { buildNobiWsTransport } from '../transport/price'

// Hardcoded on purpose, documented max connections from the data provider
const MAX_TRANSPORTS = 10

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'BTC',
    quote: 'USD',
  },
])

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

// We register MAX_TRANSPORTS transports on the endpoint
// Requests will be routed to the first transport available up to
// config.MAX_SUBSCRIPTIONS_PER_TRANSPORT subscriptions then the onto the next transport and so on
const transportRoutes = new TransportRoutes<BaseEndpointTypes>()
for (let i = 0; i < MAX_TRANSPORTS; i++) {
  transportRoutes.register(`ws${i}`, buildNobiWsTransport())
}

// Maps request cache key -> the transport it's assigned to
const requestMapping: Map<string, string> = new Map()

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: ['state'],
  inputParameters,
  transportRoutes,
  customRouter: (req, settings): string => {
    const transportName = requestMapping.get(req.requestContext.cacheKey)

    // If the cache key is in the mapping, the request has already been routed to a transport
    // and we want to keep routing all following requests to the same one
    if (transportName) {
      return transportName
    }

    // If the cache key is not in the mapping, we need to find a transport to route the request to
    // No need to loop, we can just find the right one by the capacity we have
    const transportIndex = Math.floor(
      requestMapping.size / settings.MAX_SUBSCRIPTIONS_PER_TRANSPORT,
    )
    const newTransportName = `ws${transportIndex}`

    // If we exceed the max capacity of all transports, we can throw an error or route to a default transport
    if (transportIndex >= MAX_TRANSPORTS) {
      throw new AdapterError({
        statusCode: 429,
        message: `All transports are at full capacity, the EA has reached the maximum number of active transports (${MAX_TRANSPORTS}) and subscriptions per transport (${settings.MAX_SUBSCRIPTIONS_PER_TRANSPORT})`,
      })
    }

    // Add the cache key to the mapping with the correct transport we routed to
    // This should be thread safe as it's within this synchronous execution context
    requestMapping.set(req.requestContext.cacheKey, newTransportName)

    return newTransportName
  },
})
