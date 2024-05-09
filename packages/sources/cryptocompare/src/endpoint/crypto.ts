import { wsTransport } from '../transport/crypto-ws'
import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import overrides from '../config/overrides.json'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { httpTransport } from '../transport/crypto-http'
import { BaseEndpointTypes, cryptoInputParams } from './utils'

export const endpoint = new CryptoPriceEndpoint({
  name: 'crypto',
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'ws',
  customRouter: (_req, adapterConfig) => {
    return adapterConfig.WS_ENABLED ? 'ws' : 'rest'
  },
  requestTransforms: [
    (req) => {
      req.requestContext.data.base = req.requestContext.data.base.toUpperCase()
      req.requestContext.data.quote = req.requestContext.data.quote.toUpperCase()
    },
  ],
  inputParameters: cryptoInputParams,
  overrides: overrides.cryptocompare,
})
