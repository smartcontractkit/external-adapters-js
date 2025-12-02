import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { stellarTransport } from '../transport/stellar'

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
  name: 'stellar',
  transport: stellarTransport,
  inputParameters,
  customInputValidation: (_request, settings): AdapterError | undefined => {
    if (!settings.STELLAR_RPC_URL) {
      throw new AdapterInputError({
        statusCode: 400,
        message: 'Environment variable STELLAR_RPC_URL is missing',
      })
    }
    return
  },
})
