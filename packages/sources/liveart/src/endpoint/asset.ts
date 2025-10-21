import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

import { httpTransport } from '../transport/asset'

export const inputParameters = new InputParameters(
  {
    asset_id: {
      aliases: ['assetId'],
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

export const asset = new AdapterEndpoint({
  name: 'asset',
  transport: httpTransport,
  inputParameters,
})
