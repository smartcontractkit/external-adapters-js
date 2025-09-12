import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { wsTransport } from '../transport/lwba'

export const inputParameters = new InputParameters(
  {
    isin: {
      aliases: ['instrument'],
      required: true,
      type: 'string',
      description: 'The ISIN identifier of the instrument to query',
    },
  },
  [
    {
      isin: 'IE00B53L3W79',
    },
  ],
)

interface LwbaLatestPriceResponse {
  Result: number | null
  Data: {
    mid: number | null
    bid: number | null
    ask: number | null
    latestPrice: number | null
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: LwbaLatestPriceResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'lwba',
  aliases: [],
  transport: wsTransport,
  inputParameters,
})
