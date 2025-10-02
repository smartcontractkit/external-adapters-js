import { InputParameters } from '@chainlink/external-adapter-framework/validation'

export const inputParameters = new InputParameters(
  {
    fundId: {
      required: true,
      type: 'number',
      description: 'The fund id of the reserves to query',
    },
  },
  [
    {
      fundId: 3,
    },
  ],
)
