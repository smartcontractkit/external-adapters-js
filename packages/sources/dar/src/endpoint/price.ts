import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import {
  PriceEndpoint,
  priceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { PriceEndpointTypes } from '../types'
import { getAuthToken } from '../util'
import { WS_HEARTBEAT_MS } from '../config'

const logger = makeLogger('DarPriceEndpoint')

const pairHits: {
  [base: string]: {
    [quote: string]: number
  }
} = {}
let totalUniquePairs = 0
let totalHits = 0

function heartbeat(connection: WebSocket): NodeJS.Timeout | undefined {
  if (!connection) return
  if (connection.readyState !== 1) return
  logger.debug('pinging....')
  connection.send('Ping')
  return setTimeout(() => heartbeat(connection), WS_HEARTBEAT_MS)
}

export const priceTransport = new WebSocketTransport<PriceEndpointTypes>({
  url: (context) => context.adapterConfig.WS_API_ENDPOINT,
  options: async (context) => {
    const token = await getAuthToken(context.adapterConfig)
    return {
      headers: { Authorization: token },
    }
  },
  handlers: {
    open(connection) {
      const heartbeatTimeout = heartbeat(connection)
      connection.on('close', async () => {
        clearTimeout(heartbeatTimeout)
      })
    },
    message(message) {
      if (message.errors) {
        logger.error(`Got error from DP: ${message.errors}`)
        return []
      }

      const { darAssetTicker: base, quoteCurrency: quote } = message
      if (!pairHits[base]) pairHits[base] = {}
      if (!pairHits[base][quote]) {
        pairHits[base][quote] = 1
        totalUniquePairs += 1
      } else {
        pairHits[base][quote] += 1
      }
      totalHits += 1
      logger.info({ totalHits, totalUniquePairs, pairHits: pairHits[base][quote], base, quote })
      return [
        {
          params: { base: message.darAssetTicker, quote: message.quoteCurrency },
          response: {
            result: message.price,
            data: {
              result: message.price,
            },
            timestamps: {
              providerIndicatedTime: message.effectiveTime * 1000,
            },
          },
        },
      ]
    },
  },
})

export const priceEndpoint = new PriceEndpoint({
  name: 'price',
  transport: priceTransport,
  inputParameters: priceEndpointInputParameters,
  aliases: ['crypto'],
})
