import { InputParameters } from '@chainlink/external-adapter-framework/validation'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'symbol', 'asset', 'coin', 'ticker', 'market'],
      type: 'string',
      description:
        'The symbol of the stock to query, append `:USLF24` to the end for after hours on ws endpoints',
      required: true,
    },
  },
  [
    {
      base: 'TSLA',
    },
  ],
)
