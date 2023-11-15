import { ForexPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/forex-http'
import { ForexBaseEndpointTypes, forexPriceInputParameters } from './utils'
import { wsTransport } from '../transport/forex-ws'

// List of bases whose pairs should be routed to REST only
const assets: string[] = ['AED', 'CNY', 'IDR', 'PHP', 'THB', 'TZS', 'VND']

export const endpoint = new ForexPriceEndpoint({
  name: 'forex',
  transportRoutes: new TransportRoutes<ForexBaseEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  customRouter: (req, adapterConfig) => {
    const { base } = req.requestContext.data as typeof forexPriceInputParameters.validated & {
      transport?: string
    }
    // Always route the listed assets to rest since Finage does not provide adequate
    // updates for them over websocket
    if (assets.includes(base.toUpperCase())) {
      return 'rest'
    } else {
      return adapterConfig.WS_ENABLED ? 'ws' : 'rest'
    }
  },
  inputParameters: forexPriceInputParameters,
  overrides: overrides.finage,
})
