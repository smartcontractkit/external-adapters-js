import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
  LOOKBACK_DAYS: {
    description: 'The number of days to look back when querying for the most recent file by date',
    type: 'number',
    default: 10,
  },
})
