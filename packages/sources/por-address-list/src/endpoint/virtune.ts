import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { PoRAddress } from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { virtuneTransport } from '../transport/virtune'

export const sharedVirtuneInputParameters = {
  accountId: {
    description: 'The account ID to fetch addresses for',
    type: 'string',
    required: true,
  },
  network: {
    description: 'The network the addresses are on. This is only used to include in the response.',
    type: 'string',
    required: true,
  },
  chainId: {
    description:
      'The chainId of the network the addresses are on. This is only used to include in the response.',
    type: 'string',
    required: true,
  },
  addressPattern: {
    description: 'Return only addresses matching the given regular expression pattern.',
    type: 'string',
    required: false,
  },
} as const

export const inputParameters = new InputParameters(
  {
    ...sharedVirtuneInputParameters,
  },
  [
    {
      accountId: 'VIRBTC',
      network: 'bitcoin',
      chainId: 'mainnet',
      addressPattern: '^(?!P-)', // Only addresses that don't start with 'P-'.
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

// This endpoint is similar to the virtune-token endpoint but returns a
// response in a format that proof-of-reserves can pass on to por-indexer or
// ethereum-cl-indexer.
export const endpoint = new AdapterEndpoint({
  name: 'virtune',
  transport: virtuneTransport,
  inputParameters,
})
