import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

export const inputParameters = new InputParameters(
  {
    ...stockEndpointInputParametersDefinition,
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
