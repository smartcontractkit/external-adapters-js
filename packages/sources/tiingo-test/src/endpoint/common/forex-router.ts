import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../../config'
import overrides from '../../config/overrides.json'
import { RouterPriceEndpointParams } from '../../crypto-utils'
import { httpTransport } from '../http/forex'
import { wsTransport } from '../ws/forex'

const inputParameters = {
  base: {
    aliases: ['from', 'market', 'asset'],
    required: true,
    type: 'string',
    description: 'The asset to query',
  },
  quote: {
    aliases: ['to'],
    required: true,
    type: 'string',
    description: 'The quote to convert to',
  },
} satisfies InputParameters

export type ForexEndpointTypes = {
  Request: {
    Params: RouterPriceEndpointParams
  }
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'forex',
  aliases: ['fx', 'commodities'],
  transportRoutes: new TransportRoutes<ForexEndpointTypes>()
    .register('ws', wsTransport)
    .register('rest', httpTransport),
  defaultTransport: 'ws',
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
