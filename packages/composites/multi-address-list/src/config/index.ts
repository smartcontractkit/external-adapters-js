import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { validator } from '@chainlink/external-adapter-framework/validation/utils'

export const config = new AdapterConfig({
  ANCHORAGE_ADAPTER_URL: {
    description: 'URL of Anchorage EA',
    type: 'string',
    default: '',
  },
  BITGO_ADAPTER_URL: {
    description: 'URL of Bitgo EA',
    type: 'string',
    default: '',
  },
  COINBASE_PRIME_ADAPTER_URL: {
    description: 'URL of Coinbase Prime EA',
    type: 'string',
    default: '',
  },
  SCHEDULER_HOUR: {
    description: 'Hour to run scheduler [0-23]',
    type: 'number',
    default: 17,
    validate: validator.integer({ min: 0, max: 23 }),
  },
  SCHEDULER_MINUTES: {
    description: 'Minute to run scheduler [0-59]',
    type: 'number',
    default: 1,
    validate: validator.integer({ min: 0, max: 59 }),
  },
  SCHEDULER_TIMEZONE: {
    description: 'Timezone to run scheduler',
    type: 'string',
    default: 'America/New_York',
  },
  RETRY_INTERVAL_MS: {
    description:
      'The amount of time (in ms) to wait before re-execution if previous execution fails.',
    type: 'number',
    default: 60000,
  },
  MAX_RETRIES: {
    description: 'The number of times to retry when execution fails.',
    type: 'number',
    default: 10,
    validate: validator.integer({ min: 1, max: 50 }),
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request.',
    type: 'number',
    default: 10000,
  },
})
