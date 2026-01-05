import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  CANTON_API_URL: {
    description: 'Digital Asset API endpoint URL for CBTC token metadata',
    type: 'string',
    required: true,
  },
})
