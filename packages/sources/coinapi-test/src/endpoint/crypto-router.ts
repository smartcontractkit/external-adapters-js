import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { EndpointTypes, inputParameters } from '../crypto-utils'
import { httpTransport } from './crypto'
import { wsTransport } from './crypto-ws'

export const routingTransport = new RoutingTransport<EndpointTypes>(
  {
    WS: wsTransport,
    REST: httpTransport,
  },
  (_, adapterConfig) => (adapterConfig?.WS_ENABLED ? 'WS' : 'REST'),
)

export const endpoint = new PriceEndpoint<EndpointTypes>({
  name: 'crypto',
  aliases: ['price'],
  transport: routingTransport,
  inputParameters: inputParameters,
})
