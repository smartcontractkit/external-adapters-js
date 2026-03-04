import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for OnRe',
    type: 'string',
    default: 'https://core.api.onre.finance/data/nav',
  },
})
