import {
  CryptoPriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/price'

const inputParameters = new InputParameters(priceEndpointInputParametersDefinition)

// Additional fields are due to lwba endpoint
type EPResponse = SingleNumberResultResponse & {
  Data: {
    mid: number
    bid: number
    ask: number
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: EPResponse
}

export const endpoint = new CryptoPriceEndpoint({
  name: 'price',
  aliases: ['price-ws', 'crypto', 'crypto-lwba', 'cryptolwba', 'crypto_lwba'],
  transport,
  inputParameters,
})
