import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { type AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { validateRateBounds } from '../shared/exchange-rate-utils'
import { TRANCHES, type Tranche } from '../transport/strcusx-accounts'
import { strcusxExchangeRateTransport } from '../transport/strcusx-exchange-rate'

const STRATEGY_NAMES = ['STRC-USX-1'] as const

export const inputParameters = new InputParameters(
  {
    programAddress: {
      description: 'The deployed Solstice yield strategy program address',
      type: 'string',
      required: true,
    },
    strategyName: {
      description:
        'Solstice strcUSX strategy/accounting PDA seed from the current deployment/feed config',
      type: 'string',
      options: [...STRATEGY_NAMES],
      required: true,
    },
    tranche: {
      description: 'The tranche to price: junior or senior',
      type: 'string',
      options: [...TRANCHES],
      required: true,
    },
    minRate: {
      description: 'Minimum allowed strcUSX exchange rate as an 18-decimal fixed-point integer',
      type: 'string',
      required: false,
    },
    maxRate: {
      description: 'Maximum allowed strcUSX exchange rate as an 18-decimal fixed-point integer',
      type: 'string',
      required: false,
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
      tranche: Tranche
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
  customInputValidation: (req): AdapterInputError | undefined => {
    validateRateBounds(req.requestContext.data.minRate, req.requestContext.data.maxRate)

    return
  },
})
