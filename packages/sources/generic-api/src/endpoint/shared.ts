export const sharedInputParameterConfig = {
  apiName: {
    required: true,
    type: 'string',
    description: 'Used as prefix for environment variables to find API config',
  },
  ripcordPath: {
    required: false,
    type: 'string',
    description: 'The path to the ripcord field if expected',
  },
  ripcordDisabledValue: {
    default: 'false',
    type: 'string',
    description:
      'If the ripcord field has a different value than this, the adapter will return an error.',
  },
  providerIndicatedTimePath: {
    required: false,
    type: 'string',
    description:
      'JSON path to extract the timestamp from the API response. Supports ISO 8601 datetime strings (e.g., "2026-01-19T06:56:22.194Z") or Unix milliseconds (number). The value will be placed in timestamps.providerIndicatedTimeUnixMs.',
  },
} as const
