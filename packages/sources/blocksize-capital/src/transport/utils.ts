import { WebsocketReverseMappingTransport } from '@chainlink/external-adapter-framework/transports'
import type { WebsocketTransportGenerics } from '@chainlink/external-adapter-framework/transports/websocket'
import {
  ProviderResult,
  SingleNumberResultResponse,
  makeLogger,
} from '@chainlink/external-adapter-framework/util'

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
export type TickerParam = { base: string; quote: string }

export const buildTicker = (param: TickerParam) => `${param.base}${param.quote}`.toUpperCase()
export const buildTickers = (params: TickerParam[]) => params.map(buildTicker)
export const buildBlocksizeWebsocketTickersMessage = (method: string, pairs: string[]) =>
  buildBlocksizeWebsocketMessage(method, { tickers: pairs })

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
        if (parsed.error.message === 'invalid API key') {
          logger.warn(`Possible Solutions:
            1. Doublecheck your supplied credentials.
            2. Contact Data Provider to ensure your subscription is active
            3. If credentials are supplied under the node licensing agreement with Chainlink Labs, please contact us.`)
        }
        reject(new Error(`Failed to make WS connection: ${JSON.stringify(parsed)}`))
      }
    })
    const message = buildBlocksizeWebsocketAuthMessage(apiKey)
    connection.send(JSON.stringify(message))
  })
}

type SingleNumberWsTransportGenerics = WebsocketTransportGenerics & {
  Response: SingleNumberResultResponse
}

export const handlePriceUpdates = <T extends SingleNumberWsTransportGenerics>(
  updates: VwapUpdate[],
  transport: WebsocketReverseMappingTransport<T, string>,
): ProviderResult<T>[] | undefined => {
  const results: ProviderResult<T>[] = []
  for (const update of updates) {
    const params = transport.getReverseMapping(update.ticker)
    if (!params) {
      continue
    }
    if (!update.price) {
      const { base, quote } = params as unknown as TickerParam
      const errorMessage = `The data provider didn't return any value for ${base}/${quote}`
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
