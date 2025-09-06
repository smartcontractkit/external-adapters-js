import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { solsticeTransport } from '../transport/solstice'

export const inputParameters = new InputParameters(
  {
    portfolioId: {
      required: true,
      type: 'string',
      description: 'portfolioId for Solstice on Copper',
    },
    currencies: {
      required: true,
      array: true,
      type: 'string',
      description: 'currencies for Solstice on Copper',
    },
  },
  [
    {
      portfolioId: '1134710216',
      currencies: ['BTC', 'ETH', 'SOL', 'LTC', 'NEAR', 'USDC', 'USDT'],
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      decimals: number
      exchangeBalances: string[]
      rate: {
        value: string
        decimal: number
      }
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'solstice',
  transport: solsticeTransport,
  inputParameters,
})
