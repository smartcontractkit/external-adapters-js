import { InputParameters } from '@chainlink/external-adapter-framework/validation'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'symbol', 'asset', 'coin', 'ticker', 'market'],
      type: 'string',
      description: 'The symbol of the currency to query',
      required: true,
    },
  },
  [
    {
      base: 'TSLA',
    },
  ],
)
