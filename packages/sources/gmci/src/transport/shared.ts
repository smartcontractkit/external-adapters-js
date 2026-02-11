// import { WebSocketTransportConfig } from '@chainlink/external-adapter-framework/transports'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { BaseEndpointTypes } from '../endpoint/shared'
import { convertTimetoUnixMs } from './util'

export interface PriceMessage {
  last_updated: string
  price: number
  symbol: string
}

export interface RebalanceMessage {
  end_time: string
  start_time: string
  status: string
  symbol: string
}

interface WsPriceResponse {
  success: boolean
  data: Array<PriceMessage>
  topic: 'price'
}

interface WsRebalanceResponse {
  success: boolean
  data: Array<RebalanceMessage>
  topic: 'rebalance_status'
}

export type WsResponse = WsPriceResponse | WsRebalanceResponse

export type WsTransportTypes = BaseEndpointTypes & {
  Provider: {
    WsMessage: WsResponse
  }
}

const logger = makeLogger('GmciTransport')

export const baseOptions = {
  handlers: {
    message(message: WsResponse) {
      if (message.success === false) {
        logger.info(message)
        return
      }

      const results = []

      if (message.topic === 'price') {
        for (const item of message.data) {
          results.push({
            params: { symbol: item.symbol },
            response: {
              result: item.price,
              data: {
                result: item.price,
                symbol: item.symbol,
              },
              timestamps: {
                providerIndicatedTimeUnixMs: convertTimetoUnixMs(item.last_updated),
              },
            },
          })
        }
      }
      return results
    },
  },

  builders: {
    subscribeMessage: (params: TypeFromDefinition<BaseEndpointTypes['Parameters']>) => {
      return {
        op: 'subscribe',
        args: [`price.${params.symbol}`.toLowerCase()],
      }
    },

    unsubscribeMessage: (params: TypeFromDefinition<BaseEndpointTypes['Parameters']>) => {
      return {
        op: 'unsubscribe',
        args: [`price.${params.symbol}`.toLowerCase()],
      }
    },
  },
}
