import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  WS_API_USERNAME: {
    description: 'API user for WS endpoint',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_API_PASSWORD: {
    description: 'API password for WS endpoint',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_API_ENDPOINT: {
    description: 'Endpoint for WS prices',
    type: 'string',
    default: 'ws://json.mktdata.portal.apac.parametasolutions.com:12000',
  },
})
