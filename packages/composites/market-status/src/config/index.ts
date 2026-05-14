import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { ADAPTER_NAMES } from '../source/sources'

export const config = new AdapterConfig({
  PROVIDER_ADAPTER_URL: {
    description: `The URL for the \${PROVIDER} adapter. PROVIDER is: ${ADAPTER_NAMES.join(',')}`,
    type: 'string',
    required: true,
    variablePlaceholder: 'PROVIDER',
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 1_000,
    sensitive: false,
  },
})
