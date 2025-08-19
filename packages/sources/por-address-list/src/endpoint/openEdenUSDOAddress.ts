import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { PoRTokenAddress } from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { addressTransport } from '../transport/openEdenUSDOAddress'

export type PoRTbillAddress = Record<string, unknown> & {
  contractAddress: string
  network: string
  chainId: string
  token: string
  wallets: string[]
  priceOracleAddress: string
}

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
    type: {
      description:
        'The type of addresses you are looking for. tbill returns only TBILL tokens, other returns all others.',
      options: ['tbill', 'priced', 'other', 'pegged'],
      type: 'string',
      required: true,
    },
  },
  [
    {
      contractAddress: '0x440139321A15d14ce0729E004e91D66BaF1A08B0',
      contractAddressNetwork: 'BASE',
      type: 'tbill',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: null
    Data: {
      result: PoRTbillAddress[] | PoRTokenAddress[]
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'openedenAddress',
  transport: addressTransport,
  inputParameters,
})
