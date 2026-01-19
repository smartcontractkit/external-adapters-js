import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/market'

export const inputParameters = new InputParameters(
  {
    market_ticker: {
      required: true,
      type: 'string',
      description: 'Kalshi market identifier (e.g. KXUSIRATECUTS25MAR)',
    },
  },
  [
    {
      market_ticker: 'KXUSIRATECUTS25MAR',
    },
  ],
)

export interface MarketResponseData {
  result: number
  market_ticker: string
  event_ticker: string
  market_status: number
  settlement_flag: number
  yes_bid_price: number
  yes_ask_price: number
  no_bid_price: number
  no_ask_price: number
  yes_mid_price: number
  no_mid_price: number
  open_interest: number
  category: string
  close_timestamp: number
  updated_at: number
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: MarketResponseData
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'market',
  transport: httpTransport,
  inputParameters,
})
