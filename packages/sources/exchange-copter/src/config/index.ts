import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'API Endpoint to use for Exchange Copter ARSx reserves',
    type: 'string',
    default: 'https://api.exchangecopter.com/arsx/reserve',
    sensitive: false,
  },
})
