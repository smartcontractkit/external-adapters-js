import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { config } from '../config'
import { createAdapterResponseFromMessage } from '../transport/quote-shared'
import { createHttpTransport } from '../transport/shared-http'
import { createWsTransport } from '../transport/shared-ws'
import { Region, getApiKeyForRegion, inputParameters } from './shared'

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      symbol: string
      lastPrice: number
    }
  }
  Settings: typeof config.settings
}

const QUOTE_ENDPOINT_CONFIGS: { region: Region; apiPath: string; name: string }[] = [
  { region: 'hk', apiPath: 'stock', name: 'hk-quote' },
  { region: 'cn', apiPath: 'stock', name: 'cn-quote' },
  { region: 'gb', apiPath: 'indices', name: 'indices-quote' },
  { region: 'kr', apiPath: 'stock', name: 'kr-quote' },
  { region: 'jp', apiPath: 'stock', name: 'jp-quote' },
  { region: 'tw', apiPath: 'stock', name: 'tw-quote' },
]

export const endpoints = QUOTE_ENDPOINT_CONFIGS.map(({ region, apiPath, name }) => {
  const type = 'quote'
  const messageHandler = createAdapterResponseFromMessage

  return new AdapterEndpoint({
    name,
    aliases: [],
    defaultTransport: 'ws',
    transportRoutes: new TransportRoutes<BaseEndpointTypes>()
      .register('rest', createHttpTransport({ type, region, apiPath, messageHandler }))
      .register('ws', createWsTransport({ type, region, apiPath, messageHandler })),
    inputParameters,
    customInputValidation: (_request, settings): undefined => {
      getApiKeyForRegion(region, settings)
      return
    },
  })
})
