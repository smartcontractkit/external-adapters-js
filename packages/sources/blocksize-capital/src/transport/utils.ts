import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports'
import { ProviderResult, makeLogger } from '@chainlink/external-adapter-framework/util'
import { WsTransportTypes as PriceWsTransportTypes } from './price'
import { WsTransportTypes as VwapWsTransportTypes } from './vwap'

const logger = makeLogger('BlocksizeCapitalTransportUtils')

export interface BaseMessage {
  jsonrpc: string
  id?: string | number | null
  method?: string
}

export type VwapUpdate = {
  ticker: string
  price?: number
  size?: number
  volume?: number
  ts: number
}

export type ProviderParams = {
  tickers?: string[]
  api_key?: string
}

const buildBlocksizeWebsocketMessage = (method: string, params: ProviderParams): unknown => {
  return {
    jsonrpc: '2.0',
    method: method,
    params: params,
  }
}

export const buildBlocksizeWebsocketAuthMessage = (apiKey: string) =>
  buildBlocksizeWebsocketMessage('authentication_logon', { api_key: apiKey })
export const buildBlocksizeWebsocketTickersMessage = (method: string, pair: string) =>
  buildBlocksizeWebsocketMessage(method, { tickers: [pair] })

export const blocksizeDefaultUnsubscribeMessageBuilder = (
  base: string,
  quote: string,
  method: string,
): unknown => {
  const pair = `${base}${quote}`.toUpperCase()
  return buildBlocksizeWebsocketTickersMessage(method, pair)
}

// use as open handler for standard WS connections
export const blocksizeDefaultWebsocketOpenHandler = (
  connection: WebSocket,
  apiKey: string,
): Promise<void> | void => {
  return new Promise((resolve, reject) => {
    connection.addEventListener('message', (event: MessageEvent<BaseMessage>) => {
      const parsed = JSON.parse(event.data.toString())
      if (parsed.result?.user_id) {
        logger.debug('Got logged in response, connection is ready')
        resolve()
      } else {
        reject(new Error('Failed to make WS connection'))
      }
    })
    const message = buildBlocksizeWebsocketAuthMessage(apiKey)
    connection.send(JSON.stringify(message))
  })
}

export const handlePriceUpdates = (
  updates: VwapUpdate[],
  transport: WebsocketReverseMappingTransport<any, any>,
): ProviderResult<PriceWsTransportTypes | VwapWsTransportTypes>[] | undefined => {
  const results = []
  for (const update of updates) {
    const params = transport.getReverseMapping(update.ticker)
    if (!params) {
      continue
    }
    if (!update.price) {
      const errorMessage = `The data provider didn't return any value for ${params.base}/${params.quote}`
      logger.info(errorMessage)
      results.push({
        params,
        response: {
          statusCode: 502,
          errorMessage,
        },
      })
    } else {
      results.push({
        params,
        response: {
          result: update.price,
          data: {
            result: update.price,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: update.ts,
          },
        },
      })
    }
  }
  return results
}
