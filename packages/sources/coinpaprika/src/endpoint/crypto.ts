import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { buildCryptoHttpTransport, buildWebsocketTransport } from '../transport/utils'
import { BaseEndpointTypes, cryptoInputParameters, customInputValidation } from './utils'
import overrides from '../config/overrides.json'

export const endpoint = new CryptoPriceEndpoint({
  name: 'crypto',
  aliases: ['price'],
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('ws', buildWebsocketTransport('p'))
    .register('rest', buildCryptoHttpTransport('price')),
  defaultTransport: 'rest',
  inputParameters: cryptoInputParameters,
  overrides: overrides.coinpaprika,
  customInputValidation,
})
