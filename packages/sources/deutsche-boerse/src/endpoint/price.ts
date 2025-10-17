import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import { priceProtobufWsTransport } from '../transport/price'
import { inputParameters } from './lwba'

export interface priceResponse {
  Result: number | null
  Data: {
    latestPrice: number
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: priceResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: [],
  transport: priceProtobufWsTransport,
  inputParameters,
})
