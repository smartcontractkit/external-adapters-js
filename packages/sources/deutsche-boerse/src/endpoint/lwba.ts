import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter/endpoint'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { lwbaProtobufWsTransport } from '../transport/lwba'

export const MARKETS = ['md-xetraetfetp', 'md-tradegate'] as const
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

export interface LwbaLatestPriceResponse {
  Result: number | null
  Data: {
    latestPrice: number
    quoteProviderIndicatedTimeUnixMs: number
    tradeProviderIndicatedTimeUnixMs: number
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
