import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { strcusxExchangeRateTransport } from '../transport/strcusx-exchange-rate'

export const inputParameters = new InputParameters(
  {
    programAddress: {
      description: 'The deployed Solstice yield strategy program address',
      type: 'string',
      required: true,
    },
    strategyName: {
      description: 'The strategy name used as the strategy and accounting PDA seed',
      type: 'string',
      required: true,
    },
    tranche: {
      description: 'The tranche to price: junior or senior',
      type: 'string',
      options: ['junior', 'senior'],
      required: true,
    },
    minRate: {
      description: 'Minimum allowed strcUSX exchange rate as an 18-decimal fixed-point integer',
      type: 'string',
      required: true,
    },
    maxRate: {
      description: 'Maximum allowed strcUSX exchange rate as an 18-decimal fixed-point integer',
      type: 'string',
      required: true,
    },
  },
  [
    {
      programAddress: '7iNvMc3x5VvwNmYomAAg86CpWeEw7QfDF2z5GgtDzHXe',
      strategyName: 'STRC-USX-1',
      tranche: 'junior',
      minRate: '950000000000000000',
      maxRate: '1050000000000000000',
    },
    {
      programAddress: '7iNvMc3x5VvwNmYomAAg86CpWeEw7QfDF2z5GgtDzHXe',
      strategyName: 'STRC-USX-1',
      tranche: 'senior',
      minRate: '950000000000000000',
      maxRate: '1050000000000000000',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      computedResult: string
      tranche: string
      decimals: number
      boundsApplied: boolean
      trancheAssets: string
      trancheShares: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'strcusx-exchange-rate',
  aliases: [],
  transport: strcusxExchangeRateTransport,
  inputParameters,
})
