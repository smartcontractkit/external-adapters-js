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
})
