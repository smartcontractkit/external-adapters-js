import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { config } from '../config'
import { createAdapterResponseFromMessage } from '../transport/quotes'
import { createHttpTransport } from '../transport/shared-http'
import { createWsTransport } from '../transport/shared-ws'
import { inputParameters } from './shared'

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number | null
    Data: {
      symbol: string
      askPrice: number
      bidPrice: number
      midPrice: number
      askVolume: number
      bidVolume: number
    }
  }
  Settings: typeof config.settings
}

const QUOTES_ENDPOINT_CONFIGS: { apiPath: string; name: string }[] = [
  { apiPath: 'stock', name: 'stock_quotes' },
  { apiPath: 'indices', name: 'indices_quotes' },
]

export const endpoints = QUOTES_ENDPOINT_CONFIGS.map(({ apiPath, name }) => {
  const type = 'depth'
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
