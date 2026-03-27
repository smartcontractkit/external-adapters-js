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
} as const
