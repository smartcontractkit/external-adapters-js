import {
  PoRProviderEndpoint,
  PoRProviderResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/totalReserve'

export const inputParameters = new InputParameters(
  {
    accountName: {
      type: 'string',
      required: true,
      description: 'The account name to query reserves for',
    },
    noErrorOnRipcord: {
      type: 'boolean',
      required: false,
      default: false,
      description:
        'Lax ripcord handling, return 200 on ripcord when noErrorOnRipcord is true, return 502 with ripcord details if noErrorOnRipcord is false or unset',
    },
  },
  [
    {
      accountName: 'Arsx Base Testnet',
      noErrorOnRipcord: false,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRProviderResponse & {
    ripcordAsInt?: number
    totalReserve?: number
    totalToken?: number
  }
  Settings: typeof config.settings
}

export const endpoint = new PoRProviderEndpoint({
  name: 'totalReserve',
  aliases: ['reserve'],
  transport: httpTransport,
  inputParameters,
})
