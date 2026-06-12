import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { solanaBalanceTransport } from '../transport/solana-balance'
import { getSolanaRpcUrl } from '../transport/solana-utils'

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
    noErrorOnRipcord: {
      type: 'boolean',
      default: false,
      description:
        'Lax ripcord handling, return 200 on ripcord when noErrorOnRipcord is true, return 502 with ripcord details if noErrorOnRipcord is false or unset',
    },
  },
  [
    {
      addresses: [
        {
          address: '7d73NFxuWQ2F248NA4XwxE95oFfbWZrc1sg4wcDJjzTq',
        },
      ],
      noErrorOnRipcord: false,
    },
  ],
)

export type AddressWithBalance = {
  address: string
  balance: string
  decimals: 9
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: null
    Data: {
      result: AddressWithBalance[]
      decimals: number
      ripcord: boolean
      ripcordDetails?: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'solana-balance',
  transport: solanaBalanceTransport,
  inputParameters,
  customInputValidation: (_request, settings): AdapterError | undefined => {
    // Make sure the RPC URL is set.
    getSolanaRpcUrl(settings)
    return
  },
})
