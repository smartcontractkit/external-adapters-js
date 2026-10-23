import {
  Transport,
  TransportGenerics,
  TransportRoutes,
} from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

const logger = makeLogger('NobiEndpoint')

// Hardcoded on purpose, documented max connections per key from the data provider
const MAX_TRANSPORTS = 10

// Framework requires transport names to contain only lowercase letters
const indexToTransportName = (i: number): string => `ws${String.fromCharCode(97 + i)}`

export class FillFirstTransportRoutes<T extends TransportGenerics> {
  // requestMapping is intentionally add-only (no decrement on unsubscribe) to keep routing stable
  // for long-lived pairs. The underlying transport handles subscribe/unsubscribe independently.
  private requestMapping: Map<string, string>
  private transportRoutes: TransportRoutes<T>

  constructor(transportBuilder: () => Transport<T>) {
    this.requestMapping = new Map()
    this.transportRoutes = new TransportRoutes<T>()
    for (let i = 0; i < MAX_TRANSPORTS; i++) {
      this.transportRoutes.register(indexToTransportName(i), transportBuilder())
    }
  }

  getTransportRoutes = () => this.transportRoutes

  defaultTransportName = () => indexToTransportName(0)

  routeRequest = (base: string, quote: string, maxSubscriptionsPerTransport: number): string => {
    // find if key is in the mapping already
    const mappingKey = `${base}/${quote}`
    const transportName = this.requestMapping.get(mappingKey)
    if (transportName) {
      logger.debug(`Routing mapping found for ${mappingKey}: transportName = ${transportName}`)
      return transportName
    }

    // if not found, find the first transport with available capacity and assign it in the mapping
    const transportIndex = Math.floor(this.requestMapping.size / maxSubscriptionsPerTransport)

    // return 429 if we've reached max capacity on all transports (MAX_TRANSPORTS * MAX_SUBSCRIPTIONS_PER_TRANSPORT)
    if (transportIndex >= MAX_TRANSPORTS) {
      throw new AdapterError({
        statusCode: 429,
        message: `All transports are at full capacity, the EA has reached the maximum number of active transports (${MAX_TRANSPORTS}) and subscriptions per transport (${maxSubscriptionsPerTransport})`,
      })
    }

    // assign the new transport in the mapping and return it
    const newTransportName = indexToTransportName(transportIndex)
    this.requestMapping.set(mappingKey, newTransportName)
    logger.debug(
      `Routing new ${mappingKey} to ${newTransportName}, current requestMapping size = ${this.requestMapping.size}`,
    )

    return newTransportName
  }
}
