import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

import { httpTransport } from '../transport/transport'

export const inputParameters = new InputParameters(
  {
    artwork_id: {
      aliases: ['artworkId'],
      required: true,
      type: 'string',
      description: 'The ID of the artwork to fetch',
    },
  },
  [
    {
      artwork_id: 'banksy',
    },
  ],
)

export const nav = new AdapterEndpoint({
  name: 'nav',
  transport: httpTransport,
  inputParameters,
})
