export const customSettings = {
  API_ENDPOINT: {
    description: 'API endpoint for iex-cloud',
    default: 'https://cloud.iexapis.com/stable',
    type: 'string',
  },
  API_KEY: {
    description:
      'An API key that can be obtained from [here](https://iexcloud.io/cloud-login#/register/)',
    type: 'string',
    required: true,
    sensitive: true,
  },
} as const
