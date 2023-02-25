import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { CryptoEndpointTypes, inputParameters } from '../../crypto-utils'
import { httpTransport } from '../http/crypto'
import { wsTransport } from '../ws/crypto'

export const routingTransport = new RoutingTransport<CryptoEndpointTypes>(
  {
    ws: wsTransport,
    rest: httpTransport,
  },
  (_, adapterConfig) => (adapterConfig?.WS_ENABLED ? 'ws' : 'rest'),
)

export const endpoint = new CryptoPriceEndpoint<CryptoEndpointTypes>({
  name: 'crypto',
  aliases: ['price', 'prices', 'crypto-synth'],
  transport: routingTransport,
  inputParameters: inputParameters,
})
