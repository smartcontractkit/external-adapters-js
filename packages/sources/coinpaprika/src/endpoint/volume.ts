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
  name: 'volume',
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('ws', buildWebsocketTransport('v24h'))
    .register('rest', buildCryptoHttpTransport('volume_24h')),
  customRouter,
  inputParameters: cryptoInputParameters,
  overrides: overrides.coinpaprika,
  customInputValidation,
})
