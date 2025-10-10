import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { gmTokenTransport } from '../transport/price'
import { tokenAddresses } from '../transport/utils'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const inputParameters = new InputParameters(
  {
    index: {
      required: true,
      type: 'string',
      description:
        'Index token.  Long and short tokens will be opened / closed based on this price feed.',
    },
    long: {
      required: true,
      type: 'string',
      description: 'Long token. This is the token that will back long positions.',
    },
    short: {
      required: true,
      type: 'string',
      description: 'Short token. This is the token that will back short positions.',
    },
    market: {
      required: true,
      type: 'string',
      description: 'Market address of the market pool.',
    },
  },
  [
    {
      index: 'LINK',
      long: 'LINK',
      short: 'USDC',
      market: '0x7f1fa204bb700853D36994DA19F830b6Ad18455C',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      result: number
      sources: Record<string, string[]>
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  transport: gmTokenTransport,
  inputParameters,
  customInputValidation: (req): AdapterInputError | undefined => {
    const { index, long, short } = req.requestContext.data
    const indexToken = tokenAddresses.arbitrum[index as keyof typeof tokenAddresses.arbitrum]
    const longToken = tokenAddresses.arbitrum[long as keyof typeof tokenAddresses.arbitrum]
    const shortToken = tokenAddresses.arbitrum[short as keyof typeof tokenAddresses.arbitrum]
    let invalidTokens = ''
    if (!indexToken) {
      invalidTokens += 'indexToken,'
    }
    if (!longToken) {
      invalidTokens += 'longToken,'
    }
    if (!shortToken) {
      invalidTokens += 'shortToken,'
    }
    if (invalidTokens.length) {
      throw new AdapterInputError({
        message: `Invalid ${invalidTokens} Must be one of ${Object.keys(tokenAddresses.arbitrum)}`,
      })
    }
    return
  },
})
