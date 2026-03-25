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
  returnAs: {
    required: false,
    type: 'string',
    description:
      'Output format: "truncated" (integer, default) or "float". Can be used when `decimals` is present.',
    options: ['truncated', 'float'],
  },
} as const
