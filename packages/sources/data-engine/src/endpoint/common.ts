/**
 * Shared input parameter definitions used across all data-engine endpoints.
 */
export const commonInputParams = {
  feedId: {
    required: true,
    type: 'string',
    description: 'The feed ID to subscribe to',
  },
  resultPath: {
    required: false,
    type: 'string',
    description: 'The data field to populate the top-level result',
  },
  decimals: {
    required: false,
    type: 'number',
    description: 'Number of decimals to scale the resultPath value to (from native 18)',
  },
  maxAgeInSeconds: {
    required: false,
    type: 'number',
    description:
      'Ignore report if the streams report is older than current time by more than this value in seconds. If not provided, all reports will be processed regardless of age.',
  },
} as const
