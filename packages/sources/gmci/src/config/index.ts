import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  GMCI_API_KEY: {
    description: 'An API key for Data Provider',
    type: 'string',
    required: true,
    sensitive: true,
  },
  GMCI_WS_API_ENDPOINT: {
    description: 'WS endpoint for GMCI Data Provider',
    type: 'string',
    required: false,
    default: 'wss://api.gmci.co/private',
  },
  WINTERMUTE_API_KEY: {
    description: 'An API key for Data Provider',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WINTERMUTE_WS_API_ENDPOINT: {
    description: 'WS endpoint for GMCI Data Provider',
    type: 'string',
    required: false,
    default: 'wss://generic-alb-ty.api.wintermute-rfq.xyz:15494/private',
  },
})
