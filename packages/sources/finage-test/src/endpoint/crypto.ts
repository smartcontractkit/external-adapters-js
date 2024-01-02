import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/crypto-http'
import { CryptoBaseEndpointTypes, cryptoPriceInputParameters } from './utils'
import { wsTransport } from '../transport/crypto-ws'

// List of base to quote arrays that should be routed to REST only
const assets: Record<string, string[]> = {
  AUTO: ['USD'],
  BUSD: ['USD'],
  EOS: ['BNB'],
  MIM: ['USD'],
  RAI: ['USD'],
  USDP: ['USD'],
  WSTETH: ['ETH'],
  YFI: ['ETH'],
}

export const endpoint = new CryptoPriceEndpoint({
  name: 'crypto',
  transportRoutes: new TransportRoutes<CryptoBaseEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'rest',
  customRouter: (req, adapterConfig) => {
    const { base, quote } = req.requestContext
      .data as typeof cryptoPriceInputParameters.validated & {
      transport?: string
    }
    // Always route the listed assets to rest since Finage does not provide adequate
    // updates for them over websocket
    if (assets[base.toUpperCase()] && assets[base.toUpperCase()].includes(quote.toUpperCase())) {
      return 'rest'
    } else {
      return adapterConfig.WS_ENABLED ? 'ws' : 'rest'
    }
  },
  inputParameters: cryptoPriceInputParameters,
  overrides: overrides.finage,
})
