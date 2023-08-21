import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { PoRTotalBalanceEndpoint } from '@chainlink/external-adapter-framework/adapter/por'
import { config } from '../config'
import { balanceTransport } from '../transport/balance'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const inputParameters = new InputParameters({
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
      },
      chainId: {
        description: 'The name of the target chain',
        required: true,
        type: 'string',
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
})

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

    const btcMainnet = addresses.some(
      (a) => `${a.network}_${a.chainId}`.toUpperCase() === 'BITCOIN_MAINNET',
    )
    const btcTestnet = addresses.some(
      (a) => `${a.network}_${a.chainId}`.toUpperCase() === 'BITCOIN_TESTNET',
    )
    const dogeMainnet = addresses.some(
      (a) => `${a.network}_${a.chainId}`.toUpperCase() === 'DOGECOIN_MAINNET',
    )
    const dogeTestnet = addresses.some(
      (a) => `${a.network}_${a.chainId}`.toUpperCase() === 'DOGECOIN_TESTNET',
    )
    const missingEnv = []

    if (btcMainnet && !settings.BITCOIN_MAINNET_POR_INDEXER_URL) {
      missingEnv.push('BITCOIN_MAINNET_POR_INDEXER_URL')
    }
    if (btcTestnet && !settings.BITCOIN_TESTNET_POR_INDEXER_URL) {
      missingEnv.push('BITCOIN_TESTNET_POR_INDEXER_URL')
    }
    if (dogeMainnet && !settings.DOGECOIN_MAINNET_POR_INDEXER_URL) {
      missingEnv.push('DOGECOIN_MAINNET_POR_INDEXER_URL')
    }
    if (dogeTestnet && !settings.DOGECOIN_TESTNET_POR_INDEXER_URL) {
      missingEnv.push('DOGECOIN_TESTNET_POR_INDEXER_URL')
    }

    if (missingEnv.length > 0) {
      const message = `'${missingEnv}' environment ${
        missingEnv.length === 1 ? 'variable is' : 'variables are'
      } required.`
      throw new AdapterInputError({
        statusCode: 400,
        message,
      })
    }

    return
  },
})
