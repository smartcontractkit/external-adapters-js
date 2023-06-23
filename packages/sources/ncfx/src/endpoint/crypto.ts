import {
  CryptoPriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { transport } from '../transport/crypto'

// Note: this adapter is intended for the API with endpoint 'wss://cryptofeed.ws.newchangefx.com'.
// There is another API with endpoint 'wss://feed.newchangefx.com/cryptodata' that has slightly
// different behavior, including a different login success message and the price messages being
// an array of price data objects for each subscribed asset.

export const inputParameters = new InputParameters(priceEndpointInputParametersDefinition)

type Response = {
  Result: number
  bid: number
  ask: number
  Data: {
    result: number
    bid: number
    mid: number
    ask: number
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: Response
  Settings: typeof config.settings
}

export const cryptoEndpoint = new CryptoPriceEndpoint({
  name: 'crypto-lwba',
  aliases: ['cryptolwba', 'crypto_lwba', 'crypto'],
  transport,
  inputParameters,
})
