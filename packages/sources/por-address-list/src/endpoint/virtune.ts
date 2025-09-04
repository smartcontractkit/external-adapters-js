import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { PoRAddress } from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { virtuneTransport } from '../transport/virtune'

export const inputParameters = new InputParameters(
  {
    accountId: {
      description: 'The account ID to fetch addresses for',
      type: 'string',
      required: true,
    },
    network: {
      description:
        'The network the addresses are on. This is only used to include in the response.',
      type: 'string',
      required: true,
    },
    chainId: {
      description:
        'The chainId of the network the addresses are on. This is only used to include in the response.',
      type: 'string',
      required: true,
    },
  },
  [
    {
      accountId: 'VIRBTC',
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
      result: PoRAddress[]
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'virtune',
  transport: virtuneTransport,
  inputParameters,
})
