import {
  IncludesFile,
  PriceEndpoint,
  PriceEndpointInputParameters,
} from '@chainlink/external-adapter-framework/adapter'
import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports/websocket'
import {
  AdapterRequest,
  makeLogger,
  ProviderResult,
} from '@chainlink/external-adapter-framework/util'
import { priceEndpointInputParameters } from '@chainlink/external-adapter-framework/adapter'
import includes from '../config/includes.json'

import Decimal from 'decimal.js'

import { IncludesMap, PriceRequestContext, TpIcapWebsocketGenerics } from '../types'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

const logger = makeLogger('TpIcapPrice')

const inputParameters = {
  ...priceEndpointInputParameters,
  tpIcapInverse: {
    description:
      'Whether to invert the response. Note: this does not alter or switch base and quote symbols. Primarily for use with pair symbol overrides.',
    default: false,
    required: false,
    type: 'boolean',
  },
} satisfies InputParameters & PriceEndpointInputParameters

const isNum = (i: number | undefined) => typeof i === 'number'

// Copied from '@chainlink/external-adapter-framework/adapter/price'
const buildIncludesMap = (includesFile: IncludesFile) => {
  const includesMap: IncludesMap = {}

  for (const { from, to, includes } of includesFile) {
    if (!includesMap[from]) {
      includesMap[from] = {}
    }
    includesMap[from][to] = includes[0]
  }

  return includesMap
}

const includesMap = buildIncludesMap(includes)

const requestTransform = (req: AdapterRequest<TpIcapWebsocketGenerics['Request']>): void => {
  const requestContext = req.requestContext as PriceRequestContext<
    TpIcapWebsocketGenerics['Request']['Params']
  >
  const requestData = requestContext.data as {
    rec?: string
    base?: string
    quote?: string
    tpIcapInverse?: boolean
  }

  if (requestData.base?.length === 33) {
    // Handle full code uniquely
    requestData.rec = requestData.base
    const inverse = requestData?.tpIcapInverse || false
    requestContext.priceMeta = { inverse }
  } else if (requestData.base?.length === 3 && requestData.quote) {
    // Handle short symbols
    const includesDetails = includesMap?.[requestData.base]?.[requestData.quote]

    if (includesDetails) {
      requestData.base = includesDetails.from || requestData.base
      requestData.quote = includesDetails.to || requestData.quote
    }

    requestData.rec = `FXSPT${requestData.base}${requestData.quote}SPT:GBL.BIL.QTE.RTM!TP`

    const inverse = includesDetails?.inverse || false
    requestContext.priceMeta = { inverse }
  } else {
    logger.error(
      `Error: request did not include a base symbol with the correct length. baseLength=${requestData.base?.length}`,
    )
  }

  delete requestData.base
  delete requestData.quote
  delete requestData.tpIcapInverse
}

let providerDataStreamEstablishedUnixMs: number

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
            params: { rec },
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
  })

export const priceEndpoint = new PriceEndpoint<TpIcapWebsocketGenerics>({
  name: 'price',
  aliases: ['forex'],
  transport,
  inputParameters,
  requestTransforms: [requestTransform],
})
