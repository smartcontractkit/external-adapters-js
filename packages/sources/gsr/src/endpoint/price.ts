import {
  CryptoPriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/price'

const inputParameters = new InputParameters(priceEndpointInputParametersDefinition)

type EndpointResponse = SingleNumberResultResponse & {
  Data: {
    mid: number
    ask: number
    bid: number
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: EndpointResponse
}

export const endpoint = new CryptoPriceEndpoint({
  name: 'price',
  aliases: ['price-ws', 'crypto', 'crypto-lwba', 'cryptolwba', 'crypto_lwba'],
  transport,
  inputParameters,
})
