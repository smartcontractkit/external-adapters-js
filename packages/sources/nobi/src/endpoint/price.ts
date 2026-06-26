import {
  AdapterEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { buildNobiWsTransport } from '../transport/price'

const logger = makeLogger('NobiWsEndpoint')

// Hardcoded on purpose, documented max connections per key from the data provider
const MAX_TRANSPORTS = 10

// Framework requires transport names to contain only lowercase letters
const indexToTransportName = (i: number): string => `ws${String.fromCharCode(97 + i)}`

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
// Requests will be routed to transports in order up to
// config.MAX_SUBSCRIPTIONS_PER_TRANSPORT subscriptions then rollover to the next transport
const transportRoutes = new TransportRoutes<BaseEndpointTypes>()
for (let i = 0; i < MAX_TRANSPORTS; i++) {
  transportRoutes.register(indexToTransportName(i), buildNobiWsTransport())
}

// requestMapping is intentionally add-only (no decrement on unsubscribe) to keep routing stable
// for long-lived pairs. The underlying transport handles subscribe/unsubscribe independently.
export const requestMapping: Map<string, string> = new Map()

export const routeRequest = (
  base: string,
  quote: string,
  maxTransports: number,
  maxSubscriptionsPerTransport: number,
): string => {
  // find if key is in the mapping already
  const mappingKey = `${base}/${quote}`
  const transportName = requestMapping.get(mappingKey)
  if (transportName) {
    logger.debug(`Routing mapping found for ${mappingKey}: transportName = ${transportName}`)
    return transportName
  }

  // if not found, find the first transport with available capacity and assign it in the mapping
  const transportIndex = Math.floor(requestMapping.size / maxSubscriptionsPerTransport)

  // return 429 if we've reached max capacity on all transports (MAX_TRANSPORTS * MAX_SUBSCRIPTIONS_PER_TRANSPORT)
  if (transportIndex >= maxTransports) {
    throw new AdapterError({
      statusCode: 429,
      message: `All transports are at full capacity, the EA has reached the maximum number of active transports (${maxTransports}) and subscriptions per transport (${maxSubscriptionsPerTransport})`,
    })
  }

  // assign the new transport in the mapping and return it
  const newTransportName = indexToTransportName(transportIndex)
  requestMapping.set(mappingKey, newTransportName)
  logger.debug(
    `Routing new ${mappingKey} to ${newTransportName}, current requestMapping size = ${requestMapping.size}`,
  )

  return newTransportName
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: ['crypto', 'state'],
  inputParameters,
  transportRoutes,
  defaultTransport: indexToTransportName(0),
  customRouter: (req, settings) =>
    routeRequest(
      req.requestContext.data.base,
      req.requestContext.data.quote,
      MAX_TRANSPORTS,
      settings.MAX_SUBSCRIPTIONS_PER_TRANSPORT,
    ),
})
