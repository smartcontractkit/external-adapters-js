import {
  PriceEndpoint,
  PriceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { InputParameter } from '@chainlink/external-adapter-framework/validation/input-params'

import Decimal from 'decimal.js'

import { TpIcapWebsocketGenerics } from '../types'

const logger = makeLogger('TpIcapPrice')

const isNum = (i: number | undefined) => typeof i === 'number'

let providerDataStreamEstablishedUnixMs: number

const inputParameters: PriceEndpointInputParameters & { TpIcapSource: InputParameter } = {
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    description: 'The symbol of the currency to convert to',
    required: true,
  },
  TpIcapSource: {
    description: 'Source feed to use for the reference price',
    default: 'TP',
    options: ['TP', 'IC'],
  },
}

export const transport: WebSocketTransport<TpIcapWebsocketGenerics> =
  new WebSocketTransport<TpIcapWebsocketGenerics>({
    url: ({ adapterSettings: { WS_API_ENDPOINT } }) => WS_API_ENDPOINT,
    handlers: {
      open: (connection, { adapterSettings: { WS_API_USERNAME, WS_API_PASSWORD } }) => {
        logger.debug('Opening WS connection')

        return new Promise((resolve, reject) => {
          connection.addEventListener('message', (event: MessageEvent) => {
            const { msg, sta, info } = JSON.parse(event.data.toString())
            if (msg === 'auth' && sta === 1) {
              logger.info('Got logged in response, connection is ready')
              providerDataStreamEstablishedUnixMs = Date.now()
              resolve()
            } else {
              logger.error({ sta, info })
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

        const providerDataReceivedUnixMs = Date.now()

        if (!('msg' in message) || message.msg === 'auth') return []

        const { fvs, rec, sta } = message

        if (!fvs || !rec || sta !== 1) {
          logger.error({ msg: 'Missing expected field `fvs` or `rec` from `sub` message', message })
          return []
        }

        const { ASK, BID, MID_PRICE } = fvs

        if (!isNum(MID_PRICE) && !(isNum(BID) && isNum(ASK))) {
          const errorMessage = 'TP ICAP `sub` message did not include required price fields'
          logger.debug({ errorMessage })
          return []
        }

        const result =
          MID_PRICE ||
          new Decimal(ASK as number)
            .add(BID as number)
            .div(2)
            .toNumber()

        logger.trace({
          cachedVal: [
            {
              params: {
                base: rec.slice(5, 8),
                quote: rec.slice(8, 11),
                TpIcapSource: rec.slice(31, 33),
              },
              response: {
                result,
                data: {
                  result,
                },
                timestamps: {
                  providerDataReceivedUnixMs,
                  providerDataStreamEstablishedUnixMs,
                  providerIndicatedTimeUnixMs: undefined,
                },
              },
            },
          ],
        })
        return [
          {
            params: {
              base: rec.slice(5, 8),
              quote: rec.slice(8, 11),
              TpIcapSource: rec.slice(31, 33),
            },
            response: {
              result,
              data: {
                result,
              },
              timestamps: {
                providerDataReceivedUnixMs,
                providerDataStreamEstablishedUnixMs,
                providerIndicatedTimeUnixMs: undefined,
              },
            },
          },
        ]
      },
    },
  })

export const priceEndpoint = new PriceEndpoint<TpIcapWebsocketGenerics>({
  name: 'price',
  aliases: ['forex'],
  transport,
  inputParameters,
})
