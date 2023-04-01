import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { AdapterRequest, makeLogger } from '@chainlink/external-adapter-framework/util'
import { priceEndpointInputParameters } from '@chainlink/external-adapter-framework/adapter'

import Decimal from 'decimal.js'

import { TpIcapWebsocketGenerics } from '../types'

const logger = makeLogger('TpIcapPrice')

const isNum = (i: number | undefined) => typeof i === 'number'

let providerDataStreamEstablishedUnixMs: number

const requestTransform = (req: AdapterRequest<TpIcapWebsocketGenerics['Request']>): void => {
  const { base, quote } = req.requestContext.data

  if (base.length === 3) {
    req.requestContext.data.rec = `FXSPT${base}${quote}SPT:GBL.BIL.QTE.RTM!TP`
  } else {
    req.requestContext.data.rec = base
    req.requestContext.data.base = base.slice(5, 8)
  }

  //TODO handle inverses (ex. base/quote = EUR/USD but only USD/EUR is available, or for any base code sent that has USD as base within)
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

        return [
          {
            params: {
              base: rec.slice(5, 8),
              quote: rec.slice(8, 11),
              rec,
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
  inputParameters: priceEndpointInputParameters,
  requestTransforms: [requestTransform],
})
