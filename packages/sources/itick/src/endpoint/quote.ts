import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { createAdapterResponseFromMessage } from '../transport/quote-shared'
import { createHttpTransport } from '../transport/shared-http'
import { createWsTransport } from '../transport/shared-ws'
import { getApiKeyForRegion, inputParameters } from './shared'

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      lastPrice: number
    }
  }
  Settings: typeof config.settings
}

const QUOTE_ENDPOINT_CONFIGS = [
  { region: 'hk', apiPath: 'stock', name: 'hk-quote' },
  { region: 'cn', apiPath: 'stock', name: 'cn-quote' },
  { region: 'gb', apiPath: 'indices', name: 'indices-quote' },
  { region: 'kr', apiPath: 'stock', name: 'kr-quote' },
  { region: 'jp', apiPath: 'stock', name: 'jp-quote' },
  { region: 'tw', apiPath: 'stock', name: 'tw-quote' },
]

export const endpoints = QUOTE_ENDPOINT_CONFIGS.map(({ region, apiPath, name }) => {
  const apiKey = getApiKeyForRegion(region)
  const type = 'quote'
  const messageHandler = createAdapterResponseFromMessage

  return new AdapterEndpoint({
    name,
    aliases: [],
    defaultTransport: 'ws',
    transportRoutes: new TransportRoutes<BaseEndpointTypes>()
      .register('rest', createHttpTransport({ type, region, apiKey, apiPath, messageHandler }))
      .register('ws', createWsTransport({ type, region, apiKey, apiPath, messageHandler })),
    inputParameters,
    customInputValidation: (_request, _settings): undefined => {
      const apiKeyName = `API_KEY_${region.toUpperCase()}`
      if (!process.env[apiKeyName]) {
        throw new AdapterInputError({
          statusCode: 500,
          message: `Missing environment variable ${apiKeyName}`,
        })
      }
      return
    },
  })
})
