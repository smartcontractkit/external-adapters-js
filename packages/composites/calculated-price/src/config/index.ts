import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  SOURCE_ADAPTER_URL: {
    description:
      'The URL of the ${SOURCE} adapter where ${SOURCE} is the upper-snake-case version of the elements in the operand1Sources and operand2Sources input parameters',
    type: 'string',
    required: false,
    sensitive: false,
    variablePlaceholder: 'SOURCE',
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
    sensitive: false,
  },
})
