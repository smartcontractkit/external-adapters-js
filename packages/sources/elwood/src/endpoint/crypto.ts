import {
  CryptoPriceEndpoint,
  DEFAULT_LWBA_ALIASES,
  LwbaResponseDataFields,
  priceEndpointInputParametersDefinition,
  validateLwbaResponse,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/crypto'
import { AdapterLWBAError } from '@chainlink/external-adapter-framework/validation/error'

const inputParameters = new InputParameters(priceEndpointInputParametersDefinition, [
  {
    base: 'ETH',
    quote: 'USD',
  },
])

type OmitResultFromLwba = Omit<LwbaResponseDataFields, 'Result'>

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: OmitResultFromLwba & SingleNumberResultResponse
}

export const cryptoEndpoint = new CryptoPriceEndpoint({
  name: 'price',
  aliases: ['crypto', ...DEFAULT_LWBA_ALIASES],
  inputParameters,
  transport,
  customOutputValidation: (output) => {
    const data = output.data as LwbaResponseDataFields['Data']
    const error = validateLwbaResponse(data.bid, data.mid, data.ask)

    if (error) {
      throw new AdapterLWBAError({ statusCode: 500, message: error })
    }

    return undefined
  },
})
