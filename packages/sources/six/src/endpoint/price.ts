import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter/endpoint'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { generateTransport } from '../transport/price'

const inputParameters = new InputParameters(
  {
    ticker: {
      aliases: ['base', 'symbol', 'asset'],
      required: true,
      type: 'string',
      description: 'Instrument ticker (e.g. ABBN, ALC, ANA, ANE)',
    },
    bc: {
      aliases: ['market', 'bourseCode', 'exchange'],
      required: true,
      type: 'string',
      description: 'SIX Bourse Code (e.g. 4 for SIX Swiss Exchange, 1058 for BME)',
    },
  },
  [
    {
      ticker: 'ABBN',
      bc: '4',
    },
  ],
)

interface PriceResponse {
  Result: number | null
  Data: {
    mid?: number
    bid?: number
    bidSize?: number
    ask?: number
    askSize?: number
    lastTradedPrice?: number
    volume?: number
    marketStatus: number
    ripcord: boolean
    ripcordAsInt: number
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PriceResponse
  Settings: typeof config.settings
}

const transport = generateTransport()

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: ['equity', 'stock'],
  transport,
  inputParameters,
})
