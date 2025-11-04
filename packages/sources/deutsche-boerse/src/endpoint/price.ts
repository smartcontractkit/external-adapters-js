import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { priceProtobufWsTransport } from '../transport/price'
import { MARKET_EUREX_MICRO, MARKET_TRADEGATE, MARKET_XETRA_ETFETP } from './lwba'

export const MARKETS = [MARKET_XETRA_ETFETP, MARKET_TRADEGATE, MARKET_EUREX_MICRO] as const

export const inputParameters = new InputParameters(
  {
    isin: {
      aliases: ['instrument', 'ISIN'],
      required: true,
      type: 'string',
      description: 'The ISIN identifier of the instrument to query',
    },
    market: {
      aliases: ['stream'],
      required: true,
      type: 'string',
      description: 'The market identifier of the stream to query',
      options: [...MARKETS],
    },
  },
  [
    {
      market: 'md-xetraetfetp',
      isin: 'IE00B53L3W79',
    },
  ],
)

export interface PriceResponse {
  Result: number | null
  Data: {
    latestPrice: number
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PriceResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: [],
  transport: priceProtobufWsTransport,
  inputParameters,
})
