import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  CANTON_API_URL: {
    description: 'Digital Asset API endpoint URL for CBTC token metadata',
    type: 'string',
  },
  ATTESTER_API_URLS: {
    description: 'Comma-separated list of Attester API base URLs for CBTC supply',
    type: 'string',
  },
  BACKGROUND_EXECUTE_MS: {
    description: 'Interval in milliseconds between background executions',
    type: 'number',
    default: 10_000,
  },
})
