import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { createAdapterResponseFromMessage } from '../transport/depth-shared'
import { createHttpTransport } from '../transport/shared-http'
import { createWsTransport } from '../transport/shared-ws'
import { getApiKeyForRegion, inputParameters } from './shared'

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number | null
    Data: {
      askPrice: number | null
      bidPrice: number | null
      midPrice: number | null
      askVolume: number | null
      bidVolume: number | null
    }
  }
  Settings: typeof config.settings
}

const DEPTH_ENDPOINT_CONFIGS = [
  { region: 'hk', apiPath: 'stock', name: 'hk-depth' },
  { region: 'cn', apiPath: 'stock', name: 'cn-depth' },
  { region: 'gb', apiPath: 'indices', name: 'indices-depth' },
  { region: 'kr', apiPath: 'stock', name: 'kr-depth' },
  { region: 'jp', apiPath: 'stock', name: 'jp-depth' },
  { region: 'tw', apiPath: 'stock', name: 'tw-depth' },
]

export const endpoints = DEPTH_ENDPOINT_CONFIGS.map(({ region, apiPath, name }) => {
  const apiKey = getApiKeyForRegion(region)
  const type = 'depth'
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
