import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { xrpTransport } from '../transport/xrp'
import { getXrplRpcUrl } from '../transport/xrpl-utils'

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
          address: 'rGSA6YCGzywj2hsPA8DArSsLr1DMTBi2LH',
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
  name: 'xrp',
  transport: xrpTransport,
  inputParameters,
  customInputValidation: (_request, settings): AdapterError | undefined => {
    getXrplRpcUrl(settings)
    return
  },
})
