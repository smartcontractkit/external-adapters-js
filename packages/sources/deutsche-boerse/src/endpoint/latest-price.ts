import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { wsTransport } from '../transport/latest-price'

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

interface LatestPriceResponse {
  Result: number | null
  Data: {
    latestPrice: number
    timestamps: {
      providerIndicatedTimeUnixMs: number
    }
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: LatestPriceResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'latest-price',
  aliases: ['price'],
  transport: wsTransport,
  inputParameters,
})
