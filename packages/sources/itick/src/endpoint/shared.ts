import { InputParameters } from '@chainlink/external-adapter-framework/validation'

export const inputParameters = new InputParameters(
  {
    // Named 'base' to allow specifying overrides as supported by the framework at
    // https://github.com/smartcontractkit/ea-framework-js/blob/111571e6626cc5ff005abb459018846be1d8e3c2/src/adapter/endpoint.ts#L134
    base: {
      aliases: ['symbol'],
      required: true,
      type: 'string',
      description: 'The symbol of the stock to query',
    },
    region: {
      required: true,
      type: 'string',
      description: 'The code of the stock exchange region (e.g. "hk", "kr", "jq")',
    },
  },
  [
    {
      base: '700',
      region: 'hk',
    },
  ],
)
