import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { transport } from '../transport/crypto-yield'
export interface ProviderResponseBody {
  date: string
  yieldPoolID: number
  yieldPoolName: string
  epoch: number
  startSlot: number
  endSlot: number
  validatorReward: number
  transactionReward: number
  validatorSubtractions: number
  deposits: number
  totalReward: number
  divisor: number
  apr30Day: number
  apr90Day: number
}

interface CryptoYieldResponse {
  Result: number | null
  Data: ProviderResponseBody
}

const inputParameters = new InputParameters(
  {
    aprTerm: {
      type: 'string',
      required: true,
      description: 'Yield apr term',
      options: ['30Day', '90Day'],
    },
  },
  [
    {
      aprTerm: '30Day',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: CryptoYieldResponse
}

export const endpoint = new AdapterEndpoint({
  name: 'cryptoyield',
  aliases: ['yield'],
  transport,
  inputParameters,
  overrides: overrides.tiingo,
})
