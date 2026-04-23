import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { config } from '../config'
import { createAdapterResponseFromMessage } from '../transport/quote-shared'
import { createHttpTransport } from '../transport/shared-http'
import { createWsTransport } from '../transport/shared-ws'
import { inputParameters } from './shared'

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

const QUOTE_ENDPOINT_CONFIGS: { apiPath: string; name: string }[] = [
  { apiPath: 'stock', name: 'stock-quote' },
  { apiPath: 'indices', name: 'indices-quote' },
]

export const endpoints = QUOTE_ENDPOINT_CONFIGS.map(({ apiPath, name }) => {
  const type = 'quote'
  const messageHandler = createAdapterResponseFromMessage

  return new AdapterEndpoint({
    name,
    aliases: [],
    defaultTransport: 'ws',
    transportRoutes: new TransportRoutes<BaseEndpointTypes>()
      .register('rest', createHttpTransport({ type, apiPath, messageHandler }))
      .register('ws', createWsTransport({ type, apiPath, messageHandler })),
    inputParameters,
  })
})
