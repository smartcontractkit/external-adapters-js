import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  TRADINGHOURS_ADAPTER_URL: {
    description: 'URL of the TradingHours adapter',
    type: 'string',
    required: true,
  },
  NCFX_ADAPTER_URL: {
    description: 'URL of the NCFX adapter',
    type: 'string',
    required: true,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 1_000,
  },
})
