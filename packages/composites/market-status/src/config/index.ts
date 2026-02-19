import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  TRADINGHOURS_ADAPTER_URL: {
    description: 'URL of the TradingHours adapter',
    type: 'string',
    required: true,
    sensitive: false,
  },
  NCFX_ADAPTER_URL: {
    description: 'URL of the NCFX adapter',
    type: 'string',
    required: true,
    sensitive: false,
  },
  FINNHUB_SECONDARY_ADAPTER_URL: {
    description: 'URL of the Finnhub Secondary adapter',
    type: 'string',
    required: true,
    sensitive: false,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 1_000,
    sensitive: false,
  },
})
