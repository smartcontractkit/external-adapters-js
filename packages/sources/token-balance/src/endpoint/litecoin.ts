import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { litecoinTransport } from '../transport/litecoin'
import { getLitecoinRpcUrl } from '../transport/litecoin-utils'

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
          address: 'LQmJHaWCWGeL4WLhuRg5c3PrD1pb6nW3hm',
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
  name: 'litecoin',
  transport: litecoinTransport,
  inputParameters,
  customInputValidation: (_request, settings): AdapterError | undefined => {
    getLitecoinRpcUrl(settings)
    return
  },
})
