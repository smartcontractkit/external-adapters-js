import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter/endpoint'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { lwbaProtobufWsTransport } from '../transport/lwba'

export const MARKET_XETRA_ETFETP = 'md-xetraetfetp' as const
export const MARKET_TRADEGATE = 'md-tradegate' as const
export const MARKET_EUREX_MICRO = 'md-microproducts' as const
export const MARKET_360T_SPOT = 'md-360t.spot' as const
export const MARKETS = [
  MARKET_XETRA_ETFETP,
  MARKET_TRADEGATE,
  MARKET_EUREX_MICRO,
  MARKET_360T_SPOT,
] as const
export type Market = (typeof MARKETS)[number]

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

interface LwbaResponse {
  Result: number | null
  Data: {
    mid: number
    bid: number
    ask: number
    bidSize: number
    askSize: number
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: LwbaResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'lwba',
  aliases: [],
  transport: lwbaProtobufWsTransport,
  inputParameters,
})
