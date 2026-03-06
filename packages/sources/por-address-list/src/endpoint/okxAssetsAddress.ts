import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { PoRAddress, PoRTokenAddress } from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { okxAssetsAddressHttpTransport } from '../transport/okxAssetsAddress'

export const inputParameters = new InputParameters(
  {
    coin: {
      description: 'The coin to retrieve the address list for',
      type: 'string',
      required: true,
    },
    addressField: {
      description: 'The field name in the API response that contains the addresses.',
      type: 'string',
      required: true,
      options: ['lockAddresses', 'stakingBalanceDetails'],
    },
    network: {
      description: 'The network name to associate with the addresses',
      type: 'string',
      required: true,
    },
    chainId: {
      description: 'The chain ID to associate with the addresses',
      type: 'string',
      required: true,
    },
  },
  [
    {
      coin: 'xBTC',
      addressField: 'lockAddresses',
      network: 'bitcoin',
      chainId: 'mainnet',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: null
    Data: {
      result: PoRAddress[] | PoRTokenAddress[]
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'okxAssetsAddress',
  transport: okxAssetsAddressHttpTransport,
  inputParameters,
})
