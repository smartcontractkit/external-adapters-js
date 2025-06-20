import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for OnRe',
    type: 'string',
    default: 'https://onre-api-prod.ew.r.appspot.com/nav',
  },
  NAV_PRICE_PRECISION: {
    description: 'Precision for NAV Price Data',
    type: 'number',
    default: 17,
  },
  AUM_PRECISION: {
    description: 'Precison for AUM Data',
    type: 'number',
    default: 26,
  },
})
