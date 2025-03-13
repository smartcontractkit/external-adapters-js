import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { erc20TokenBalanceTransport } from '../transport/evm'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const inputParameters = new InputParameters(
  {
    addresses: {
      required: true,
      type: {
        network: {
          aliases: ['chain'],
          required: false,
          type: 'string',
          description: 'Network of the contract',
        },
        chainId: {
          required: false,
          type: 'string',
          description: 'Chain ID of the network',
        },
        contractAddress: {
          required: true,
          type: 'string',
          description: 'Address of token contract',
        },
        wallets: {
          required: true,
          type: 'string',
          array: true,
          description: 'Array of wallets to sum balances',
        },
        balanceOfSignature: {
          required: false,
          type: 'string',
          default: 'function balanceOf(address account) external view returns (uint256)',
          description:
            'Function signature. Should be formatted as [human readable ABI](https://docs.ethers.io/v5/single-page/#/v5/getting-started/-%23-getting-started--contracts)',
        },
        decimalsSignature: {
          required: false,
          type: 'string',
          default: 'function decimals() external pure returns (uint8)',
          description:
            'Function signature. Should be formatted as [human readable ABI](https://docs.ethers.io/v5/single-page/#/v5/getting-started/-%23-getting-started--contracts)',
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
          network: 'ethereum',
          chainId: '1',
          contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca',
          wallets: [
            '0xBc10f2E862ED4502144c7d632a3459F49DFCDB5e',
            '0xF977814e90dA44bFA03b6295A0616a897441aceC',
          ],
          balanceOfSignature: 'function balanceOf(address account) external view returns (uint256)',
          decimalsSignature: 'function decimals() external pure returns (uint8)',
        },
      ],
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      decimals: number
      wallets: {
        network: string
        contractAddress: string
        walletAddress: string
        balance: string
        decimals: number
      }[]
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'evm',
  aliases: ['erc20'],
  transport: erc20TokenBalanceTransport,
  inputParameters,
  customInputValidation: (
    req: AdapterRequest<typeof inputParameters.validated>,
  ): AdapterInputError | undefined => {
    const { addresses } = req.requestContext.data

    // ensure each address has either chainId or network specified
    for (const address of addresses) {
      if (!address.chainId && !address.network) {
        throw new AdapterInputError({
          statusCode: 400,
          message: "One or more addresses is missing one of ['chainId', 'network'].",
        })
      }
    }
    return
  },
})
