import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'

const logger = makeLogger('lo-tech')

export type BasePriceData = {
  type: 'PRICE'
}

export type LoTechErrorMessage = {
  egress_ts: number // microseconds
  error: {
    error: string
    code: number
    id: null
    info: {
      type: string
      failures: {
        symbol: string
        type: string
      }[]
      succeeded: []
    }
  }
}

export type LoTechPongMessage = {
  egress_ts: number // microseconds
  pong: {
    api_version: string
  }
}

export type LoTechPriceMessage<TPriceData extends BasePriceData> = {
  egress_ts: number // microseconds
  data: TPriceData
}

export type LoTechWSResponse<TPriceData extends BasePriceData> =
  | LoTechPriceMessage<TPriceData>
  | LoTechErrorMessage
  | LoTechPongMessage

export type LoTechWsTransportGenerics<TPriceData extends BasePriceData, TResponseData> = {
  Parameters: typeof stockEndpointInputParametersDefinition
  Response: {
    Result: null
    Data: TResponseData
  }
  Settings: typeof config.settings
  Provider: {
    WsMessage: LoTechWSResponse<TPriceData>
  }
}

export type LoTechTransportConfig<TPriceData extends BasePriceData, TResponseData> = {
  url: (context: EndpointContext<LoTechWsTransportGenerics<TPriceData, TResponseData>>) => string
  apiKey: (context: EndpointContext<LoTechWsTransportGenerics<TPriceData, TResponseData>>) => string
  getParamsSymbolFromWsData: (data: TPriceData) => string
  toResponseData: (
    data: TPriceData,
    context: EndpointContext<LoTechWsTransportGenerics<TPriceData, TResponseData>>,
  ) => TResponseData
}

export abstract class LoTechWebSocketTransport<
  TPriceData extends BasePriceData,
  TResponseData,
> extends WebSocketTransport<LoTechWsTransportGenerics<TPriceData, TResponseData>> {
  constructor(loTechConfig: LoTechTransportConfig<TPriceData, TResponseData>) {
    super({
      url: (context) => loTechConfig.url(context),
      options: (context) => ({
        headers: {
          'X-API-KEY': loTechConfig.apiKey(context),
        },
      }),
      handlers: {
        heartbeat(connection) {
          connection.send(
            JSON.stringify({
              op: 'PING',
            }),
          )
        },
        message(message, context) {
          const timestamps = {
            providerIndicatedTimeUnixMs: Math.floor(message.egress_ts / 1000),
          }

          if ('error' in message) {
            logger.error(`Received error message on websocket: ${JSON.stringify(message)}`)
            return message.error.info.failures.map((failure) => ({
              params: { base: failure.symbol },
              response: {
                statusCode: 502,
                errorMessage: failure.type,
                timestamps,
              },
            }))
          }

          if ('pong' in message) {
            // Ignore
            return
          }

          if (message.data?.type !== 'PRICE') {
            logger.warn(`Received unsupported message type: ${message.data?.type}`)
            return
          }

          const base = loTechConfig.getParamsSymbolFromWsData(message.data)
          try {
            return [
              {
                params: { base },
                response: {
                  result: null,
                  data: loTechConfig.toResponseData(message.data, context),
                  timestamps,
                },
              },
            ]
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            const statusCode = error instanceof AdapterError ? error.statusCode : 500

            return [
              {
                params: { base },
                response: {
                  statusCode,
                  errorMessage,
                  timestamps,
                },
              },
            ]
          }
        },
      },
      builders: {
        subscribeMessage: (params) => ({
          op: 'SUBSCRIBE',
          topics: [
            {
              symbol: params.base,
              type: 'PRICE',
            },
          ],
        }),
        unsubscribeMessage: (params) => ({
          op: 'UNSUBSCRIBE',
          topics: [
            {
              symbol: params.base,
              type: 'PRICE',
            },
          ],
        }),
      },
    })
  }
}
