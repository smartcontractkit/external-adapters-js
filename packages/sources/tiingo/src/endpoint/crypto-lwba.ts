import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { inputParameters } from './utils'
import { transport } from '../transport/crypto-lwba'
interface EPResponse {
  Result: null
  Data: {
    ticker: string
    datetime: string
    mid: number
    bid: number
    bidSize: number
    ask: number
    askSize: number
    weightedSpreadPcnt: number
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: EPResponse
}

export const endpoint = new AdapterEndpoint({
  name: 'crypto-lwba',
  aliases: ['cryptolwba', 'crypto_lwba'],
  transport,
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
})
