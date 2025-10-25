import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { transport } from '../transport/computedPrice'

export const inputParameters = new InputParameters(
  {
    operand1Sources: {
      required: true,
      type: 'string',
      array: true,
      description:
        'An array (string[]) or comma delimited list (string) of source adapters to query for the operand1 value',
    },
    operand1MinAnswers: {
      required: false,
      type: 'number',
      description: 'The minimum number of answers needed to return a value for the operand1',
      default: 1,
    },
    operand1Input: {
      required: true,
      type: 'string',
      description: 'The payload to send to the operand1 sources',
    },
    operand2Sources: {
      required: true,
      type: 'string',
      array: true,
      description:
        'An array (string[]) or comma delimited list (string) of source adapters to query for the operand2 value',
    },
    operand2MinAnswers: {
      required: false,
      type: 'number',
      description: 'The minimum number of answers needed to return a value for the operand2',
      default: 1,
    },
    operand2Input: {
      required: true,
      type: 'string',
      description: 'The payload to send to the operand2 sources',
    },
    operation: {
      required: true,
      type: 'string',
      description: 'The operation to perform on the operands',
      options: ['divide', 'multiply'],
    },
  },
  [
    // Example using operand1/operand2 format - division
    {
      operand1Sources: ['coingecko'],
      operand1MinAnswers: 1,
      operand1Input: JSON.stringify({
        from: 'LINK',
        to: 'USD',
        overrides: {
          coingecko: {
            LINK: 'chainlink',
          },
        },
      }),
      operand2Sources: ['coingecko'],
      operand2MinAnswers: 1,
      operand2Input: JSON.stringify({
        from: 'ETH',
        to: 'USD',
        overrides: {
          coingecko: {
            ETH: 'ethereum',
          },
        },
      }),
      operation: 'divide',
    } as any,
    // Example using operand1/operand2 format - multiplication
    {
      operand1Sources: ['coinbase', 'coingecko'],
      operand1MinAnswers: 1,
      operand1Input: JSON.stringify({
        base: 'ETH',
        quote: 'USD',
        overrides: {
          coingecko: {
            ETH: 'ethereum',
          },
        },
      }),
      operand2Sources: ['coinbase', 'coingecko'],
      operand2MinAnswers: 1,
      operand2Input: JSON.stringify({
        base: 'BTC',
        quote: 'USD',
        overrides: {
          coingecko: {
            BTC: 'bitcoin',
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
  name: 'computedPrice',
  aliases: ['computed'],
  transport,
  inputParameters,
})
