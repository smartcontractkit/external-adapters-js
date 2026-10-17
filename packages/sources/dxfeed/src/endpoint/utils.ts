import { InputParameters } from '@chainlink/external-adapter-framework/validation'

// Preserved shared input-parameter declaration (override layers kept
// untouched) — adapter code outside the template subset, covered by the
// declared dxlink-control-protocol exception set.
// TEMPLATE-EXTENSION: dxlink-control-protocol
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
// END TEMPLATE-EXTENSION
