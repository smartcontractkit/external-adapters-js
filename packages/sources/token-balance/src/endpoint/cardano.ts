import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { cardanoTransport } from '../transport/cardano'
import { getCardanoRpcUrl } from '../transport/cardano-utils'

export const inputParameters = new InputParameters(
  {
    addresses: {
      required: true,
      type: {
        address: {
          required: true,
          type: 'string',
          description: 'Address of the account to fetch the balance of',
        },
      },
      array: true,
      description: 'List of addresses to read',
    },
  },
  [
    {
      addresses: [
        {
          address: 'addr1w8z0xlftcx54tn7uxdvhk0qgj9u7hmlaccjthnc9kvu4pmcyemglm',
        },
      ],
    },
  ],
)

export type AddressWithBalance = {
  address: string
  balance: string
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: null
    Data: {
      result: AddressWithBalance[]
      decimals: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'cardano',
  transport: cardanoTransport,
  inputParameters,
  customInputValidation: (_request, settings): AdapterError | undefined => {
    getCardanoRpcUrl(settings)
    return
  },
})
