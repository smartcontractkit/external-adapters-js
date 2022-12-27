import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { CryptoEndpointTypes, inputParameters } from '../../crypto-utils'
import { httpTransport } from '../http/crypto'
import { wsTransport } from '../ws/crypto'

export const routingTransport = new RoutingTransport<CryptoEndpointTypes>(
  {
    WS: wsTransport,
    REST: httpTransport,
  },
  (_, adapterConfig) => (adapterConfig?.WS_ENABLED ? 'WS' : 'REST'),
)

export const endpoint = new PriceEndpoint<CryptoEndpointTypes>({
  name: 'crypto',
  aliases: ['price', 'prices', 'crypto-synth'],
  transport: routingTransport,
  inputParameters: inputParameters,
})
