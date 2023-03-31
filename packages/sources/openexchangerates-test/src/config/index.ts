import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'API endpoint for OpenExchangeRates',
    default: 'https://openexchangerates.org/api/',
    type: 'string',
  },
  API_KEY: {
    description:
      'An API key that can be obtained from [here](https://openexchangerates.org/signup)',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
