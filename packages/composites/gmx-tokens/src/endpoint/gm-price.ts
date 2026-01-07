import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { gmTokenTransport } from '../transport/gm-price'
import { CHAIN_OPTIONS, ChainKey } from '../transport/shared/chain'

export type { ChainKey }

export const gmPriceInputParameters = new InputParameters(
  {
    index: {
      required: true,
      type: 'string',
      description:
        'Index token. Long and short tokens will be opened / closed based on this price feed.',
    },
    long: {
      required: true,
      type: 'string',
      description: 'Long token. This is the token that will back long positions.',
    },
    short: {
      required: true,
      type: 'string',
      description: 'Short token. This is the token that will back short positions.',
    },
    market: {
      required: true,
      type: 'string',
      description: 'Market address of the market pool.',
    },
    chain: {
      description: 'Target chain for GM market',
      type: 'string',
      options: [...CHAIN_OPTIONS],
      default: 'arbitrum',
    },
  },
  [
    {
      index: 'LINK',
      long: 'LINK',
      short: 'USDC',
      market: '0x7f1fa204bb700853D36994DA19F830b6Ad18455C',
      chain: 'arbitrum',
    },
  ],
)

export type GmPriceEndpointTypes = {
  Parameters: typeof gmPriceInputParameters.definition
  Response: SingleNumberResultResponse & {
    Data: {
      result: number
      sources: Record<string, string[]>
    }
  }
  Settings: typeof config.settings
}

export const gmPriceEndpoint = new AdapterEndpoint({
  name: 'gm-price',
  transport: gmTokenTransport,
  inputParameters: gmPriceInputParameters,
})
