import { PoRTotalBalanceEndpoint } from '@chainlink/external-adapter-framework/adapter/por'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { balanceEnvVarForAddress, config } from '../config'
import { balanceTransport } from '../transport/balance'

export const inputParameters = new InputParameters(
  {
    addresses: {
      aliases: ['result'],
      array: true,
      type: {
        address: {
          type: 'string',
          description: 'an address to get the balance of',
          required: true,
        },
        network: {
          description: 'The name of the target network protocol',
          required: true,
          type: 'string',
          options: ['bitcoin', 'dogecoin'],
        },
        chainId: {
          description: 'The name of the target chain',
          required: true,
          type: 'string',
          options: ['mainnet', 'testnet'],
        },
      },
      description:
        'An array of addresses to get the balances of (as an object with string `address` as an attribute)',
      required: true,
    },
    minConfirmations: {
      type: 'number',
      default: 0,
      description:
        'Number of blocks that must have been confirmed after the point against which the balance is checked.',
    },
  },
  [
    {
      addresses: [
        {
          address: 'bc1qlh50jpjrrlcuy6sslrucksjg22h6e0d65ken6sc54exfkrln932snwg523',
          chainId: 'mainnet',
          network: 'bitcoin',
        },
      ],
      minConfirmations: 0,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new PoRTotalBalanceEndpoint({
  name: 'balance',
  aliases: ['index'],
  transport: balanceTransport,
  inputParameters,
  customInputValidation: (
    req: AdapterRequest<typeof inputParameters.validated>,
    settings: typeof config.settings,
  ): AdapterInputError | undefined => {
    const addresses = req.requestContext.data.addresses
    if (addresses.length === 0) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Input, at 'addresses' or 'result' path, must be a non-empty array.`,
      })
    }

    const checkedNetworkIds = new Set<string>()

    for (const address of addresses) {
      const networkId = `${address.network}_${address.chainId}`.toUpperCase()
      if (checkedNetworkIds.has(networkId)) {
        continue
      }
      checkedNetworkIds.add(networkId)

      const env = balanceEnvVarForAddress(
        address.network,
        address.chainId,
        settings.BITCOIN_MAINNET_USE_STREAMS_INDEXER,
      )
      if (!settings[env as keyof typeof settings]) {
        throw new AdapterInputError({
          statusCode: 400,
          message: `'${env}' environment variable is required.`,
        })
      }
    }

    return
  },
})
