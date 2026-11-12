import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for FXMacroData, sent in the `X-API-Key` header',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'API endpoint for FXMacroData',
    type: 'string',
    default: 'https://api.fxmacrodata.com/v1',
    sensitive: false,
    validate: {
      meta: {
        details: 'Value must be an HTTPS URL',
      },
      fn: (value?: string) => {
        if (value && !value.startsWith('https://')) {
          return `API_ENDPOINT must be an HTTPS URL. Received ${value}`
        }
        return
      },
    },
  },
})
