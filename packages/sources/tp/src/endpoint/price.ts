import {
  PriceEndpoint,
  PriceEndpointInputParametersDefinition,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import { makeLogger, ProviderResult } from '@chainlink/external-adapter-framework/util'

import Decimal from 'decimal.js'

import { TpIcapWebsocketGenerics } from '../types'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

const logger = makeLogger('TpIcapPrice')

export type GeneratePriceOptions = {
  sourceName: 'tpSource' | 'icapSource'
  streamName: 'TP' | 'IC'
  sourceOptions?: string[]
}

type GeneratePriceEndpoint = {
  inputParameters: InputParameters<PriceEndpointInputParametersDefinition>
  transport: WebSocketTransport<TpIcapWebsocketGenerics>
}

const isNum = (i: number | undefined) => typeof i === 'number'

let providerDataStreamEstablishedUnixMs: number

export const generatePriceEndpoint = (
  generatePriceOptions: GeneratePriceOptions,
): GeneratePriceEndpoint => ({
  inputParameters: new InputParameters({
    ...priceEndpointInputParametersDefinition,
    [generatePriceOptions.sourceName]: {
      description: `Source of price data for this price pair on the ${generatePriceOptions.streamName} stream`,
      default: 'GBL',
      required: false,
      type: 'string',
      ...(generatePriceOptions.sourceOptions
        ? { options: generatePriceOptions.sourceOptions }
        : {}),
    },
  }),
  transport: new WebSocketTransport<TpIcapWebsocketGenerics>({
    url: ({ adapterSettings: { WS_API_ENDPOINT } }) => WS_API_ENDPOINT,
    handlers: {
      open: (connection, { adapterSettings: { WS_API_USERNAME, WS_API_PASSWORD } }) => {
        logger.debug('Opening WS connection')

        return new Promise((resolve) => {
          connection.addEventListener('message', (event: MessageEvent) => {
            const { msg, sta } = JSON.parse(event.data.toString())
            if (msg === 'auth' && sta === 1) {
              logger.info('Got logged in response, connection is ready')
              providerDataStreamEstablishedUnixMs = Date.now()
              resolve()
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
          logger.debug({ msg: 'Missing expected field `fvs` or `rec` from `sub` message', message })
          return []
        }

        const stream = rec.slice(31, 34)
        if (stream !== generatePriceOptions.streamName) {
          logger.debug({
            msg: `Only ${generatePriceOptions.streamName} forex prices accepted on this adapter. Filtering out this message.`,
            message,
          })
          return []
        }

        const { ASK, BID, MID_PRICE } = fvs

        if (!isNum(MID_PRICE) && !(isNum(BID) && isNum(ASK))) {
          const errorMessage = '`sub` message did not include required price fields'
          logger.debug({ errorMessage, message })
          return []
        }

        const result =
          MID_PRICE ||
          new Decimal(ASK as number)
            .add(BID as number)
            .div(2)
            .toNumber()

        const base = rec.slice(5, 8)
        const quote = rec.slice(8, 11)
        const source = rec.slice(15, 18)

        return [
          {
            params: { base, quote, [generatePriceOptions.sourceName]: source },
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
        ] as unknown as ProviderResult<TpIcapWebsocketGenerics>[]
      },
    },
  }),
})

export const { inputParameters, transport } = generatePriceEndpoint({
  sourceName: 'tpSource',
  streamName: 'TP',
})

export const priceEndpoint = new PriceEndpoint<TpIcapWebsocketGenerics>({
  name: 'price',
  aliases: ['forex'],
  transport,
  inputParameters,
})
