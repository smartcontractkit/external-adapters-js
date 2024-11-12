import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import overrides from '../config/overrides.json'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { buildCryptoHttpTransport, buildWebsocketTransport } from '../transport/utils'
import {
  BaseEndpointTypes,
  cryptoInputParameters,
  customInputValidation,
  customRouter,
} from './utils'

export const endpoint = new PriceEndpoint({
  name: 'marketcap',
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('ws', buildWebsocketTransport('m'))
    .register('rest', buildCryptoHttpTransport('market_cap')),
  customRouter,
  inputParameters: cryptoInputParameters,
  overrides: overrides.coinpaprika,
  customInputValidation,
})
