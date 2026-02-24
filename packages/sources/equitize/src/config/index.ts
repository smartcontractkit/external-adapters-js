import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for Equitize',
    type: 'string',
    default: 'https://staging-mint-5ylweigmlq-el.a.run.app',
  },
})
