import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { httpTransport } from '../transport/crypto-http'
import { wsTransport } from '../transport/crypto-ws'
import overrides from '../config/overrides.json'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { BaseCryptoEndpointTypes, inputParameters } from './utils'
import { AdapterRequestData } from '@chainlink/external-adapter-framework/util'

export const endpoint = new CryptoPriceEndpoint({
  name: 'crypto',
  aliases: ['price', 'prices', 'crypto-synth'],
  transportRoutes: new TransportRoutes<BaseCryptoEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  customRouter: (req) => {
    const rawRequestBody = req.body as unknown as { data: AdapterRequestData }
    if (rawRequestBody.data?.tiingo_transport) {
      return rawRequestBody.data?.tiingo_transport as string
    } else if (rawRequestBody.data?.transport) {
      return rawRequestBody.data?.transport
    }
    return 'ws'
  },
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
