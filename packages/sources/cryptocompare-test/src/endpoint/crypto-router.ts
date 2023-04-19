import { wsTransport } from './crypto-ws'
import { CryptoEndpointTypes, cryptoInputParams } from '../crypto-utils'
import { httpTransport } from './crypto'
import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import overrides from '../config/overrides.json'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'

export const endpoint = new CryptoPriceEndpoint<CryptoEndpointTypes>({
  name: 'crypto',
  transportRoutes: new TransportRoutes<CryptoEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  customRouter: (_req, adapterConfig) => {
    return adapterConfig.WS_ENABLED ? 'ws' : 'rest'
  },
  inputParameters: cryptoInputParams,
  overrides: overrides.cryptocompare,
})
