import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  USYC_API_ENDPOINT: {
    description: 'URL for the USYC price report API',
    type: 'string',
    default: 'https://usyc.hashnote.com/api/price-reports',
  },
})
