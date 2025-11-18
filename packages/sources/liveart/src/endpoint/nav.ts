import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

import { httpTransport } from '../transport/nav'

export const inputParameters = new InputParameters(
  {
    assetId: {
      required: true,
      type: 'string',
      description: 'The ID of the artwork asset to fetch',
    },
  },
  [
    {
      assetId: 'KUSPUM',
    },
  ],
)

export const endpoint = new AdapterEndpoint({
  name: 'nav',
  transport: httpTransport,
  inputParameters,
})
