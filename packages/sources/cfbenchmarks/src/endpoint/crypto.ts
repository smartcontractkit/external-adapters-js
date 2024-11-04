import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation/input-params'
import { config } from '../config'
import { customInputValidation } from './utils'
import { makeRestTransport } from '../transport/crypto-http'
import { makeWsTransport } from '../transport/crypto-ws'
import { requestTransform } from './utils'

export type Params = { index?: string; base?: string; quote?: string }
export type RequestParams = { Params: Params }

export const inputParameters = new InputParameters(
  {
    index: {
      description: 'The ID of the index. Takes priority over base/quote when provided.',
      type: 'string',
      required: false,
    },
    base: {
      aliases: ['from', 'coin'],
      type: 'string',
      description: 'The symbol of symbols of the currency to query',
      required: false,
    },
    quote: {
      aliases: ['to', 'market'],
      type: 'string',
      description: 'The symbol of the currency to convert to',
      required: false,
    },
    adapterNameOverride: {
      type: 'string',
      description: 'Used internally for override and metrics, do not set this field',
      required: false,
    },
  },
  [
    {
      base: 'LINK',
      quote: 'USD',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const requestTransforms = [requestTransform('crypto')]

export const endpoint = new CryptoPriceEndpoint({
  name: 'crypto',
  aliases: ['values', 'price'], // Legacy aliases
  inputParameters,
  requestTransforms,
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('rest', makeRestTransport('primary'))
    .register('restsecondary', makeRestTransport('secondary'))
    .register('ws', makeWsTransport('primary'))
    .register('wssecondary', makeWsTransport('secondary')),
  defaultTransport: 'ws',
  customRouter: (req, adapterConfig) => {
    if (adapterConfig.API_SECONDARY) {
      if (req.requestContext.transportName === 'rest') return 'restsecondary'
      return 'wssecondary'
    } else {
      return req.requestContext.transportName
    }
  },
  customInputValidation,
})
