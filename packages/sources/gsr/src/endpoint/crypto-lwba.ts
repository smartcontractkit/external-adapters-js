import {
  AdapterEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import { transport } from '../transport/crypto-lwba'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition)

// Additional fields are due to lwba endpoint
type EndpointResponse = {
  Result: null
  Data: {
    mid: number
    bid: number
    ask: number
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: EndpointResponse
}

export const endpoint = new AdapterEndpoint({
  name: 'crypto-lwba',
  aliases: ['cryptolwba', 'crypto_lwba'],
  transport,
  inputParameters: inputParameters,
})
