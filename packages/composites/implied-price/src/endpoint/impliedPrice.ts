import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/impliedPrice'

export const inputParameters = new InputParameters(
  {
    dividendSources: {
      required: true,
      type: 'string',
      array: true,
      description:
        'An array (string[]) or comma delimited list (string) of source adapters to query for the dividend value',
    },
    dividendMinAnswers: {
      required: false,
      type: 'number',
      description: 'The minimum number of answers needed to return a value for the dividend',
      default: 1,
    },
    dividendInput: {
      required: true,
      type: 'string',
      description: 'The payload to send to the dividend sources',
    },
    divisorSources: {
      required: true,
      type: 'string',
      array: true,
      description:
        'An array (string[]) or comma delimited list (string) of source adapters to query for the divisor value',
    },
    divisorMinAnswers: {
      required: false,
      type: 'number',
      description: 'The minimum number of answers needed to return a value for the divisor',
      default: 1,
    },
    divisorInput: {
      required: true,
      type: 'string',
      description: 'The payload to send to the divisor sources',
    },
    operation: {
      required: false,
      type: 'string',
      description: 'The operation to perform on the operands',
      options: ['divide', 'multiply'],
      default: 'divide',
    },
  },
  [
    // Example using dividend/divisor format - implied price (operation defaults to divide)
    {
      dividendSources: ['coingecko'],
      dividendMinAnswers: 1,
      dividendInput: JSON.stringify({
        from: 'LINK',
        to: 'USD',
        overrides: {
          coingecko: {
            LINK: 'chainlink',
          },
        },
      }),
      divisorSources: ['coingecko'],
      divisorMinAnswers: 1,
      divisorInput: JSON.stringify({
        from: 'ETH',
        to: 'USD',
        overrides: {
          coingecko: {
            ETH: 'ethereum',
          },
        },
      }),
      // operation defaults to 'divide' for backward compatibility
    } as any,
    // Example using dividend/divisor format - explicit division
    {
      dividendSources: ['coinbase', 'coingecko'],
      dividendMinAnswers: 1,
      dividendInput: JSON.stringify({
        base: 'ETH',
        quote: 'USD',
        overrides: {
          coingecko: {
            ETH: 'ethereum',
          },
        },
      }),
      divisorSources: ['coinbase', 'coingecko'],
      divisorMinAnswers: 1,
      divisorInput: JSON.stringify({
        base: 'BTC',
        quote: 'USD',
        overrides: {
          coingecko: {
            BTC: 'bitcoin',
          },
        },
      }),
      operation: 'divide',
    } as any,
    // Example using dividend/divisor format - multiplication
    {
      dividendSources: ['coingecko'],
      dividendMinAnswers: 1,
      dividendInput: JSON.stringify({
        from: 'LINK',
        to: 'USD',
        overrides: {
          coingecko: {
            LINK: 'chainlink',
          },
        },
      }),
      divisorSources: ['coingecko'],
      divisorMinAnswers: 1,
      divisorInput: JSON.stringify({
        from: 'ETH',
        to: 'USD',
        overrides: {
          coingecko: {
            ETH: 'ethereum',
          },
        },
      }),
      operation: 'multiply',
    } as any,
  ] as any,
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'impliedPrice',
  aliases: ['implied'],
  transport,
  inputParameters,
})
