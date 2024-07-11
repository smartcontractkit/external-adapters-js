import {
  CryptoPriceEndpoint,
  LwbaResponseDataFields,
  DEFAULT_LWBA_ALIASES,
  priceEndpointInputParametersDefinition,
  validateLwbaResponse,
} from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { transport } from '../transport/crypto'
import {
  AdapterRequest,
  SingleNumberResultResponse,
} from '@chainlink/external-adapter-framework/util'
import {
  AdapterError,
  AdapterInputError,
  AdapterLWBAError,
} from '@chainlink/external-adapter-framework/validation/error'

// Note: this adapter is intended for the API with endpoint 'wss://cryptofeed.ws.newchangefx.com'.
// There is another API with endpoint 'wss://feed.newchangefx.com/cryptodata' that has slightly
// different behavior, including a different login success message and the price messages being
// an array of price data objects for each subscribed asset.

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'ETH',
    quote: 'USD',
  },
])

type OmitResultFromLwba = Omit<LwbaResponseDataFields, 'Result'>

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: OmitResultFromLwba & SingleNumberResultResponse
  Settings: typeof config.settings
}

export function customInputValidation(
  _: AdapterRequest<typeof inputParameters.validated>,
  settings: typeof config.settings,
): AdapterError | undefined {
  if (!settings.API_PASSWORD || !settings.API_USERNAME) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'API_PASSWORD and/or API_USERNAME is not set',
    })
  }
  return
}

export const cryptoEndpoint = new CryptoPriceEndpoint({
  name: 'crypto',
  aliases: DEFAULT_LWBA_ALIASES,
  transport,
  customInputValidation,
  customOutputValidation: (output) => {
    const data = output.data as LwbaResponseDataFields['Data']
    const error = validateLwbaResponse(data.bid, data.mid, data.ask)

    if (error) {
      throw new AdapterLWBAError({ statusCode: 500, message: error })
    }

    return undefined
  },
  inputParameters,
  requestTransforms: [
    (req) => {
      req.requestContext.data.base = req.requestContext.data.base.toUpperCase()
      req.requestContext.data.quote = req.requestContext.data.quote.toUpperCase()
    },
  ],
})
