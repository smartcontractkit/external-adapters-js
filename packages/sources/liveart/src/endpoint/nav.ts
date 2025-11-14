import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

import { httpTransport } from '../transport/nav'

export const inputParameters = new InputParameters(
  {
    asset_id: {
      required: true,
      type: 'string',
      description: 'The ID of the artwork asset to fetch',
    },
  },
  [
    {
      asset_id: 'KUSPUM',
    },
  ],
)

export const nav = new AdapterEndpoint({
  name: 'nav',
  transport: httpTransport,
  inputParameters,
})
