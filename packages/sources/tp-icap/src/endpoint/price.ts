import {
  PriceEndpoint,
  priceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import {
  WebSocketTransport,
  WebSocketRawData,
} from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

import Decimal from 'decimal.js'

import { TPICAPWebsocketGenerics } from '../types'

const logger = makeLogger('TPICAPPrice')

const isNum = (i: any) => typeof i === 'number'

const transport: WebSocketTransport<TPICAPWebsocketGenerics> =
  new WebSocketTransport<TPICAPWebsocketGenerics>({
    url: ({ adapterConfig: { WS_API_ENDPOINT } }) => WS_API_ENDPOINT,
    handlers: {
      open: (connection, { adapterConfig: { WS_API_USERNAME, WS_API_PASSWORD } }) => {
        logger.debug('Opening WS connection')

        return new Promise((resolve, reject) => {
          connection.on('message', (data: WebSocketRawData) => {
            const { msg, sta } = JSON.parse(data.toString())
            if (msg === 'auth' && sta === 1) {
              logger.info('Got logged in response, connection is ready')
              resolve()
            } else {
              reject(new Error('Failed to make WS connection'))
            }
          })
          const options = {
            msg: 'auth',
            user: WS_API_USERNAME,
            pass: WS_API_PASSWORD,
            mode: 'broadcast',
          }
          connection.send(JSON.stringify(options))
        })
      },
      message: (message) => {
        logger.debug({ msg: 'Received message from WS', message })

        if (!('msg' in message) || message.msg === 'auth') return []

        const { fvs, rec } = message

        if (!fvs || !rec) {
          logger.error({ msg: 'Missing expected field `fvs` or `rec` from `sub` message', message })
          return []
        }

        const { ACTIV_DATE, ASK, BID, MID_PRICE, TIMACT } = fvs

        const base = rec.slice(5, 8)
        const quote = rec.slice(8, 11)

        if (!isNum(MID_PRICE) && !(isNum(BID) && isNum(ASK))) {
          const errorMessage = 'TP ICAP `sub` message did not include required price fields'
          logger.debug({ errorMessage, message })
          return []
        }

        const result =
          MID_PRICE ||
          new Decimal(ASK as number)
            .add(BID as number)
            .div(2)
            .toNumber()

        return [
          {
            params: {
              base,
              quote,
            },
            response: {
              result,
              data: {
                result,
              },
              timestamps: {
                providerIndicatedTimeUnixMs:
                  ACTIV_DATE && TIMACT ? new Date(ACTIV_DATE + ' ' + TIMACT).getTime() : undefined,
              },
            },
          },
        ]
      },
    },
  })

export const priceEndpoint = new PriceEndpoint<TPICAPWebsocketGenerics>({
  name: 'price',
  aliases: ['forex'],
  transport,
  inputParameters: priceEndpointInputParameters,
})
