import {
  PoRTokenAddressEndpoint,
  PoRTokenAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { addressTransport } from '../transport/multichainAddress'

export const inputParameters = new InputParameters(
  {
    contractAddress: {
      description: 'The contract address holding the custodial addresses',
      type: 'string',
      required: true,
    },
    contractAddressNetwork: {
      description:
        'The network of the contract, used to match {NETWORK}_RPC_URL and {NETWORK}_RPC_CHAIN_ID in env var',
      type: 'string',
      required: true,
    },
    confirmations: {
      description: 'The number of confirmations to query data from',
      type: 'number',
      default: 0,
    },
    batchSize: {
      description: 'The number of addresses to fetch from the contract at a time',
      type: 'number',
      default: 10,
    },
  },
  [
    {
      contractAddress: '0xb7C0817Dd23DE89E4204502dd2C2EF7F57d3A3B8',
      contractAddressNetwork: 'BINANCE',
      confirmations: 0,
      batchSize: 10,
    },
  ],
)

type ResponseSchema = PoRTokenAddressResponse

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: ResponseSchema
  Settings: typeof config.settings
}

export const endpoint = new PoRTokenAddressEndpoint({
  name: 'multichainAddress',
  transport: addressTransport,
  inputParameters,
})
